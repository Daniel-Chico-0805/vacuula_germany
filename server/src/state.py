from conn import RobotConn
from typing import Dict

# robot_connections: List[RobotConn]  = []
robot_connections: Dict[str, RobotConn] = {}


# client_connection:
# - client id
# - connection itself
client_connections = []


# pending_requests:
# - req_id --> request
pending_requests = {}