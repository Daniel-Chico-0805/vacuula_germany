import styles from './home.module.scss'
import logo from '../../assets/logo.svg'
import { MdAutoAwesome, MdCleaningServices, MdError, MdOutlineHealthAndSafety, MdWarning } from 'react-icons/md'
import { IoMdPause, IoMdPlay } from 'react-icons/io'
import { TbAdjustments, TbLeaf, TbHome } from 'react-icons/tb'
import { FaBell, FaFan, FaStop } from 'react-icons/fa'
import { HiMap } from "react-icons/hi2";
import { CleaningCategory, CleaningMode, CleaningNavigationMode, RobotAction, RobotState } from '../../types/state'
import { useState } from 'react'
import Drawer from '../../components/drawer/drawer'
import { FaHouse } from 'react-icons/fa6'
import { BiTargetLock } from "react-icons/bi";
import { useApp } from '../../context/AppContext'
import TimeAgo from 'react-timeago'
import { COMMANDS } from '../../http/commands'
import Input from '../../components/input/input'

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ type = 'error', icon, title, sub, action, onClick, visible = true }: { type?: 'error' | 'warning' | 'info', icon: React.ReactNode, title: string, sub?: string, action?: string, onClick?: () => void, visible?: boolean }) {
    return (
        <div className={`${styles.alertCard} ${styles[type]}`} style={{ visibility: visible ? 'visible' : 'hidden' }}>
            <div className={styles.alertIconWrap}>
                {icon}
            </div>
            <div className={styles.alertText}>
                <div className={styles.alertTitle}>{title}</div>
                {sub && <div className={styles.alertSub}>{sub}</div>}
            </div>
            {action && <button className={styles.alertAction} onClick={onClick}>{action}</button>}
        </div>
    )
}

