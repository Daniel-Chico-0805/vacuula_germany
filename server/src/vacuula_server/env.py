import json
import os
import socket
from pathlib import Path

DOCKER_HOST_NAME = "host.docker.internal"  # this is probably not needed soon?
HA_OPTIONS_PATH = Path(os.environ.get("HA_OPTIONS_PATH", "/data/options.json"))


def _load_ha_options() -> dict:
    """Load Home Assistant add-on options, if running as an add-on."""
    try:
        with HA_OPTIONS_PATH.open() as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except FileNotFoundError:
        return {}
    except (OSError, json.JSONDecodeError) as e:
        raise ValueError(f"Could not read Home Assistant options at {HA_OPTIONS_PATH}: {e}")


_HA_OPTIONS = _load_ha_options()


def _get_raw(name: str):
    value = os.environ.get(name)
    if value is not None and value.strip() != "":
        return value
    return _HA_OPTIONS.get(name)


def _get_bool_env(name: str, default: bool) -> bool:
    value = _get_raw(name)
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return default
    if isinstance(value, bool):
        return value
    value_lower = str(value).lower()
    if value_lower in ("true", "1", "yes"):
        return True
    elif value_lower in ("false", "0", "no"):
        return False
    raise ValueError(f"{name} must be a boolean (true/false), got {value!r}")


def _get_int_env(name: str, default: int) -> int:
    value = _get_raw(name)
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        raise ValueError(f"{name} must be an integer, got {value!r}")


def _get_str_env(name: str, default: str) -> str:
    value = _get_raw(name)
    if value is None or (isinstance(value, str) and value.strip() == ""):
        return default
    return str(value)

# GEN3_PORT is the port the Gen3 robots use to connect to nucleo/beehive and upload maps
# The Gen3 firmware (4.5.3 / 4.6.0) hardcodes 443 in two places: the astro binary (cloud connection) and /usr/lib/libNeatoUploader.so.1 (map/log uploads).
GEN3_PORT: int = _get_int_env("GEN3_PORT", 443)
GEN4_PORT: int = _get_int_env("GEN4_PORT", 3443)
VACUULA_PORT: int = _get_int_env("VACUULA_PORT", 80)
GEN3_ENABLED: bool = _get_bool_env("GEN3_ENABLED", True)
GEN4_ENABLED: bool = _get_bool_env("GEN4_ENABLED", True)
MDNS_ENABLED: bool = _get_bool_env("MDNS_ENABLED", True)
HOST_IP: str = _get_str_env("HOST_IP", "0.0.0.0")

# Validations
# the three listening ports must be different and in range
_PORTS = {"VACUULA_PORT": VACUULA_PORT, "GEN3_PORT": GEN3_PORT, "GEN4_PORT": GEN4_PORT}
if len(set(_PORTS.values())) != len(_PORTS):
    raise ValueError(f"VACUULA_PORT, GEN3_PORT and GEN4_PORT must be unique for the server to work. Got {_PORTS}")
for _name, _port in _PORTS.items():
    if not 1 <= _port <= 65535:
        raise ValueError(f"{_name} must be in port range (1-65535). Got {_name}={_port}")

def get_docker_host_ip() -> str | None:
    try:
        return socket.gethostbyname(DOCKER_HOST_NAME)
    except socket.gaierror:
        return None


def get_local_ip() -> str:
    """Return the IP of the local interface used for outbound traffic."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("9.9.9.9", 53))
        return sock.getsockname()[0]
    finally:
        sock.close()


def get_host_ip() -> str:
    return get_docker_host_ip() or get_local_ip()