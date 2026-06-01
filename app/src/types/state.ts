import { biEnum } from "./.helpers";
import type { ApiResult, RobotModel, ServiceLevel } from "./robot";

export interface GetRobotStateResponse {
    version:           number;
    reqId:             string;
    result:            ApiResult;
    data:              {}; // not sure
    state:             RobotState;
    action:            RobotAction;
    error:             undefined | RobotError;
    alert:             undefined | RobotAlert;
    cleaning:          Cleaning;
    details:           Details;
    availableCommands: AvailableCommands;
    availableServices: AvailableServices;
    meta:              Meta;
}

export interface AvailableCommands {
    start:    boolean;
    stop:     boolean;
    pause:    boolean;
    resume:   boolean;
    goToBase: boolean;
}

export interface AvailableServices {
    findMe:         ServiceLevel;
    generalInfo:    ServiceLevel;
    houseCleaning:  ServiceLevel;
    IECTest:        ServiceLevel;
    localStats:     ServiceLevel;
    logCopy:        ServiceLevel;
    manualCleaning: ServiceLevel;
    maps:           ServiceLevel;
    preferences:    ServiceLevel;
    schedule:       ServiceLevel;
    softwareUpdate: ServiceLevel;
    spotCleaning:   ServiceLevel;
    wifi:           ServiceLevel;
}

export interface Cleaning {
    category:       CleaningCategory;
    mode:           CleaningMode;
    modifier:       CleaningModifier;
    navigationMode: CleaningNavigationMode;
    spotWidth:      number;
    spotHeight:     number;
}

export interface Data {
}

export interface Details {
    isCharging:        boolean;
    isDocked:          boolean;
    dockHasBeenSeen:   boolean;
    charge:            number;
    isScheduleEnabled: boolean;
}

export interface Meta {
    modelName: RobotModel;
    firmware:  string;
}


export const RobotState = biEnum({
    INVALID: 0,
    IDLE: 1,
    BUSY: 2,
    PAUSED: 3,
    ERROR: 4,
});
export type RobotState = typeof RobotState[keyof typeof RobotState];

export const RobotAction = biEnum({
    INVALID: 0,
    HOUSE_CLEANING: 1,
    SPOT_CLEANING: 2,
    MANUAL_CLEANING: 3,
    DOCKING: 4,
    USER_MENU_ACTIVE: 5, // testmode ?
    SUSPENDED_CLEANING: 6,
    UPDATING: 7,
    COPYING_LOGS: 8,
    RECOVERING_LOCATION: 9,
    MAP_CLEANING: 11,
    EXPLORING_MAP: 12,
    ACQUIRING_PERSISTENT_MAP_IDS: 13,
    CREATING_UPLOADING_MAP: 14,
    SUSPENDED_EXPLORATION: 15,
});

export type RobotAction = typeof RobotAction[keyof typeof RobotAction];

export const RobotError = biEnum({
    DUSTBIN_MISSING: 'dustbin_missing'
});

export type RobotError = typeof RobotError[keyof typeof RobotError];

export const RobotAlert = biEnum({
    DUSTBIN_FULL: 'dustbin_full'
});

export type RobotAlert = typeof RobotAlert[keyof typeof RobotAlert];

export const CleaningCategory = biEnum({
    INVALID: 0,
    MANUAL: 1,
    HOUSE: 2,
    SPOT: 3,
    MAP: 4,
});
export type CleaningCategory = typeof CleaningCategory[keyof typeof CleaningCategory];

export const CleaningMode = biEnum({
    INVALID: 0,
    ECO: 1,
    NORMAL: 2
});
export type CleaningMode = typeof CleaningMode[keyof typeof CleaningMode];

export const CleaningNavigationMode = biEnum({
    NORMAL: 1,
    EXTRA_CARE: 2,
    DEEP: 3
});
export type CleaningNavigationMode = typeof CleaningNavigationMode[keyof typeof CleaningNavigationMode];

export const CleaningModifier = biEnum({
    INVALID: 0,
    NORMAL: 1,
    DOUBLE: 2
});
export type CleaningModifier = typeof CleaningModifier[keyof typeof CleaningModifier];





