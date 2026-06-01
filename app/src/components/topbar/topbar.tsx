import styles from './topbar.module.scss'
import { MdError, MdWarning } from 'react-icons/md'
import { TbChargingPile, TbChevronDown } from 'react-icons/tb'
import Battery from '../battery/Battery'
import { useNavigate } from 'react-router'
import { useApp } from '../../context/AppContext'
import { useEffect, useState } from 'react'
import { GiNightSleep } from "react-icons/gi";

let onlineTimeout: number;

export default function Topbar() {
  const navigate = useNavigate()
  const { robot, lastHeartbeat } = useApp()

  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    clearTimeout(onlineTimeout)
    setIsOnline(true)
    
    onlineTimeout = setTimeout(() => {
      setIsOnline(false)
    }, 30 * 1000)
  }, [lastHeartbeat])

  return (
    <button className={styles.topbar} onClick={() => navigate('/settings')} aria-label="Open robot settings">

      {/* <span className={styles.pulseDot} style={{ backgroundColor: isOnline ? '#1edd88' : '#ff4d4f' }} /> */}
      <GiNightSleep size={25} fill='#1edd88' className={styles.pulseDot} />
      <span className={styles.name}>{robot?.name}</span>

      <div className={styles.right}>
        {robot?.error && <MdError size={16} className={styles.iconErr} />}
        {robot?.alert && <MdWarning size={16} className={styles.iconWarn} />}

        {robot?.details?.isDocked && (
          <TbChargingPile size={15} className={styles.iconDocked} title="Docked" />
        )}

        <Battery percentage={robot?.details?.charge} isCharging={robot?.details?.isCharging} />

        <TbChevronDown size={14} className={styles.chevron} aria-hidden="true" />
      </div>

    </button>
  )
}