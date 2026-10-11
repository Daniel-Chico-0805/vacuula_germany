from __future__ import annotations
from vacuula_server import state
import json
import time
from vacuula_server.state import pending_requests, put_drop_oldest
import typing

# per-robot temporary buffers
# serial --> size
robot_buffers = {}

def robot_data(serial: str, data: bytes):
    """Handle incoming data from robot"""

    # create robot state if missing
    if serial not in robot_buffers:
        robot_buffers[serial] = int(data, 16)  # hex to int
        return

    msg_size = robot_buffers[serial]

    # remove last two bytes (\r\n)
    data = data[:-2]

    if (chr(data[0]) != '{' and msg_size == 1):
        print(f">> heartbeat received from {serial}")
        return


    try:
        decoded: dict = json.loads(data.decode())
    except Exception as e:
        print(f">> failed to parse JSON from {serial}: {e}")
        return

    eventId = decoded.get("eventId")
    reqId = decoded.get("reqId")

    print(f">> robot_data: serial={serial} eventId={eventId} reqId={reqId} data={data}")

    if reqId in pending_requests:
        slot = pending_requests.get(reqId)
        result = decoded.get("result")
        if slot is not None:
            slot.fulfill(data, 200 if result == "ok" else 400)
    elif eventId:
        clients = [c for c in state.client_connections if c["serial"] == serial]
        if clients:  # skip serializing when nobody is listening
            msg = json.dumps({
                "serial": serial,
                "event": eventId,
                "data": decoded,      # parsed dict, not raw bytes
                "ts": time.time(),
            }) + "\n"
            frame = f"data: {msg}\n\n".encode()
            for client in clients:
                put_drop_oldest(client["queue"], frame)


    else:
        print(f">> no eventId or reqId in data from {serial}")

    del robot_buffers[serial]
