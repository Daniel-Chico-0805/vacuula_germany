import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { PersistentMap, Robot } from '../types/robot'
import { Http } from '../http'
import { COMMANDS } from '../http/commands'
import { RobotAction, RobotState } from '../types/state'
import type { UseState } from '../pages/map/types'


interface AppContextType {
    robot: Robot,
    lastHeartbeat?: number,
    
    persistentMaps?: PersistentMap[]
    setPersistentMaps: UseState<PersistentMap[] | undefined>


    // User/Session
    userId: string | null
    setUserId: (id: string | null) => void

    // App settings
    isDarkMode: boolean
    setIsDarkMode: (dark: boolean) => void

    // Loading states
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    loadingState: { isLoading: boolean, message?: string }
    setLoadingState: (state: { isLoading: boolean, message?: string }) => void

    // Notifications/Messages
    message: string | null
    setMessage: (msg: string | null) => void

    // Add more global state as needed
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {

    const [selectedRobotSerial, setSelectedRobotSerial] = useState<string | undefined>()
    const [robot, setRobot] = useState<Robot>()
    const [lastHeartbeat, setLastHeartbeat] = useState<number | undefined>()
    const [persistentMaps, setPersistentMaps] = useState<PersistentMap[]>()


    const [userId, setUserId] = useState<string | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loadingState, setLoadingState] = useState<{ isLoading: boolean, message?: string }>({ isLoading: false })
    const [message, setMessage] = useState<string | null>(null)

    // Set up axios interceptor callback
    useEffect(() => {
        Http.setLoadingStateCallback(setLoadingState)
    }, [])

    useEffect(() => {
        Http.getRobots().then((res) => {
            const data = res.data
            setSelectedRobotSerial('GPC23118-40bd32d13ac7')
            setRobot({
                serial: 'GPC23118-40bd32d13ac7',
                name: data['GPC23118-40bd32d13ac7'].name,
                state: RobotState.INVALID,
                action: RobotAction.INVALID
            })
        });
    }, [])

    useEffect(() => {
        if (!selectedRobotSerial) return;

        const events = new EventSource(
            `http://${location.hostname}:8080/app/robot/${selectedRobotSerial}/connect`,
        );

        events.onopen = () => {
            console.log(selectedRobotSerial, Http.sendCmd, COMMANDS.uploadLogs, COMMANDS.getLogsUploadState, COMMANDS.getLocalStats)
            COMMANDS.getRobotState(selectedRobotSerial).then((res) => {
                if (!robot) return;
                setRobot({
                    ...robot,
                    availableCommands: res.data.availableCommands,
                    details: res.data.details,
                    alert: res.data.alert,
                    error: res.data.error,
                    state: res.data.state,
                    action: res.data.action,
                })
            });
        }

        events.onmessage = (event) => {
            setLastHeartbeat(Date.now());
            const wrapper = JSON.parse(event.data);

            console.log("STREAM:", wrapper);
            if (wrapper?.data?.type !== "state" && wrapper?.data?.eventId !== "77") {
                console.log("Received non-state event:", wrapper.data);
                return;
            }

            console.log("Received state event:", wrapper.data);

            if (!robot) return;
            console.log("Updating robot state with:", wrapper.data.data.details);
            setRobot({
                ...robot,
                availableCommands: wrapper.data.data.availableCommands,
                details: wrapper.data.data.details,
                alert: wrapper.data.data.alert,
                error: wrapper.data.data.error,
                state: wrapper.data.data.state,
                action: wrapper.data.data.action,
            })
        };

        events.onerror = (err) => {
            alert(JSON.stringify(err));
            console.error("SSE error:", err);
        };

        return () => {
            events.close();
        };
    }, [selectedRobotSerial]);



    const value: AppContextType = {
        userId,
        setUserId,
        isDarkMode,
        setIsDarkMode,
        isLoading,
        setIsLoading,
        loadingState,
        setLoadingState,
        message,
        setMessage,
        robot: robot!,
        lastHeartbeat,

        persistentMaps,
        setPersistentMaps
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) throw new Error('useApp must be used within AppProvider')
    return context
}
