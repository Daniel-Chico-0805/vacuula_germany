import { Http } from "../http"
import type { Neato } from "../types"
import type { RobotBaseResponse } from "../types/neato/gen3"


function getRobotState(serial: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotStateResponse>(serial, {
        ability: "state.show",
    })
}

function findMe(serial: string) {
    return Http.sendCmd(serial, {
        ability: "utilities.find_me",
    })
}

function getSchedule(serial: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "scheduling.show",
    })
}

function sendToBase(serial: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "navigation.return_to_base",
    })
}

function updateOrAddSchduledEvent(serial: string, event: Neato.Gen4.CommandEvent) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "scheduling.update",
        event,
    })
}

function deleteScheduledEvent(serial: string, id: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "scheduling.delete",
        id,
    })
}

function stopCleaning(serial: string) {
    return Http.sendCmd(serial, {
        ability: "cleaning.cancel",
    })
}

function pauseCleaning(serial: string) {
    return Http.sendCmd(serial, {
        ability: "cleaning.pause",
    })
}


function getSettings<Op extends Neato.Gen4.SettingsGetOperation>(serial: string, settings: Neato.Gen4.RobotSettingsGet<Op>) {
    return Http.sendCmd<Neato.Gen4.BaseResponse<Neato.Gen4.SettingsMap[Op]>>(serial, {
        ability: settings.operation,
    })
}

function setSettings<Op extends Neato.Gen4.SettingsSetOperation>(serial: string, settings: Neato.Gen4.RobotSettingsSet<Op>) {
    return Http.sendCmd<Neato.Gen4.BaseResponse<Neato.Gen4.SettingsMap[Op]>>(serial, {
        ability: settings.operation,
        ...settings.values
    })
}

function factoryReset(serial: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "settings.factory_reset"
    })
}

function demoteFloorplan(serial: string, id: string) {
    return Http.sendCmd<Neato.Gen4.GetRobotScheduleResponse>(serial, {
        ability: "maps.demote_floorplan",
        rank_uuid: id,
    })
}


function startCleaning(serial: string, mode: Neato.Gen4.CleaningMode, navigationMode: Neato.Gen4.CleaningNavigationMode, temp_track_id: string) {
    return Http.sendCmd(serial, {
        ability: "cleaning.start",
        runs: [{
            map: {
                "rank_id":     "894e115c-7934-4519-bc62-2f64db633136", // "338e289b-0a3d-406f-9247-902623b1b455",
                "track_id":     temp_track_id, //"e79742d6-4517-4734-9dce-55d9d618d469",
                "nogo_enabled": false,
            },
            // map: null,
            settings: {
                mode,
                navigation_mode: navigationMode
            }
        }]
    })
}

function cleaningInfo(serial: string) {
    return Http.sendCmd<RobotBaseResponse<Neato.Gen4.Cleaning>>(serial, {
        ability: "cleaning.show",
    })
}


export const GEN4_COMMANDS = {
    startCleaning,
    stopCleaning,
    pauseCleaning,
    cleaningInfo,
    sendToBase,

    getSchedule,
    updateOrAddSchduledEvent,
    deleteScheduledEvent,
    
    demoteFloorplan,
    getSettings,
    setSettings,
    
    getRobotState,
    findMe,

    factoryReset
}