// ── Control button ────────────────────────────────────────────────────────────
function CtrlBtn({ icon, label, disabled, onClick }: { icon: React.ReactNode, label: string, disabled?: boolean, onClick?: () => void }) {
    return (
        <button className={`${styles.ctrlBtn} ${disabled ? styles.disabled : ''}`} onClick={onClick} aria-label={label} disabled={disabled}>
            {icon}
            <span className={styles.ctrlLabel}>{label}</span>
        </button>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
    const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
    const [cleaningMode, setCleaningMode] = useState<CleaningMode>(CleaningMode.ECO)
    const [navigationMode, setNavigationMode] = useState<CleaningNavigationMode>(CleaningNavigationMode.NORMAL)
    const [cleaningCategory, setCleaningCategory] = useState<CleaningCategory>(CleaningCategory.HOUSE)
    const [spotHeight, setSpotHeight] = useState(200)
    const [spotWidth, setSpotWidth] = useState(200)
    const [bellAnimating, setBellAnimating] = useState(false)
    const { robot, lastHeartbeat } = useApp()

    return (
        <div className={styles.home}>

            {/* ── Alerts ── */}
            <div className={styles.alerts}>
                <AlertCard
                    visible={!!robot?.error}
                    type="error"
                    icon={<MdError size={17} />}
                    title="error"
                    sub={robot?.error}
                />
                <AlertCard
                    visible={!!robot?.alert}
                    type="warning"
                    icon={<MdWarning size={17} />}
                    title="alert"
                    sub={robot?.alert}
                    action="Dismiss"
                    onClick={() => {
                        COMMANDS.dismissCurrentAlert(robot.serial)
                    }}
                />
            </div>

            {/* ── Mascot + ring ── */}
            <div className={styles.mascotZone}>
                <div className={styles.statusRing}>
                    {/* <RingProgress pct={75} /> */}
                    <img src={logo} alt="robot" className={styles.robotImage} />
                </div>
                <div className={styles.statusBadge}>
                    {/* <span className={styles.pulseDot} /> */}
                    <span className={styles.statusLabel}>
                        {
                            robot?.state === RobotState.BUSY ? 'check action ' + RobotAction[robot.action] :
                                robot?.state === RobotState.IDLE ? 'Idle' :
                                    robot?.state === RobotState.PAUSED ? 'Paused' :
                                        robot?.state === RobotState.ERROR ? 'Error' :
                                            'Unknown'
                        }
                    </span>
                    <hr />
                    <span className={styles.timeAgo}>
                        {lastHeartbeat ? <TimeAgo date={lastHeartbeat} /> : 'N/A'}
                    </span>
                    {/* <span className={styles.statusLabel}>Offline</span> */}
                </div>
            </div>

            {/* ── Stats ── */}
            {/* <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>48<span className={styles.statUnit}>m²</span></div>
                    <div className={styles.statLabel}>Last coverage</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>15<span className={styles.statUnit}>min</span></div>
                    <div className={styles.statLabel}>Last run time</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>23<span className={styles.statUnit}>min</span></div>
                    <div className={styles.statLabel}>Avg. run time</div>
                </div>
            </div> */}

            {/* ── Controls ── */}
            <div className={styles.buttons}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                    <CtrlBtn 
                        icon={<FaBell size={22} className={bellAnimating ? styles.bellIcon : ''} />} 
                        label="Locate" 
                        onClick={() => {
                            setBellAnimating(true)
                            COMMANDS.findMe(robot.serial)
                            // Reset animation after it completes
                            setTimeout(() => setBellAnimating(false), 500)
                        }} 
                    />
                    <CtrlBtn icon={
                        cleaningCategory === CleaningCategory.HOUSE ? <FaHouse size={22} /> :
                            cleaningCategory === CleaningCategory.SPOT ? <BiTargetLock size={22} /> :
                                cleaningCategory === CleaningCategory.MAP ? <HiMap size={22} /> : <TbAdjustments size={22} />
                    } onClick={() => setCategoryDrawerOpen(true)} label={
                        cleaningCategory === CleaningCategory.HOUSE ? 'House' :
                            cleaningCategory === CleaningCategory.SPOT ? 'Spot' :
                                cleaningCategory === CleaningCategory.MAP ? 'Map' : '...'
                    } />

                    {navigationMode === CleaningNavigationMode.NORMAL && (<CtrlBtn icon={<MdCleaningServices color='#28d1bb' size={22} />} onClick={() => setNavigationMode(CleaningNavigationMode.EXTRA_CARE)} label="Normal" />)}
                    {navigationMode === CleaningNavigationMode.EXTRA_CARE && (<CtrlBtn icon={<MdOutlineHealthAndSafety color='#F59E0B' size={22} />} onClick={() => setNavigationMode(CleaningNavigationMode.DEEP)} label="Extra Care" />)}
                    {navigationMode === CleaningNavigationMode.DEEP && (<CtrlBtn icon={<MdAutoAwesome color='#8B5CF6' size={22} />} onClick={() => setNavigationMode(CleaningNavigationMode.NORMAL)} label="Deep" />)}

                    {cleaningMode === CleaningMode.ECO && (<CtrlBtn icon={<TbLeaf size={22} color='lime' />} onClick={() => setCleaningMode(CleaningMode.NORMAL)} label="Eco" />)}
                    {cleaningMode === CleaningMode.NORMAL && (<CtrlBtn icon={<FaFan size={22} color='orange' />} onClick={() => setCleaningMode(CleaningMode.ECO)} label="Normal" />)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', paddingBottom: '2rem', alignItems: 'center' }}>
                    <CtrlBtn disabled={!robot?.availableCommands?.stop} icon={<FaStop size={22} />} label="Stop" onClick={() => {
                        COMMANDS.stopCleaning(robot.serial)
                    }} />


                    {robot?.availableCommands?.pause ? (
                        <button className={`${styles.start} ${!robot?.availableCommands?.pause ? styles.disabled : ''}`} aria-label="Pause cleaning" onClick={() => {
                            COMMANDS.pauseCleaning(robot.serial)
                        }}>
                            <IoMdPause size={34} />
                        </button>
                    ) :

                        robot?.availableCommands?.resume ? (
                            <button className={`${styles.start} ${!robot?.availableCommands?.resume ? styles.disabled : ''}`} aria-label="Resume cleaning" onClick={() => {
                                COMMANDS.resumeCleaning(robot.serial)
                            }}>
                                <IoMdPlay size={34} />
                            </button>
                        ) : (
                            <button className={`${styles.start} ${!robot?.availableCommands?.start ? styles.disabled : ''}`} aria-label="Start cleaning" onClick={() => {
                                if (cleaningCategory === CleaningCategory.SPOT) {
                                    COMMANDS.startCleaningSpot(robot.serial, spotHeight, spotWidth, cleaningMode, navigationMode)
                                } else if (cleaningCategory === CleaningCategory.MAP) {
                                    COMMANDS.startCleaning(robot.serial, cleaningMode, navigationMode)
                                } else {
                                    COMMANDS.startCleaning(robot.serial, cleaningMode, navigationMode)
                                }
                            }}>
                                <IoMdPlay size={34} />
                            </button>
                        )
                    }


                    <CtrlBtn disabled={!robot?.availableCommands?.goToBase} icon={<TbHome size={22} />} label="Base" onClick={() => {
                        COMMANDS.sendToBase(robot.serial)
                    }} />
                </div>



            </div>

            <Drawer open={categoryDrawerOpen} handle={false} onOpenChange={(open) => setCategoryDrawerOpen(open)} openHeightPercent={40} title="Select Mode">
                <div className={styles.drawerContent}>
                    {/* Category Selection */}

                    <Input
                        type="select"
                        label="Mode"
                        options={[
                            { value: CleaningCategory.MAP, label: "Map" },
                            { value: CleaningCategory.HOUSE, label: "House" },
                            { value: CleaningCategory.SPOT, label: "Spot" },
                        ]}
                        value={cleaningCategory}
                        onChange={(value) => setCleaningCategory(value)}
                        extraInfo={
                            cleaningCategory === CleaningCategory.MAP ? "Cleans specific zones defined on the map." :
                                cleaningCategory === CleaningCategory.HOUSE ? "Cleans the entire area it can, ignoring zones and nogo-lines." :
                                    cleaningCategory === CleaningCategory.SPOT ? "Cleans a specific area defined by height and width." : ""
                        }
                    />


                    {/* Spot Settings */}
                    {cleaningCategory === CleaningCategory.SPOT && (
                        <div className={styles.spotSettings}>
                            {/* Height Slider */}
                            <div className={styles.sliderSection}>
                                <div className={styles.sliderLabel}>
                                    Height: <span className={styles.sliderValue}>{spotHeight} cm</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="400"
                                    value={spotHeight}
                                    onChange={(e) => setSpotHeight(Number(e.target.value))}
                                    className={styles.sliderInput}
                                />
                            </div>

                            {/* Width Slider */}
                            <div className={styles.sliderSection}>
                                <div className={styles.sliderLabel}>
                                    Width: <span className={styles.sliderValue}>{spotWidth} cm</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="400"
                                    value={spotWidth}
                                    onChange={(e) => setSpotWidth(Number(e.target.value))}
                                    className={styles.sliderInput}
                                />
                            </div>
                        </div>
                    )}

                    {/* OK Button */}
                    <button className={styles.okButton} onClick={() => setCategoryDrawerOpen(false)}>
                        OK
                    </button>
                </div>
            </Drawer>

        </div>
    )
}
