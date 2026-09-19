import type { ReactNode } from 'react'
import { useApp } from '../../context/useApp'
import Loading from '../../pages/loading/loading'
import NoRobotsLinked from './noRobotsLinked'
import RobotsOffline from './robotsOffline'

export function RequireRobots({ children }: { children: ReactNode }) {
    const { robots } = useApp()

    if (!robots) return <Loading />

    const entries = Object.entries(robots)
    if (entries.length === 0) {
        return <NoRobotsLinked />
    }

    // a robot that was selected and went offline stays on screen (with its offline badge)
    const hasOnlineRobot = entries.some(([, info]) => info.connected)
    if (!hasOnlineRobot) {
        return <RobotsOffline robots={robots} />
    }

    return <>{children}</>
}