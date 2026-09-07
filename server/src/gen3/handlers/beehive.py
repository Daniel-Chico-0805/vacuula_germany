import json
import re
import state
from gen3.utils import extract_robot_serial, get_robot_serial
from gen3.map_utils import parse_session
from db import get_session, db_commit
from models.robot import Robot
from models.persistent_map import PersistentMap
from models.run import Run
import os
from sqlalchemy import select
import socket
from datetime import datetime

from typing import TYPE_CHECKING, Literal
if TYPE_CHECKING:
    from handlers.router import RouterHandler



def post_links(req: RouterHandler) -> None:
    """POST /links - link robot to server"""
    print("links!")
    if not (data := req.read_json()): return
    if not (serial := get_robot_serial(req)): return

    password = data.get("secret_key", "")
    name = data.get("name", "")

    if not password or not name:
        print("[BEEHIVE ERROR] password or name not defined!")
        req.send_bad_request("password or name missing")
        return

    with get_session() as session:
        if not db_commit(session, req, Robot(serial=serial, name=name, password=password)):
            return

    req.send_ok()


def persistent_maps(req: RouterHandler) -> None:
    """GET /persistent_maps - list enabled persistent maps for robot"""
    if not (serial := get_robot_serial(req)): return

    with get_session() as session:
        maps = session.execute(
            select(PersistentMap.id, PersistentMap.robot)
            .where(PersistentMap.enabled == True)
            .where(PersistentMap.robot == serial)
        ).all()

    req.send_ok([{"id": m.id} for m in maps])


def upload_init(req: RouterHandler, upload_type: Literal["maps", "logs"]) -> None:
    """POST /maps/upload_jobs - robot initiate map upload"""

    if not (data := req.read_json()): return
    if not (serial := get_robot_serial(req)): return

    map_id = data.get("group_id")
    if not map_id:
        print("[BEEHIVE ERROR] upload id not defined!")
        req.send_bad_request("upload id missing")
        return

    res = {
        "id": map_id,
        "post_url": "test-s3.neatocloud.com",
        "params": {
            "key": serial,
            "AWSAccessKeyId": upload_type,
            "acl": "vacuula-unused",
            "policy": "vacuula-unused",
            "signature": map_id,
            "Content-Type": "application/octet-stream",
            "success_action_status": "201"
        }
    }

    req.send_created(res, False)



def upload_finish(req: RouterHandler, upload_type:Literal["maps", "logs"], job_id: str) -> None:
    """PUT /maps/upload_jobs/{id} - update upload job status - robot done"""
    if not (data := req.read_json()): return

    if not job_id or upload_type not in ('maps', 'logs'):
        req.send_bad_request("params bad")
        return

    if not (serial := get_robot_serial(req)): return

    if not data.get('success'):
        print("[BEEHIVE ERROR] upload did not work")
        req.send_bad_request("You said upload failed?")
    
    
    # we can now close the request to robot when we are getting logs
    if upload_type == 'logs':
        req.send_created()
        return
    
    # only maps should get the extra parsing

    job_folder = f"uploads/maps/{serial}/{job_id}"
    floor_map_path = f"{job_folder}/FloorMap.png"
    manifest_path = f"{job_folder}/manifest.json"
    run_map_path = f"{job_folder}/RunMap.png"
    if not all(os.path.isfile(p) for p in [floor_map_path, manifest_path, run_map_path]):
        print(f"[BEEHIVE ERROR]: Missing files for job {job_id}")
        req.send_bad_request('files missing for upload')
        return
    
    manifest: dict
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
    except Exception:
        print("[BEEHIVE ERROR] manifest read error!")
        req.send_internal_error()
        return

    robot_serial_in_manifest = manifest.get("robot_serial")
    run = manifest.get("run") or {}
    run_id = run.get("id")
    valid_as_persistent_map = run.get("valid_as_persistent_map")

    if robot_serial_in_manifest != serial or run_id != job_id:
        req.send_bad_request("stuff no match")
        print("[BEEHIVE ERROR] stuff didnt match!")
        return

    # we can now close the connection for the maps, further parsing can be done of data
    req.send_ok() # TODO: send ok for actaully closing the upload

    floor_data, run_data = parse_session(floor_map_path, run_map_path, job_folder)


    start_at = run.get("start_at", "")
    start_at_ts = int(datetime.fromisoformat(start_at.replace("Z", "+00:00")).timestamp() * 1000)
    end_at = run.get("end_at", "")
    end_at_ts = int(datetime.fromisoformat(end_at.replace("Z", "+00:00")).timestamp() * 1000)

    charge_at_start = run.get("run_charge_at_start")
    charge_at_end = run.get("run_charge_at_end")
    cleaned_area = run.get("cleaned_area")

    persistent_map_id = run.get("persistent_map_id")


    with get_session() as session:
        if valid_as_persistent_map:
            if not db_commit(session, req, PersistentMap(
                id=run_id,
                robot=serial,
                name="Persistent Map",
                enabled=True,
                baseX=0.5,
                baseY=0.5
            )):
                # TODO: error
                return

        if not db_commit(session, req, Run(
            id=run_id,
            robot=serial,
            persistent_map=persistent_map_id,
            start_at=start_at_ts,
            end_at=end_at_ts,
            charge_at_start=charge_at_start,
            charge_at_end=charge_at_end,
            cleaned_area=cleaned_area
        )):
            # TODO: error
            return
