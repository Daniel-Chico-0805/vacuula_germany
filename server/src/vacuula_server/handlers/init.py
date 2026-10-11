from __future__ import annotations
from http.server import ThreadingHTTPServer
from vacuula_server.handlers.router import RouterHandler
import threading

from vacuula_server.env import VACUULA_PORT


def start():
    # Vacuula server on vacuula port
    http_server = ThreadingHTTPServer(("0.0.0.0", VACUULA_PORT), RouterHandler)
    
    http_thread = threading.Thread(target=http_server.serve_forever, daemon=True)
    
    http_thread.start()
    
    print(f"Vacuula Server listening on http://0.0.0.0:{VACUULA_PORT}")


