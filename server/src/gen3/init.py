from http.server import ThreadingHTTPServer
from handlers.router import RouterHandler
from tls import create_ssl_context
import threading
import socket, ssl, struct, json
from conn import RobotConn, Gen4Conn
from utils import Generation
from gen4.handlers import handle_login
import threading


def start():
    # HTTPS server on 443
    context = create_ssl_context()
    https_server_1 = ThreadingHTTPServer(("0.0.0.0", 443), RouterHandler)
    https_server_1.socket = context.wrap_socket(https_server_1.socket, server_side=True)
    
    # https_server_2 = ThreadingHTTPServer(("0.0.0.0", 3443), RouterHandler)
    # https_server_2.socket = context.wrap_socket(https_server_2.socket, server_side=True)

    # threading.Thread(target=gen4.server.run_server, daemon=True).start()
    

    # HTTP server on 8080
    http_server = ThreadingHTTPServer(("0.0.0.0", 8080), RouterHandler)
    
    # Run both servers in separate threads
    https_1_thread = threading.Thread(target=https_server_1.serve_forever, daemon=True)
    # https_2_thread = threading.Thread(target=https_server_2.serve_forever, daemon=True)
    http_thread = threading.Thread(target=http_server.serve_forever, daemon=True)
    
    https_1_thread.start()
    # https_2_thread.start()
    http_thread.start()
    
    print("Listening on https://0.0.0.0:443")
    # print("Listening on https://0.0.0.0:3443")
    print("Listening on http://0.0.0.0:8080")
    
    # Keep main thread alive


