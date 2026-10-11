from __future__ import annotations
from vacuula_server.gen3.commands import send_chunk, build_heartbeat
from vacuula_server.state import robot_connections
from vacuula_server.handlers.events import notify_robots_changed
from vacuula_server.gen3.utils import get_robot_serial
from vacuula_server.db import get_session
from vacuula_server.gen3.event_handler import robot_data
from vacuula_server.models.robot import Robot
from sqlalchemy import select
from typing import TYPE_CHECKING
from vacuula_server.generation import get_robot_by_serial, Generation
from vacuula_server.conn import RobotConn, Gen2Gen3Conn
import traceback
if TYPE_CHECKING:
    from vacuula_server.handlers.router import RouterHandler


def nucleo_init(req: RouterHandler) -> None:
    """POST /vendors/neato/login - robot commands"""
    if not (serial := get_robot_serial(req)): return

    if not (robot := get_robot_by_serial(serial)):
        req.send_not_found("Robot not found")
        return

    req.send_response(200)
    req.send_header("Transfer-Encoding", "chunked")
    req.send_header("Connection", "close")
    req.end_headers()

    send_chunk(req.wfile, build_heartbeat())
    conn = RobotConn(serial, Generation.GEN3, Gen2Gen3Conn(robot.password, req.wfile))
    robot_connections[serial] = conn
    notify_robots_changed()

    try:
        while True:
            data = req.rfile.readline()
            if not data:
                break
            robot_data(serial, data)
    except Exception:
        traceback.print_exc()
        pass
    finally:
        if robot_connections.get(serial) is conn:
            del robot_connections[serial]
            notify_robots_changed()
