from __future__ import annotations
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from vacuula_server.constants import DATA_DIR

def get_log_file_path() -> Path:
    return DATA_DIR / "vacuula.log"

def setup_logging() -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Avoid duplicate handlers.
    if root_logger.handlers:
        return

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(sys.stderr)
    console.setLevel(logging.DEBUG)
    console.setFormatter(formatter)
    root_logger.addHandler(console)


    log_file = get_log_file_path()
    handler = RotatingFileHandler(
        log_file,
        maxBytes=2 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )

    handler.setLevel(logging.DEBUG)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
