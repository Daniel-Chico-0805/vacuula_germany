from http.server import ThreadingHTTPServer
from handlers.router import RouterHandler
from handlers import static_ui
from tls import create_ssl_context
import threading
import socket, ssl, struct, json
from conn import RobotConn, Gen4Conn
from utils import Generation
from gen4.handlers import handle_login
import threading


def start():
    # HTTP server on 8080
    http_server = ThreadingHTTPServer(("0.0.0.0", 8080), RouterHandler)
    
    http_thread = threading.Thread(target=http_server.serve_forever, daemon=True)
    
    http_thread.start()
    
    print("Listening on http://0.0.0.0:8080")
    if static_ui.ui_available():
        print(f"Serving web app from {static_ui.UI_DIR}")
    else:
        print(f"Web app build not found at {static_ui.UI_DIR} - run `pnpm build` in app/ (or set VACUULA_UI_DIR)")


