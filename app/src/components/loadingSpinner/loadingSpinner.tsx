import styles from './loadingSpinner.module.scss'
import logo from '../../assets/logo.svg'
import { useTranslation } from 'react-i18next'

export default function LoadingSpinner({ message }: { message?: string }) {
    const { t } = useTranslation()
    return (
        <div className={styles.wrap}>
            <img src={logo} alt={t('common.loading')} className={styles.spinner} />
            {message && <span className={styles.message}>{message}</span>}
        </div>
    )
}
