import styles from './loadingSpinner.module.scss'
import logo from '../../assets/logo.svg'

export default function LoadingSpinner({ message }: { message?: string }) {
    return (
        <div className={styles.wrap}>
            <img src={logo} alt="Loading" className={styles.spinner} />
            {message && <span className={styles.message}>{message}</span>}
        </div>
    )
}