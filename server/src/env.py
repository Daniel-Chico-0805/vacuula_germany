import os
import socket

DOCKER_HOST_NAME = "host.docker.internal"

DEFAULT_GEN3_PORT = 335
DEFAULT_GEN4_PORT = 336
DEFAULT_VACUULA_PORT = 8050


def _get_int_env(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        return default
    try:
        return int(value)
    except ValueError:
        raise ValueError(f"Environment variable {name} must be an integer, got {value!r}")


GEN3_PORT: int = _get_int_env("GEN3_PORT", DEFAULT_GEN3_PORT)
GEN4_PORT: int = _get_int_env("GEN4_PORT", DEFAULT_GEN4_PORT)
VACUULA_PORT: int = _get_int_env("VACUULA_PORT", DEFAULT_VACUULA_PORT)

# Validations
if len(set({GEN3_PORT, GEN4_PORT, VACUULA_PORT})) != 3:
    raise ValueError(
        f"GEN3_PORT, GEN4_PORT, and VACUULA_PORT must be unique for the server to work"
        f"Got GEN3_PORT={GEN3_PORT}, GEN4_PORT={GEN4_PORT}, VACUULA_PORT={VACUULA_PORT}"
    )
elif GEN3_PORT <= 0 or GEN4_PORT <= 0 or VACUULA_PORT <= 0:
    raise ValueError(
        f"GEN3_PORT, GEN4_PORT, and VACUULA_PORT must be positive integers"
        f"Got GEN3_PORT={GEN3_PORT}, GEN4_PORT={GEN4_PORT}, VACUULA_PORT={VACUULA_PORT}"
    )
elif len(str(GEN3_PORT)) != 3 or GEN4_PORT > 65535 or VACUULA_PORT > 65535:
    raise ValueError(
        f"GEN4_PORT, and VACUULA_PORT must be in port range (1-65535), GEN3_PORT must be 3 digits"
        f"Got GEN3_PORT={GEN3_PORT}, GEN4_PORT={GEN4_PORT}, VACUULA_PORT={VACUULA_PORT}"
    )

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