from __future__ import annotations
from http.server import ThreadingHTTPServer
from handlers.router import RouterHandler
from tls import create_ssl_context
import threading
import threading


def start():
    # HTTPS server on gen3 port
    context = create_ssl_context()
    https_server_1 = ThreadingHTTPServer(("0.0.0.0", 443), RouterHandler)
    https_server_1.socket = context.wrap_socket(https_server_1.socket, server_side=True)
    https_1_thread = threading.Thread(target=https_server_1.serve_forever, daemon=True)
    https_1_thread.start()
    print("Gen3 listening on https://0.0.0.0:443")


