import hmac
import hashlib
from datetime import datetime, timezone
from db import get_session
from utils import get_robot_by_serial
import json
import time


def hmac_sha256(message: str, secret: str) -> str:
    signature = hmac.new(
        secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return signature


def rfc822_date() -> str:
    # Format like: Tue, 04 Dec 2025 19:55:03 GMT
    return datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")


def sign_cmd(robot_serial: str, cmd: str):
    date = rfc822_date()

    robot = get_robot_by_serial(robot_serial)
    if not robot:
        print("ERROR! robot not found?") # TODO
        return ""
    password = robot.password

    if not password:
        print(f">> no password found for robot {robot_serial}, using empty string")
        password = ""

    payload = (
        robot_serial.lower() + "\n" +
        date + "\n" +
        cmd
    )

    signature = hmac_sha256(payload, password).lower()

    return date + "|" + signature + "\r\n" + cmd


req_id = 1

def send_chunk(wfile, payload_bytes):
    chunk = f"{len(payload_bytes):X}\r\n".encode() + payload_bytes + b"\r\n"
    wfile.write(chunk)
    wfile.flush()


def build_heartbeat():
    return json.dumps({
        "heartbeat": 60,
        "epoch": int(time.time())
    }).encode()


def build_command(robot_serial: str, cmd: dict):
    global req_id

    payload = json.dumps({
        "reqId": str(req_id),
        **cmd
    }).encode()

    req_id += 1

    return [(req_id - 1), sign_cmd(robot_serial, payload.decode()).encode()]