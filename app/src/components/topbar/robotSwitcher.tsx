import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './robotSwitcher.module.scss'
import { TbChevronDown } from 'react-icons/tb'
import { useApp } from '../../context/useApp'
import { useRobots } from '../../context/useRobots'

export default function RobotSwitcher({ icon, children }: { icon?: ReactNode, children?: ReactNode }) {
    const { robot, selectRobot } = useApp()
    const { robots } = useRobots()

    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    const entries = Object.entries(robots)
    const selected = robot ? robots[robot.serial] : undefined

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(o => !o)}
                aria-label="Select robot"
                aria-expanded={isOpen}
            >
                {icon}
                <span className={styles.name}>{selected?.name ?? 'Select a robot'}</span>
                {children}
                <TbChevronDown
                    size={14}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className={styles.dropdown} role="listbox">
                    {entries.map(([serial, info]) => (
                        <button
                            key={serial}
                            role="option"
                            aria-selected={serial === robot?.serial}
                            disabled={!info.connected}
                            className={[
                                styles.dropdownItem,
                                serial === robot?.serial ? styles.dropdownItemActive : '',
                                !info.connected ? styles.dropdownItemOffline : '',
                            ].join(' ')}
                            onClick={() => {
                                if (!info.connected) return;
                                selectRobot(serial)
                                setIsOpen(false)
                            }}
                        >
                            <span className={styles.dropdownName}>{info.name}</span>
                            {!info.connected && <span className={styles.offlineTag}>Offline</span>}
                            {serial === robot?.serial && <span className={styles.dropdownCheck}>✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}