"""
parse_maps.py  —  SLAM map parser for robot vacuum cleaning sessions.

Each cleaning session produces exactly TWO files that must be parsed together:

    FloorMap.png  —  full SLAM floor map  (walls, free space, unknown)
    RunMap.png    —  cleaning coverage    (where the robot actually went)
                     + dock location marker (special pixel values 100 / 200)

Usage
-----
    # Parse one session into the current directory:
    python3 parse_maps.py FloorMap.png RunMap.png

    # Parse into a specific output directory:
    python3 parse_maps.py FloorMap.png RunMap.png --out ./session_01/

    # Custom output filenames:
    python3 parse_maps.py FloorMap.png RunMap.png \
        --floor-out floor.json --run-out run.json

Outputs
-------
    floormap.json  —  RLE grid + embedded dock coordinates
    runmap.json    —  RLE grid of coverage (no dock info needed here)

Importing as a module
---------------------
    from parse_maps import parse_session
    parse_session("FloorMap.png", "RunMap.png", out_dir="./output/")
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


# =========================================================
# MAP COMPRESSION
# =========================================================
# Groups NxN pixels into one logical cell.
#
# 1 = no reduction (full resolution)
# 2 = 2×2 pixels → 1 cell
# 4 = 4×4 pixels → 1 cell
# 8 = very compressed map
#
DOWNSAMPLE = 1

# =========================================================
# PIXEL CLASSIFICATION
# =========================================================
# Grayscale:  0 = black,  255 = white
#
# SLAM map pixel semantics (shared by both maps):
#   BLACK (< BLACK_THRESHOLD) → FREE SPACE
#   WHITE (> WHITE_THRESHOLD) → WALL
#   GRAY  (everything else)   → UNKNOWN / UNEXPLORED
#
BLACK_THRESHOLD = 60
WHITE_THRESHOLD = 220

UNKNOWN = 0
FREE    = 1
WALL    = 2

# =========================================================
# DOCK DETECTION
# =========================================================
# The RunMap encodes the dock with two special pixel values
# that never appear in normal map data:
#
#   100  →  dark-gray  (top 4×4 block of dock marker)
#   200  →  light-gray (bottom 4×4 block of dock marker)
#
# Their combined centroid gives the dock position, which is
# embedded in floormap.json so consumers always have it.
#
DOCK_MARKER_VALUES = {100, 200}


# ---------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------

def _classify(value: int) -> int:
    if value < BLACK_THRESHOLD:
        return FREE
    if value > WHITE_THRESHOLD:
        return WALL
    return UNKNOWN


def _rle_encode(cells: list[int]) -> list[list[int]]:
    rle     = []
    current = cells[0]
    count   = 1
    for value in cells[1:]:
        if value == current:
            count += 1
        else:
            rle.append([current, count])
            current = value
            count   = 1
    rle.append([current, count])
    return rle


# ---------------------------------------------------------
# Dock detection  (always reads the RunMap)
# ---------------------------------------------------------

def detect_dock(run_path: str | Path) -> dict | None:
    """
    Scan a RunMap image for dock-marker pixels (values 100 and 200),
    compute their combined centroid, and return both pixel and
    normalised [0, 1] coordinates.

    Returns None if no marker pixels are found.
    """
    arr  = np.array(Image.open(run_path).convert("L"))
    H, W = arr.shape

    mask   = np.isin(arr, list(DOCK_MARKER_VALUES))
    coords = np.argwhere(mask)   # shape (N, 2): [[row/y, col/x], ...]

    if len(coords) == 0:
        return None

    # Per-block bounding boxes (one entry per marker value)
    blocks: dict[int, dict] = {}
    for val in sorted(DOCK_MARKER_VALUES):
        bc = np.argwhere(arr == val)
        if len(bc):
            blocks[val] = {
                "pixel_count": int(len(bc)),
                "pixel_x_min": int(bc[:, 1].min()),
                "pixel_x_max": int(bc[:, 1].max()),
                "pixel_y_min": int(bc[:, 0].min()),
                "pixel_y_max": int(bc[:, 0].max()),
            }

    cy = float(coords[:, 0].mean())
    cx = float(coords[:, 1].mean())

    return {
        "pixel_x":             round(cx, 2),
        "pixel_y":             round(cy, 2),
        "normalised_x":        round(cx / (W - 1), 6),
        "normalised_y":        round(cy / (H - 1), 6),
        "marker_pixel_values": sorted(DOCK_MARKER_VALUES),
        "marker_pixel_count":  int(len(coords)),
        "marker_blocks":       blocks,
        "source_image_width":  W,
        "source_image_height": H,
    }


# ---------------------------------------------------------
# Single-map parser
# ---------------------------------------------------------

def _parse_one(
    image_path: str | Path,
    map_type:   str,
    dock_info:  dict | None,
) -> dict:
    """
    Parse one SLAM map image into an RLE-compressed dict.
    Dock-marker pixels are classified as FREE so they don't
    corrupt the grid.
    """
    img           = Image.open(image_path).convert("L")
    width, height = img.size
    pixels        = img.load()

    new_w = width  // DOWNSAMPLE
    new_h = height // DOWNSAMPLE
    cells: list[int] = []

    for gy in range(new_h):
        for gx in range(new_w):
            counts = {UNKNOWN: 0, FREE: 0, WALL: 0}
            for dy in range(DOWNSAMPLE):
                for dx in range(DOWNSAMPLE):
                    raw = pixels[gx * DOWNSAMPLE + dx,
                                 gy * DOWNSAMPLE + dy]
                    if raw in DOCK_MARKER_VALUES:
                        counts[FREE] += 1
                    else:
                        counts[_classify(raw)] += 1
            cells.append(max(counts, key=counts.get))

    rle = _rle_encode(cells)

    output: dict = {
        "width":      new_w,
        "height":     new_h,
        "downsample": DOWNSAMPLE,
        "map_type":   map_type,
        "legend":     {"0": "unknown", "1": "free", "2": "wall"},
        "rle":        rle,
    }
    if dock_info is not None:
        output["dock"] = dock_info

    return output


# ---------------------------------------------------------
# Public API  —  always call with BOTH maps
# ---------------------------------------------------------

def parse_session(
    floor_map_path: str | Path,
    run_map_path:   str | Path,
    out_dir:        str | Path = ".",
    floor_out:      str        = "FloorMap.json",
    run_out:        str        = "RunMap.json",
) -> tuple[dict, dict]:
    """
    Parse a cleaning session: FloorMap + RunMap must be provided together.

    The RunMap is always read first to extract the dock location.
    The dock info is embedded in the FloorMap JSON output.

    Parameters
    ----------
    floor_map_path  Path to FloorMap.png
    run_map_path    Path to RunMap.png
    out_dir         Directory where both JSON files are written
    floor_out       Filename for the floor map JSON
    run_out         Filename for the run map JSON

    Returns
    -------
    (floor_data, run_data)  — the two dicts that were written to disk
    """
    floor_map_path = Path(floor_map_path)
    run_map_path   = Path(run_map_path)
    out_dir        = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Validate inputs
    for p in (floor_map_path, run_map_path):
        if not p.exists():
            raise FileNotFoundError(f"Map file not found: {p}")

    # Step 1: detect dock from RunMap
    print("── Detecting dock from RunMap ──────────────────────────")
    dock = detect_dock(run_map_path)
    if dock:
        print(f"  ✓ Found {dock['marker_pixel_count']} marker pixels")
        print(f"    pixel      : ({dock['pixel_x']}, {dock['pixel_y']})")
        print(f"    normalised : ({dock['normalised_x']}, {dock['normalised_y']})")
    else:
        print("  ⚠ WARNING: no dock marker found in RunMap")

    # Step 2: parse FloorMap  (dock info embedded)
    print("\n── Parsing FloorMap ────────────────────────────────────")
    floor_data = _parse_one(floor_map_path, map_type="floor", dock_info=dock)
    floor_file = out_dir / floor_out
    with open(floor_file, "w") as f:
        json.dump(floor_data, f)
    _print_summary(floor_file, floor_data)

    # Step 3: parse RunMap
    print("\n── Parsing RunMap ──────────────────────────────────────")
    run_data = _parse_one(run_map_path, map_type="run", dock_info=None)
    run_file = out_dir / run_out
    with open(run_file, "w") as f:
        json.dump(run_data, f)
    _print_summary(run_file, run_data)

    print("\n✓ Session parsed successfully.\n")
    return floor_data, run_data


def _print_summary(path: Path, data: dict) -> None:
    print(f"  Saved      : {path}")
    print(f"  Grid       : {data['width']} × {data['height']}")
    print(f"  RLE entries: {len(data['rle'])}")
    if "dock" in data and data["dock"]:
        d = data["dock"]
        print(f"  Dock (norm): ({d['normalised_x']}, {d['normalised_y']})")


# =========================================================
# CLI
# =========================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("floor_map", help="Path to FloorMap.png")
    parser.add_argument("run_map",   help="Path to RunMap.png")
    parser.add_argument(
        "--out", default=".", metavar="DIR",
        help="Output directory (default: current directory)",
    )
    parser.add_argument(
        "--floor-out", default="floormap.json", metavar="FILE",
        help="Floor map JSON filename (default: floormap.json)",
    )
    parser.add_argument(
        "--run-out", default="runmap.json", metavar="FILE",
        help="Run map JSON filename (default: runmap.json)",
    )
    args = parser.parse_args()

    try:
        parse_session(
            floor_map_path = args.floor_map,
            run_map_path   = args.run_map,
            out_dir        = args.out,
            floor_out      = args.floor_out,
            run_out        = args.run_out,
        )
    except FileNotFoundError as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        sys.exit(1)