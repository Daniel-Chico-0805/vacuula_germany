import { Neato, RobotType, type Robot } from "../types"


export enum BasicState {
    INVALID,
    ERROR,
    PAUSED,
    IDLE,
    DOCKING,
    CLEANING,
    CLEANING_STANDBY,
    UPDATING,
    TEST,

    // gen3 only
    COPYING_LOGS,
    RECOVERING_LOCATION, // gen4 shows an alert
    EXPLORING_MAP,
    ACQUIRING_PERSISTENT_MAP_IDS,
    CREATING_UPLOADING_MAP,
    SUSPENDED_EXPLORATION, // ?
}

const basicStateStrings: Record<BasicState, string> = {
    [BasicState.INVALID]: "INVALID",
    [BasicState.ERROR]: "Error",
    [BasicState.PAUSED]: "Paused",
    [BasicState.IDLE]: "IDLE",
    [BasicState.DOCKING]: "DOCKING",
    [BasicState.CLEANING]: "CLEANING",
    [BasicState.CLEANING_STANDBY]: "charging during clean?",
    [BasicState.UPDATING]: "UPDATING",
    [BasicState.TEST]: "TEST",
    
    // gen3 only
    [BasicState.COPYING_LOGS]: "COPYING_LOGS",
    [BasicState.RECOVERING_LOCATION]: "RECOVERING_LOCATION",
    [BasicState.EXPLORING_MAP]: "EXPLORING_MAP",
    [BasicState.ACQUIRING_PERSISTENT_MAP_IDS]: "ACQUIRING_PERSISTENT_MAP_IDS",
    [BasicState.CREATING_UPLOADING_MAP]: "CREATING_UPLOADING_MAP",
    [BasicState.SUSPENDED_EXPLORATION]: "SUSPENDED_EXPLORATION",
}

export function getRobotStateString(robot: Robot){
    return basicStateStrings[resolveRobotState(robot)];
}

export function resolveRobotState(robot: Robot) {
    // off wibes i guess lol
    if (robot.type === RobotType.NeatoGen3) {
        switch (robot.state) {
            case Neato.Gen3.RobotState.ERROR: return BasicState.ERROR
            case Neato.Gen3.RobotState.PAUSED: return BasicState.PAUSED
            case Neato.Gen3.RobotState.IDLE: return BasicState.IDLE
        }
        switch (robot.action) {
            case Neato.Gen3.RobotAction.HOUSE_CLEANING: return BasicState.CLEANING
            case Neato.Gen3.RobotAction.SPOT_CLEANING: return BasicState.CLEANING
            case Neato.Gen3.RobotAction.MANUAL_CLEANING: return BasicState.CLEANING
            case Neato.Gen3.RobotAction.MAP_CLEANING: return BasicState.CLEANING
            case Neato.Gen3.RobotAction.DOCKING: return BasicState.DOCKING
            case Neato.Gen3.RobotAction.USER_MENU_ACTIVE: return BasicState.TEST // ?
            case Neato.Gen3.RobotAction.SUSPENDED_CLEANING: return BasicState.CLEANING_STANDBY // ?
            case Neato.Gen3.RobotAction.UPDATING: return BasicState.UPDATING

            case Neato.Gen3.RobotAction.COPYING_LOGS: return BasicState.COPYING_LOGS
            case Neato.Gen3.RobotAction.RECOVERING_LOCATION: return BasicState.RECOVERING_LOCATION
            case Neato.Gen3.RobotAction.EXPLORING_MAP: return BasicState.EXPLORING_MAP
            case Neato.Gen3.RobotAction.ACQUIRING_PERSISTENT_MAP_IDS: return BasicState.ACQUIRING_PERSISTENT_MAP_IDS
            case Neato.Gen3.RobotAction.CREATING_UPLOADING_MAP: return BasicState.CREATING_UPLOADING_MAP
            case Neato.Gen3.RobotAction.SUSPENDED_EXPLORATION: return BasicState.SUSPENDED_EXPLORATION
        }
    }

    // robot_state.py:55-96
    if (robot.type === RobotType.NeatoGen4) {
        switch (robot.state) {
            case Neato.Gen4.RobotState.ERROR: return BasicState.ERROR
            case Neato.Gen4.RobotState.PAUSED: return BasicState.PAUSED
            case Neato.Gen4.RobotState.IDLE: return BasicState.IDLE
        }
        switch (robot.action) {
            case Neato.Gen4.RobotAction.DOCKING: return BasicState.DOCKING
            case Neato.Gen4.RobotAction.CLEANING: return BasicState.CLEANING
            case Neato.Gen4.RobotAction.CLEANING_STANDBY: return BasicState.CLEANING_STANDBY
            case Neato.Gen4.RobotAction.DIAGNOSTIC_TEST: return BasicState.TEST
            case Neato.Gen4.RobotAction.UPDATING_SOFTWARE: return BasicState.UPDATING
        }
    }

    return BasicState.INVALID;
}