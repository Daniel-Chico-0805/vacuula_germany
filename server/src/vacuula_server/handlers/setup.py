from __future__ import annotations
import logging
from zeroconf import Zeroconf, ServiceInfo
import socket
from pathlib import Path
import subprocess

from typing import TYPE_CHECKING

from vacuula_server.env import VACUULA_PORT, get_host_ip
from vacuula_server.constants import APP_VERSION, CERT, CERT_CONFIG, KEY, SSL_DIR
if TYPE_CHECKING:
    from vacuula_server.handlers.router import RouterHandler


logger = logging.getLogger(__name__)

def ensure_ssl_certificate():
    if CERT.exists() and KEY.exists():
        logger.info("SSL certificate and key already exist, skipping generation.")
        return

    SSL_DIR.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "openssl",
            "req",
            "-x509",
            "-newkey", "rsa:4096",
            "-sha256",
            "-days", "3650",
            "-nodes",
            "-keyout", str(CERT),
            "-out", str(KEY),
            "-config", str(CERT_CONFIG),
        ],
        check=True,
    )

def get_cert(req: RouterHandler) -> None:
    """GET /cert - download the certificate."""
    try:
        data = CERT.read_bytes()
    except OSError:
        req.send_internal_error("Failed to read certificate")
        return

    req.send_response(200)
    req.send_header("Content-Type", "application/x-x509-ca-cert")
    req.send_header("Content-Disposition", 'attachment; filename="vacuula-ca.crt"')
    req.send_header("Content-Length", str(len(data)))
    req.end_headers()
    req.wfile.write(data)


# mDNS stuff
SERVICE_TYPE = "_vacuula._tcp.local."
SERVICE_NAME = "Vacuula Server._vacuula._tcp.local."
MDNS_HOSTNAME = "vacuula.local."

class MDNSAdvertiser:
    def __init__(self) -> None:
        self._zeroconf = Zeroconf()

        ip = get_host_ip()

        self._info = ServiceInfo(
            SERVICE_TYPE,
            SERVICE_NAME,
            addresses=[socket.inet_aton(ip)],
            server=MDNS_HOSTNAME,
            port=VACUULA_PORT,
            properties={
                "version": APP_VERSION,
                "cert-path": "/api/cert",
                "protocol": "http",
                "url": "http://vacuula.local" + (f":{VACUULA_PORT}" if VACUULA_PORT != 80 else ""),
            },
        )

    def start(self) -> None:
        self._zeroconf.register_service(self._info)
        logger.info(
            "mDNS: advertising %s at %s:%d",
            SERVICE_NAME,
            self._info.parsed_addresses()[0],
            self._info.port,
        )

    def stop(self) -> None:
        self._zeroconf.unregister_service(self._info)
        self._zeroconf.close()