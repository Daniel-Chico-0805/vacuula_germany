import type { QuickRobotInfo } from '../../types'

export default function RobotsOffline({ robots }: { robots: QuickRobotInfo }) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>All your robots are currently offline.</p>
            <ul>
                {Object.entries(robots).map(([serial, info]) => (
                    <li key={serial}>{info.name}</li>
                ))}
            </ul>
        </div>
    )
}