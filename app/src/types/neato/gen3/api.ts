import type { NoGoLine, Zone } from "../../../pages/map/types";
import type { GetSchedule } from "../../../pages/schedule/types";
import { biEnum } from "../../.helpers";


export const RobotApiResult = biEnum({
    OK: 'ok',
    BAD_REQUEST: 'bad_request',
    COMMAND_NOT_FOUND: 'command_not_found',
});
export type RobotApiResult = typeof RobotApiResult[keyof typeof RobotApiResult];


export interface RobotBaseResponse<T extends {}> {
    version: 1;
    reqId: string;
    result: RobotApiResult;
    data: T;
}


export type GetMapBoundariesResponse = RobotBaseResponse<{
    boundaries: (NoGoLine | Zone)[]
}>;

export type GetScheduleResponse = RobotBaseResponse<GetSchedule>;



export const RobotDay = biEnum({
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
});
export type RobotDay = typeof RobotDay[keyof typeof RobotDay];

