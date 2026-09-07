from re import search
from gen3.commands import send_chunk, build_command, build_heartbeat # TODO
from state import robot_connections, client_connections, pending_requests
from db import get_session, db_commit
from models.persistent_map import Boundary, FloorPlan
from models.robot import Robot
from models.run import Run
from sqlalchemy import select, update
from utils import Generation, get_robot_by_serial
import json
import time
import os

from gen4.handlers import robot_send_request, send_json

from typing import TYPE_CHECKING, Sequence
if TYPE_CHECKING:
    from router import RouterHandler




def post_boundaries(req: RouterHandler, serial: str, map_id: str) -> None:
    """POST /robot/<serial>/maps/<map_id>/boundaries - update map data"""
    if not (data := req.read_json()):
        return

    keys_required = {
        "id",
        "name",
        "color",
        "type",
        "vertices",
        "enabled",
    }

    for boundary in data:
        boundary_keys = {x for x in boundary}
        if keys_required != boundary_keys:
            req.send_bad_request("not all required keys")
            return

    with get_session() as session:
        for boundary in data:
            existing = session.get(Boundary, boundary["id"])

            if existing:
                existing.floorplan = map_id
                existing.name = boundary["name"]
                existing.color = boundary["color"]
                existing.type = boundary["type"]
                existing.vertices = boundary["vertices"]
                existing.enabled = boundary["enabled"]
            else:
                session.add(Boundary(
                    id=boundary["id"],
                    floorplan=map_id,
                    name=boundary["name"],
                    color=boundary["color"],
                    type=boundary["type"],
                    vertices=boundary["vertices"],
                    enabled=boundary["enabled"],
                ))

        if not db_commit(session, req):
            # TODO: error
            return

    req.send_ok()


def get_boundaries(req: RouterHandler, serial: str, map_id: str) -> None:
    """GET /robot/<serial>/maps/<map_id>/boundaries - get boundaries"""

    with get_session() as session:
        boundaries: Sequence[Boundary] = session.execute(
            select(Boundary)
            .where(Boundary.floorplan == map_id)
        ).scalars().all()

    req.send_ok([{
        "id": b.id,
        "name": b.name,
        "enabled": b.enabled,
        "color": b.color,
        "vertices": b.vertices,
        "type": b.type,
    } for b in boundaries])


from PIL import Image, ImageDraw
# Default pixel values. If empirical test on the robot shows different,
# tweak these.
FG_PIXEL = 0xFF  # inside zone
BG_PIXEL = 0x00  # outside zone

# Width of the rasterized line for shape="line" no-go markers (in pgm pixels).
# Increased from 3 to 9: a Neato D10 chassis is ~32 cm wide, so a 12 cm
# nominal line (3 px @ 40 mm/px) was THINNER than the robot itself. The path
# planner treats narrow tracks as informational, not as a hard obstacle, so
# the robot drove right over them. 9 px @ 40 mm/px = 36 cm -- just wider
# than the robot, forcing the planner to route around.
LINE_WIDTH_PX = 9

def _build_pgm_bytes(img: Image.Image, floorplan: FloorPlan) -> bytes:
    """Encode a PIL "L" image as PGM P5 with the Neato metadata comment header."""
    w, h = img.size
    # The rank header observed in samples has the form:
    #   P5
    #   # Neato metadata: origin_x=-40000 origin_y=-40000 resolution=40 alignment=0.008727
    #   2000 2000
    #   255
    #   <binary pixels>
    comment = (
    f"# Neato metadata: origin_x={floorplan.origin[0]} "
    f"origin_y={floorplan.origin[1]} "
    f"resolution={floorplan.resolution} "
    f"alignment={floorplan.alignment:.6f}"        # <- 6 casas decimais
    )
    # IMPORTANT: tracks are loaded into MapLayer2D<unsigned short> (2 bytes per
    # cell, big-endian per PGM P5 spec). Firmware allocates w*h*2 bytes and
    # rejects the load (PM_LOAD_FAIL) if the payload size doesn't match.
    # Reverse-engineered from /usr/bin/robot in firmware 1.7.0-2933, function
    # sub_0x00086bf0: `add x22, x20, x20` (double w*h) then `strh wzr` (store
    # 16-bit halfwords) -> vtable 0x001748d0 -> typeinfo 0x00176c10 =
    # '10MapLayer2DItE' (Itanium ABI 't' = unsigned short).
    header = (
        b"P5\r\n"
        + comment.encode("ascii") + b"\r\n"
        + f"{w} {h}".encode("ascii") + b"\r\n"
        + b"65535\r"                        # <- 2 bytes/pixel, only CR no LF
    )
    # Expand each 8-bit drawn pixel (0x00 or FG_PIXEL=0xFF) to 2 bytes
    # big-endian (0x0000 or 0xFFFF). Slice assignment on bytearray is C-level
    # fast — for a 2000x2000 canvas this is microseconds, not seconds.
    pixels_8 = img.tobytes()
    pixels_16 = bytearray(len(pixels_8) * 2)
    pixels_16[0::2] = pixels_8   # high byte (MSB in big-endian)
    pixels_16[1::2] = pixels_8   # low byte
    return header + bytes(pixels_16)

