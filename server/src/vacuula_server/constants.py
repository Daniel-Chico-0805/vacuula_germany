# --------------------------------------------------------------------------
# Application metadata
# --------------------------------------------------------------------------
from vacuula_server._build_version import APP_VERSION

import sys
from pathlib import Path


def _base_dir() -> Path:
    # Inside a venv
    if sys.prefix != sys.base_prefix:
        return Path(sys.prefix).parent
    # fallback working directory
    return Path.cwd()


BASE_DIR = _base_dir()
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
MAPS_DIR = UPLOADS_DIR / "maps"

SSL_DIR = DATA_DIR / "ssl"
CERT = SSL_DIR / "cert.pem"
KEY = SSL_DIR / "privkey.pem"
CERT_CONFIG = SSL_DIR / "vacuula.cnf"

DB_PATH = DATA_DIR / "vacuula.db"