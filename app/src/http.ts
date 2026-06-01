import axios from "axios";
import type { PersistentMap, QuickRobotInfo } from "./types/robot";

// Store for loading state callback - will be set by AppContext
let loadingStateCallback: ((state: { isLoading: boolean; message?: string }) => void) | null = null;

const instance = axios.create({
  baseURL: `http://${location.hostname}:8080/app`,
});


// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    if (loadingStateCallback) {
      loadingStateCallback({ isLoading: true, message: 'Sending command...' });
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
    return instance.get<PersistentMap[]>(`/robot/${serial}/maps`)
  }

  static getPersistentMap(serial: string, mapId: string) {
    return instance.get<PersistentMap[]>(`/robot/${serial}/maps/${mapId}`)
  }

  static updatePersistentMap(serial: string, mapId: string, data: { name?: string, enabled?: boolean }) {
    return instance.post(`/robot/${serial}/maps/${mapId}`, data)
  }

  static getRobots() {
    return instance.get<QuickRobotInfo>('/robots');
  }

  static updateRobot(serial: string, data: { name: string }) {
    return instance.post(`/robot/${serial}`, data)
  }

  static setLoadingStateCallback(callback: (state: { isLoading: boolean; message?: string }) => void) {
    loadingStateCallback = callback;
  }
}


