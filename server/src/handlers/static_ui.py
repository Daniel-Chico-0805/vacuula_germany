"""Serves the built web app (app/dist) from the same HTTP server as the API.

The UI calls the API as /app on its own origin, so serving both from one
process on 8080 makes `python src/main.py` the only thing to run on a Pi.
Any request that is not an API call and matches a file in the dist folder
(or an app route such as /runs, which falls back to index.html) is answered
here; everything else keeps going to the existing route tables.

The folder can be overridden with the VACUULA_UI_DIR environment variable.
"""
import os
from pathlib import Path

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from handlers.router import RouterHandler

_DEFAULT_UI_DIR = Path(__file__).resolve().parents[3] / "app" / "dist"
UI_DIR = Path(os.environ.get("VACUULA_UI_DIR") or _DEFAULT_UI_DIR).resolve()
INDEX = "index.html"

# Explicit types: on Windows, mimetypes can return registry values such as text/plain for .js
CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json",
}


def ui_available() -> bool:
    return (UI_DIR / INDEX).is_file()


def resolve(request_path: str) -> Path | None:
    """Map a request path to a file under UI_DIR, or None if it is not a UI request."""
    path = request_path.split("?", 1)[0].split("#", 1)[0]
    rel = path.lstrip("/") or INDEX
    try:
        full = (UI_DIR / rel).resolve()
        full.relative_to(UI_DIR)  # reject ../ traversal
    except (ValueError, OSError):
        return None
    if full.is_file():
        return full
    # client-side routes (/runs, /map, /settings...) load the app shell
    if "." not in Path(rel).name and ui_available():
        return UI_DIR / INDEX
    return None


def serve(req: "RouterHandler") -> bool:
    """Answer the request from the dist folder. Returns False when it is not a UI request."""
    if req.command != "GET":
        return False
    file = resolve(req.path)
    if file is None:
        return False

    data = file.read_bytes()
    req.send_response(200)
    req.send_header("Content-Type", CONTENT_TYPES.get(file.suffix.lower(), "application/octet-stream"))
    req.send_header("Content-Length", str(len(data)))
    if "assets" in file.relative_to(UI_DIR).parts:
        # Vite hashes asset file names, so they can be cached for a long time
        req.send_header("Cache-Control", "public, max-age=31536000, immutable")
    else:
        # index.html, sw.js, manifests and icons must always be re-checked
        req.send_header("Cache-Control", "no-cache")
    req.send_header("Connection", "close")
    req.end_headers()
    req.wfile.write(data)
    req.wfile.flush()
    return True
