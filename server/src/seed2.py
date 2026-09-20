from db import get_session
from models.robot import Robot
from models.persistent_map import FloorPlan, PersistentMap


import base64, os

from gen3.map_utils import parse_session
from models.run import Gen3__Run, Gen4__Run

def maps_create(serial: str, data: dict):
    print("add new map!")
    run = data['run']
    id = run['start_at']

    job_folder = f"uploads/maps/{serial}/{id}"
    floor_map_path = f"{job_folder}/FloorMap.png"
    run_map_path = f"{job_folder}/RunMap.png"
    manifest_path = f"{job_folder}/manifest.json"
    floormap_meta, run_meta = parse_session(floor_map_path, run_map_path, job_folder)

    print(floormap_meta)
    print("---")
    print(run_meta)


    with get_session() as session:
            session.add(PersistentMap(
                id=id,
                robot=serial,
                name="???",
                base=(floormap_meta["dock"]["normalised_x"], floormap_meta["dock"]["normalised_y"]),
                enabled=True,
                in_maps_list=run['valid_as_persistent_map']
            ))

            session.add(Gen3__Run(
                id=id,
                robot=serial,
                persistent_map=id,
                run=run
            ))

            session.commit()




serial = "GPC23118-40bd32d13ac7"
import json

for path in os.walk(f'uploads/maps/{serial}'):
    if not 'manifest.json' in path[2]:
        print('Missing manifest.json!')
        print(path)
        continue

    # if not '2026-09-19T20:38:44Z' in path[0]:
    #     continue

    msg = path[0] + f'/manifest.json'
    with open(msg, 'r') as f:
        data = json.load(f)

    maps_create(serial, data)
    print(data); 