def get_test(req: RouterHandler, serial: str, map_id: str) -> None:
    """GET /robot/<serial>/maps/<map_id>/test - get boundaries"""

    with get_session() as session:
        floorplan: FloorPlan = session.execute(
            select(FloorPlan).where(FloorPlan.id == map_id)
        ).scalar_one_or_none()

        boundaries: Sequence[Boundary] = session.execute(
            select(Boundary)
            .where(Boundary.floorplan == map_id)
        ).scalars().all()

        promoted_map_id = session.scalar(
            select(FloorPlan.id)
            .where(
                FloorPlan.robot == serial,
                FloorPlan.promoted.is_(True),
            )
        )

    if promoted_map_id is not None: demote_floorplan(serial, promoted_map_id)

    img = Image.new("L", floorplan.imgsize, BG_PIXEL)
    draw = ImageDraw.Draw(img)

    for boundary in boundaries:
        pts = [(p[0] * floorplan.imgsize[0], p[1] * floorplan.imgsize[1]) for p in boundary.vertices]
        draw.line(pts, fill=FG_PIXEL, width=LINE_WIDTH_PX, joint="curve")

    raw = _build_pgm_bytes(img, floorplan)

    with open('./test.pgm', 'wb') as f:
        f.write(raw)


    import base64, zlib


    with open(f'uploads/maps/{serial}/{map_id}/rank_binary.pgm.nz', 'rb') as rank:
        with open(f'uploads/maps/{serial}/{map_id}/real_binary.pgm.nz', 'rb') as real:
            payload = {
                "ability": "maps.promote_floorplan",
                "rank_uuid":     floorplan.id,
                "rank_binary":   base64.b64encode(rank.read()).decode("ascii"),
                "real_binary":   base64.b64encode(real.read()).decode("ascii"),
                "old_rank_uuid": None, # manually demoted
                "base": {
                    "x":   floorplan.base[0],
                    "y":   floorplan.base[1],
                    "dir": floorplan.base[2],
                },
                "date_created":    floorplan.created_at,
                "nogo_track":      {
                    "track_uuid": "a5730f32-3214-4fa8-bfc4-92ca4f83abcf",
                    "binary":     base64.b64encode(zlib.compress(raw, level=9)).decode("ascii"),
                },
                "cleaning_tracks": [],
            }

            print(payload)

            robot_send_request(robot_connections[serial], payload)

            with get_session() as session:
                floor_plan = session.get(FloorPlan, map_id)

                if floor_plan is None:
                    # TODO return error
                    raise ValueError(f"Floor plan {map_id} not found")

                session.execute(
                    update(FloorPlan)
                    .where(
                        FloorPlan.robot == floor_plan.robot,
                        FloorPlan.id != map_id,
                    )
                    .values(promoted=False)
                )

                floor_plan.promoted = True

                session.commit()


    req.send_ok(payload)


def demote_floorplan(serial: str, map_id: str):
    payload = {
        "ability": "maps.demote_floorplan",
        "rank_uuid":     map_id,
    }

    print(payload)

    robot_send_request(robot_connections[serial], payload)

    with get_session() as session:
        session.execute(
            update(FloorPlan)
            .where(
                FloorPlan.robot == serial,
                FloorPlan.id == map_id,
            )
            .values(promoted=False)
        )

        session.commit()
    
def delete_demote_floorplan(req: RouterHandler, serial: str, map_id: str) -> None:
    """DELETE /robot/<serial>/maps/<map_id> - demote floorplan"""

    demote_floorplan(serial, map_id)

    req.send_ok()


