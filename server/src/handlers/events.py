"""Server-sent events that are not about a single robot.

GET /app/events streams `robots` events: the full robot list (same shape as
GET /app/robots) whenever a robot logs in, drops its connection or is renamed,
plus one snapshot right after connecting. Clients keep their list in sync from
this stream instead of polling.
"""
import json
import threading
import time

from sqlalchemy import select

from db import get_session
from models.robot import Robot
from state import robot_connections

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from handlers.router import RouterHandler

KEEPALIVE_S = 15

_clients: list = []          # wfile of every connected event-stream client
_lock = threading.Lock()


def robots_snapshot() -> dict:
    """Robot list with connection status, keyed by serial (also used by GET /app/robots)."""
    with get_session() as session:
        robots = session.execute(select(Robot)).scalars().all()
    return {
        robot.serial: {
            "type": "neato.gen4" if not robot.password else "neato.gen3",
            "connected": robot.serial in robot_connections,
            "name": robot.name,
        }
        for robot in robots
    }


def _frame(event: str, data) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode("utf-8")


def broadcast(event: str, data) -> None:
    frame = _frame(event, data)
    with _lock:
        clients = list(_clients)
    for wfile in clients:
        try:
            wfile.write(frame)
            wfile.flush()
        except OSError:
            with _lock:
                if wfile in _clients:
                    _clients.remove(wfile)


def notify_robots_changed() -> None:
    """Call after a robot connects, disconnects or is renamed."""
    try:
        broadcast("robots", robots_snapshot())
    except Exception as e:  # never let a notification break the caller
        print("WARN", f"robots event not sent: {type(e).__name__}: {e}")


def get_events(req: "RouterHandler") -> None:
    """GET /app/events - SSE stream of server-wide events."""
    req.send_response(200)
    req.send_header("Content-Type", "text/event-stream")
    req.send_header("Cache-Control", "no-cache")
    req.send_header("Connection", "keep-alive")
    req.end_headers()

    with _lock:
        _clients.append(req.wfile)
    try:
        req.wfile.write(_frame("robots", robots_snapshot()))
        req.wfile.flush()
        while True:
            time.sleep(KEEPALIVE_S)
            req.wfile.write(b": keepalive\n\n")
            req.wfile.flush()
    except OSError:
        pass  # client went away (reload, tab closed, phone in background)
    finally:
        with _lock:
            if req.wfile in _clients:
                _clients.remove(req.wfile)
