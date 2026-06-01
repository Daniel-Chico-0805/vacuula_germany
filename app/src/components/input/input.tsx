import styles from './input.module.scss'

interface TextInputProps {
    type: 'text',
    onChange: (value: string) => void,
    value?: string,
    placeholder?: string,
}

interface SelectInputProps<T> {
    type: 'select',
    options: { value: T, label: string }[],
    value: T,
    onChange: (value: T) => void,
}

interface SwitchInputProps {
    type: 'switch',
    value: boolean,
    onChange: (value: boolean) => void,
}

interface CustomInputProps {
    type: 'custom',
    children: React.ReactNode
}

interface BaseInputProps {
    label?: string,
    extraInfo?: string,
    skipSection?: true,
}

type InputProps<T> = (TextInputProps | SelectInputProps<T> | SwitchInputProps | CustomInputProps) & BaseInputProps

export default function Input<T>(props: InputProps<T>) {

    const inputContent = (
        <>
            {props.type === 'text' && (
                <input
                    className={styles.text}
                    type="text"
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                />
            )}

            {props.type === 'select' && (
                <div className={styles.selectButtons}>
                    {props.options.map((option, i) => (
                        <button
                            key={i}
                            className={`${styles.selectButton} ${props.value === option.value ? styles.activeSelectButton : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                props.onChange(option.value);
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {props.type === 'switch' && (
                <label className={styles.switch}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={props.value}
                        onChange={(e) => props.onChange(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                </label>
            )}

            {props.type === 'custom' && (props.children)}

            {props.extraInfo && (
                <div className={styles.extraInfo}>
                    {props.extraInfo}
                </div>
            )}
        </>
    )

    if (props.skipSection) {
        return inputContent
    }

    return (
        <div className={styles.section}>
            <div className={styles.label}>
                {props.label}
            </div>
            {inputContent}
        </div>
    )
}

