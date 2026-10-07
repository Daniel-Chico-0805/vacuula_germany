from __future__ import annotations
from http.server import ThreadingHTTPServer
from handlers.router import RouterHandler
from tls import CERT, KEY
import threading
import socket, ssl, struct, json
from utils import Generation
from conn import RobotConn, Gen4Conn
from state import robot_connections
from handlers.events import notify_robots_changed
from gen4.handlers import handle_login, robot_response, heartbeat_thread, robot_event, roboot_request

HOST = "0.0.0.0"
PORT = 3443
ROBOT_SOCKET_TIMEOUT_S = 20

def start():
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((HOST, PORT))
        sock.listen(5)
        print(f"TLS server listening on {HOST}:{PORT}")

        while True:
            client, addr = sock.accept()

            try:
                tls = ctx.wrap_socket(client, server_side=True)
            except ssl.SSLError as e:
                print(f"TLS handshake failed from {addr}: {e}")
                client.close()
                continue

            threading.Thread(target=handle_robot, args=(tls, addr), daemon=True).start()



def recv_packet(sock):
    hdr = b""
    while len(hdr) < 4:
        try:
            chunk = sock.recv(4 - len(hdr))
        except TimeoutError:
            continue
        if not chunk:
            return None
        hdr += chunk
    (n,) = struct.unpack(">I", hdr)
    if n == 0:
        return b""
    if n > 10 * 1024 * 1024:
        return None
    data = b""
    while len(data) < n:
        try:
            chunk = sock.recv(min(65536, n - len(data)))
        except TimeoutError:
            continue
        if not chunk:
            return None
        data += chunk
    return data


def handle_robot(conn, addr):
    rc = RobotConn("<unknown>", Generation.GEN4, Gen4Conn(conn))
    conn.settimeout(ROBOT_SOCKET_TIMEOUT_S)

    try:
        json_count = 0
        while True:

            raw = recv_packet(conn)
            if raw is None:
                break

            if raw == b"\x06":
                print("hb")
                continue
            if raw == b"\x00":
                print("CLOSE", f"{rc.serial or addr} sent CLOSE")
                break

            try:
                msg = json.loads(raw)
            except Exception as e:
                print("WARN", f"non-JSON packet: {e} raw={raw[:80]!r}")
                continue

            json_count += 1


            if json_count == 1 and "signature" in msg:
                handle_login(rc, msg)
                hb_t = threading.Thread(target=heartbeat_thread, args=(rc,), daemon=True)
                hb_t.start()
                continue

            msg_id = msg.get("id")
            msg_type = msg.get("type")
            if msg_type == "event":
                robot_event(rc, msg)
            elif msg_type == "response":
                robot_response(rc, msg)
            elif msg_type == "request":
                roboot_request(rc, msg_id, msg)
            else:
                print("WARN", f"unknown msg type {msg_type!r}: {json.dumps(msg)[:200]}")

    except Exception as e:
        print("ERROR", f"{addr}: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        rc.stop_event.set()
        try:
            conn.close()
        except Exception:
            pass
        # forget this connection so the robot shows as offline until it logs in again
        # if rc.serial and robot_connections.get(rc.serial) is rc:
        #     robot_connections.pop(rc.serial, None)
        #     notify_robots_changed()
        # with robots_lock:
        #     if rc.serial and robots.get(rc.serial) is rc:
        #         robots.pop(rc.serial, None)
        #         if active_robot[0] == rc.serial:
        #             active_robot[0] = next(iter(robots), None)
        #             print(
        #                 "ACTIVE",
        #                 f"target switched to {active_robot[0]}" if active_robot[0]
        #                 else "no robots connected",
        #             )
        # print("DISCONN", f"{rc.serial or addr}")


