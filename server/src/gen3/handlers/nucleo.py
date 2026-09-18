from gen3.commands import send_chunk, build_heartbeat
from state import robot_connections
from handlers.events import notify_robots_changed
from gen3.utils import get_robot_serial
from db import get_session
from gen3.event_handler import robot_data
from models.robot import Robot
from sqlalchemy import select
from typing import TYPE_CHECKING
from utils import get_robot_by_serial, Generation
from conn import RobotConn, Gen2Gen3Conn

if TYPE_CHECKING:
    from handlers.router import RouterHandler


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
    robot_connections[serial] = RobotConn(serial, Generation.GEN3, Gen2Gen3Conn(robot.password, req.wfile))
    notify_robots_changed()

    try:
        while True:
            data = req.rfile.readline()
            if not data:
                break
            robot_data(serial, data)
    except Exception:
        pass
    finally:
        robot_connections.pop(serial, None)
        notify_robots_changed()
