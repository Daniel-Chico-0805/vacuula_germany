from __future__ import annotations
from http.server import ThreadingHTTPServer
from handlers.router import RouterHandler
import threading


def start():
    # HTTP server on 80
    http_server = ThreadingHTTPServer(("0.0.0.0", 80), RouterHandler)
    
    http_thread = threading.Thread(target=http_server.serve_forever, daemon=True)
    
    http_thread.start()
    
    print("Listening on http://0.0.0.0:80")


