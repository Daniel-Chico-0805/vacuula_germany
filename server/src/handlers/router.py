from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime
from handlers.route_matcher import BrainslugHandler, BEEHIVE_ROUTES, NUCLEO_ROUTES, APP_ROUTES, S3_ROUTES
from handlers import static_ui
from socketserver import ThreadingMixIn
import json
import socket

class RouterHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        """Override to add CORS headers to app responses"""
        if (self.path.startswith("/app/")):
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_ok()

    # TODO - add better logging ?
    # def log_message(self, format, *args):
    #     print(self.path)
    #     # Silence default logging
    #     return

    def read_data(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            self.send_bad_request("Invalid Content-Length header")
            return None
        if content_length == 0:
            return b""
        return self.rfile.read(content_length)

    def read_json(self) -> dict | None:
        data = self.read_data()
        if data is None:
            return None
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            self.send_bad_request("Invalid JSON body")
            return None


    # Routing logic
    def route(self):
        accept = self.headers.get("Accept", "")
        
        if self.path.startswith("/app/"):
            return BrainslugHandler(APP_ROUTES, self)
        elif accept == "application/vnd.neato.beehive.v1+json":
            return BrainslugHandler(BEEHIVE_ROUTES, self)
        elif accept == "application/vnd.neato.cometa.v1":
            return BrainslugHandler(NUCLEO_ROUTES, self)
        else:
            # Browser requests for the web app (built into app/dist) are answered
            # here; anything that is not a UI file keeps going to the S3 routes.
            if static_ui.serve(self):
                return None
            return BrainslugHandler(S3_ROUTES, self)

    def do_POST(self):
        self.route()

    def do_GET(self):
        self.route()

    def do_PUT(self):
        self.route()

    def do_DELETE(self):
        self.route()

    def send_response_data(self, content, close=True, status=200, content_type="application/json"):
        if isinstance(content, (dict, list)):
            content = json.dumps(content).encode("utf-8")
        elif isinstance(content, str):
            content = content.encode("utf-8")

        self.send_response(status)

        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        if close:
            self.send_header("Connection", "close")
        self.end_headers()

        self.wfile.write(content)
        self.wfile.flush()

        if not close:
            self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)


    def send_error_response(self, status, message):
        self.send_response_data({"error": message}, True, status=status)

    # Success helpers
    def send_ok(self, data=None, close=True):
        self.send_response_data(data if data is not None else "OK", close, status=200)

    def send_created(self, data=None, close=True):
        self.send_response_data(data if data is not None else "Created",close, status=201)

    # Error helpers
    def send_bad_request(self, message="Bad Request"):
        self.send_error_response(400, message)

    def send_unauthorized(self, message="Unauthorized"):
        self.send_error_response(401, message)

    def send_not_found(self, message="Not Found"):
        self.send_error_response(404, message)

    def send_internal_error(self, message="Internal Server Error"):
        self.send_error_response(500, message)