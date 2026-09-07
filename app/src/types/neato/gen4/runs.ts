import type { RunSettings } from "./schedule";


export interface Cleaning {
    id: string,
    robot: string,
    floorplan: string
    started_by: string,
    cleaning_complete: boolean
    timing: Timing
    battery_consumed: number
    runs: Run[]
}

export interface Run {
    timing: Timing,
    track_uuid: string // ?
    state: string
    stats: Stats
    settings: RunSettings
}

export interface Stats {
    area: number,
    pickup_count: number // how many times robot was picked up ?
}

export interface Timing {
    start: string // date
    end: string // date
    charging: number // how many times it charged
    error: number // how many times it errored
    pause: number // how many times it paused
}
