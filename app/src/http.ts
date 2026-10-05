import axios from "axios";
import i18n from "./i18n";
// import type { PersistentMap, QuickRobotInfo } from "./types/robot";
import { EVENT_CALLBACKS } from "./http/events";
import { Neato, type QuickRobotInfo } from "./types";
import type * as Gen3 from './types/neato/gen3'
import type * as Gen4 from './types/neato/gen4'
import type { NoGoLine, VacuulaMapData, Zone } from "./components/map/types";

/** GET /api/server */
export interface ServerInfo {
  /** IANA timezone the server runs in (what Gen4 robots get at login). */
  timezone: string
  /** Offset of that timezone from UTC right now, in minutes (DST-aware). */
  utc_offset_minutes: number
}

// Store for loading state callback - will be set by AppContext
let loadingStateCallback: ((state: { isLoading: boolean; message?: string }) => void) | null = null;

const instance = axios.create({
  baseURL: `http://${location.hostname}:80/api`, // IMPORTANT: keep like this for now, this will work perfectly when built and in dev. currently some issues with the vite proxy, will fix it after initial release!!
});


// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    if (loadingStateCallback) {
      loadingStateCallback({ isLoading: true, message: i18n.t('common.sendingCommand') });
    }
    return config;
  },
  (error) => {
    if (loadingStateCallback) {
      loadingStateCallback({ isLoading: false });
    }
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  (response) => {
    if (loadingStateCallback) {
      loadingStateCallback({ isLoading: false });
    }
    return response;
  },
  (error) => {
    if (loadingStateCallback) {
      loadingStateCallback({ isLoading: false });
    }
    return Promise.reject(error);
  }
);

export class Http {
  static sendCmd<T>(robotSerial: string, cmd: object) {
    return instance.post<T>(`/robot/${robotSerial}/command`, JSON.stringify(cmd));
  }

  static getPersistentMaps(serial: string) {
    return instance.get<Neato.Gen3.PersistentMap[] | Neato.Gen4.Floorplan[]>(`/robot/${serial}/maps`)
  }

  static getPersistentMap(serial: string, mapId: string) {
    return instance.get<VacuulaMapData>(`/robot/${serial}/maps/${mapId}`)
  }

  static postUseMapAsFloorPlan(serial: string, mapId: string) {
    return instance.post(`/robot/${serial}/maps/${mapId}/use`)
  }

  static postUnuseMapAsFloorPlan(serial: string, mapId: string) {
    return instance.post(`/robot/${serial}/maps/${mapId}/unuse`)
  }

  static updatePersistentMap(serial: string, mapId: string, data: { name?: string, enabled?: boolean }) {
    return instance.post(`/robot/${serial}/maps/${mapId}`, data)
  }

  static postBoundaries(serial: string, mapId: string, data: (NoGoLine | Zone)[]) {
    return instance.post(`/robot/${serial}/maps/${mapId}/boundaries`, data)
  }

  static getBoundaries(serial: string, mapId: string) {
    return instance.get(`/robot/${serial}/maps/${mapId}/boundaries`)
  }

  static test(serial: string, mapId: string) {
    return instance.get(`/robot/${serial}/maps/${mapId}/test`)
  }

  static getCleanings(serial: string) {
    return instance.get(`/robot/${serial}/runs`)
  }

  static getCleaning(serial: string, runId: string) {
    return instance.get(`/robot/${serial}/run/${runId}`)
  }

  static demoteFloorplan(serial: string, mapId: string) {
    return instance.delete(`/robot/${serial}/maps/${mapId}`)
  }

  static getRobots() {
    return instance.get<QuickRobotInfo>('/robots');
  }

  /** Server facts the UI needs: the IANA timezone it runs in and its current UTC offset. */
  static getServerInfo() {
    return instance.get<ServerInfo>('/server');
  }

  static getVacuulaCert() {
    return instance.get('/cert');
  }

  static updateRobot(serial: string, data: { name: string }) {
    return instance.post(`/robot/${serial}`, data)
  }

  static setLoadingStateCallback(callback: (state: { isLoading: boolean; message?: string }) => void) {
    loadingStateCallback = callback;
  }
}


