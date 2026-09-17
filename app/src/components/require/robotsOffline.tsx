import { useTranslation } from 'react-i18next'
import type { QuickRobotInfo } from '../../types'

export default function RobotsOffline({ robots }: { robots: QuickRobotInfo }) {
    const { t } = useTranslation()
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>{t('require.allRobotsOffline')}</p>
            <ul>
                {Object.entries(robots).map(([serial, info]) => (
                    <li key={serial}>{info.name}</li>
                ))}
            </ul>
        </div>
    )
}
