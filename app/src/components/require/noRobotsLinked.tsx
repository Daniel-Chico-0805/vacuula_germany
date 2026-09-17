import { useTranslation } from 'react-i18next'

export default function NoRobotsLinked() {
    const { t } = useTranslation()
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>{t('require.noRobotsLinked')}</p>
        </div>
    )
}
