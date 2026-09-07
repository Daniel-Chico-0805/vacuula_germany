import styles from './button.module.scss'


interface BaseInputProps {
    text: string,
    onClick: () => void,
    style: 'primary' | 'secondary' | 'success' | 'fail'
}

type ButtonProps= BaseInputProps


export default (prop: ButtonProps) => {

    return (
        <button className={`${styles.button} ${styles[prop.style]}`} onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            prop.onClick()
        }}>
            <span>{prop.text}</span>
        </button>
    )

}

