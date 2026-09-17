import styles from './runs.module.scss'
import { useRef, useEffect, useState, useCallback } from 'react'
import Drawer from '../../components/drawer/drawer'

import type { GetSchedule, ScheduleEvent } from './types'
import { FaPlus, FaTimes, FaUndo, FaPen, FaCheckCircle, FaCircle, FaTrash } from 'react-icons/fa'
import Input from '../../components/input/input'
import { PiBoundingBox } from "react-icons/pi";
import { biEnum } from '../../types/.helpers'
import Button from '../../components/button/button'
import { GEN3_COMMANDS } from '../../http/gen3'
import { Http } from '../../http'
import { useApp } from '../../context/useApp'
import type { UseState } from '../map/types'
import { RobotType, type Neato } from '../../types'
import { IoMdTime, IoMdCheckmarkCircle, IoMdCloseCircleOutline } from "react-icons/io";
import { SlEnergy } from "react-icons/sl";
import Map from '../../components/map/map'
import { useRobot } from '../../context/useRobot'
import { usePersistentMap } from '../../loaders/resources'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

export default () => {
    const { t } = useTranslation()
    const { setCleanings, cleanings } = useApp()
    const { robot } = useRobot()
    const [selectedCleaning, setSelectedCleaning] = useState<Neato.Gen4.Cleaning>();
    const [drawerOpen, setDrawerOpen] = useState(false)

    const getCleanings = () => {
        Http.getCleanings(robot.serial).then(res => {
            const sorted = [...res.data].sort(
                (a, b) => new Date(b.timing.start).getTime() - new Date(a.timing.start).getTime()
            )
            setCleanings(sorted)
        })
    }

    useEffect(() => {
        if (!robot) return;
        getCleanings();
    }, [robot])

    useEffect(() => {
        setDrawerOpen(!!selectedCleaning);
    }, [selectedCleaning])

    if (!cleanings) return

    return (
        <div className={styles.container}>

            <div className={styles.featureList} style={{ overflow: drawerOpen ? 'hidden' : 'auto' }}>
                {cleanings.map((item, i) => (
                    <div key={i} className={styles.item} onClick={() => setSelectedCleaning(item)}>
                        <div className={styles.info}>
                            <span>{t('runs.entryTitle', { startedBy: item.started_by, date: new Date(item.timing.start).toLocaleString(i18n.language) })}</span>
                            <span className={styles.type}>
                                <IoMdTime /> &nbsp; {formatDuration(item.timing.start, item.timing.end)} &nbsp; |
                                &nbsp; {calcTotalArea(item)}m² &nbsp; |
                                &nbsp; <SlEnergy /> &nbsp; {t('runs.batteryUsed', { percent: item.battery_consumed })}
                            </span>
                        </div>
                        {item.cleaning_complete ? <IoMdCheckmarkCircle /> : <IoMdCloseCircleOutline />}
                    </div>
                ))}
                {cleanings?.length === 0 && (
                    <span style={{ textAlign: 'center' }}>{t('runs.noRuns')}</span>
                )}
            </div>

            <Drawer
                open={drawerOpen}
                handle={false}
                onOpenChange={setDrawerOpen}
                openHeightPercent={70}
                title={selectedCleaning && new Date(selectedCleaning.timing.start).toLocaleString(i18n.language)}
            >

                <>

                    <div className={styles.basicInfos}>
                        <div className={styles.basicInfo}>
                            <span>&nbsp;</span>
                            <span>{selectedCleaning && selectedCleaning.cleaning_complete ? <IoMdCheckmarkCircle /> : <IoMdCloseCircleOutline />} &nbsp;</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>{t('runs.duration')}</span>
                            <span>{selectedCleaning && formatDuration(selectedCleaning?.timing.start, selectedCleaning?.timing.end)} &nbsp;</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>{t('runs.area')}</span>
                            <span>{selectedCleaning && calcTotalArea(selectedCleaning)} m2</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>{t('runs.battery')}</span>
                            <span>{selectedCleaning?.battery_consumed} %</span>
                        </div>
                    </div>


                    <hr style={{ width: '100%' }} />

                    <Map mapId={selectedCleaning?.floorplan || ''} runId={selectedCleaning?.floorplan || ''} />

                    {/* TODO: Explain the differnet colors meaning */}

                    <hr style={{ width: '100%' }} />
                    

                    <div className={styles.runs}>
                        {selectedCleaning && selectedCleaning.runs.map((run, i) =>

                            <div key={i} className={styles.run}>
                                <div className={styles.info}>
                                    <span>{run.state} | {formatDuration(run.timing.start, run.timing.end)}</span>
                                    <span className={styles.type}>
                                        {formatArea(run.stats.area)}m² &nbsp; |
                                        &nbsp; {run.settings.mode} {run.settings.navigation_mode} |
                                        {run.autonomous_dock ? t('runs.docked') : t('runs.notDocked')}
                                    </span>
                                    <span className={styles.type}>
                                        {t('runs.timing', { error: run.timing.error, pause: run.timing.pause, charging: run.timing.charging })}, {t('runs.pickedUp', { count: run.stats.pickup_count })}
                                    </span>
                                </div>
                                {/* {run.cleaning_complete ? <IoMdCheckmarkCircle /> : <IoMdCloseCircleOutline />} */}
                            </div>
                        )}
                    </div>

                </>

            </Drawer>
        </div>

    )
}


function formatDuration(startDate: string, endDate: string) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const totalSeconds = Math.floor((end - start) / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return i18n.t('runs.durationLong', { hours, minutes, seconds });
    }

    return i18n.t('runs.durationShort', { minutes, seconds });
}

function formatArea(area: number) {
    return Math.round(area * 10) / 10
}

function calcTotalArea(cleaning: Neato.Gen4.Cleaning) {
    return formatArea(cleaning.runs.reduce(
        (total, run) => total + run.stats.area,
        0
    ))
}
