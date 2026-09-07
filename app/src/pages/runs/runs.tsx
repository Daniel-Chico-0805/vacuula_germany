import styles from './runs.module.scss'
import { useRef, useEffect, useState, useCallback } from 'react'
import mapData from '../../assets/map-test.json'
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
import type { Neato } from '../../types'
import { IoMdTime, IoMdCheckmarkCircle, IoMdCloseCircleOutline } from "react-icons/io";
import { SlEnergy } from "react-icons/sl";
import Map from '../../components/map/map'

export default () => {
    const { robot, persistentMaps, setCleanings, cleanings } = useApp()
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

    const totalArea = selectedCleaning?.runs.map(r => r.stats.area).reduce((a, v) => a + v, 0)

    if (!cleanings) return

    return (
        <div className={styles.container}>

            <div className={styles.featureList} style={{ overflow: drawerOpen ? 'hidden' : 'auto' }}>
                {cleanings.map((item, i) => (
                    <div key={i} className={styles.item} onClick={() => setSelectedCleaning(item)}>
                        <div className={styles.info}>
                            <span>{item.started_by} cleaning | {new Date(item.timing.start).toLocaleString()}</span>
                            <span className={styles.type}>
                                <IoMdTime /> &nbsp; {formatDuration(item.timing.start, item.timing.end)} &nbsp; |
                                &nbsp; {calcTotalArea(item)}m² &nbsp; |
                                &nbsp; <SlEnergy /> &nbsp; {item.battery_consumed}% used
                            </span>
                        </div>
                        {item.cleaning_complete ? <IoMdCheckmarkCircle /> : <IoMdCloseCircleOutline />}
                    </div>
                ))}
                {cleanings?.length === 0 && (
                    <span style={{ textAlign: 'center' }}>Your robot have not worked yet, make it sweat!</span>
                )}
            </div>

            <Drawer
                open={drawerOpen}
                handle={false}
                onOpenChange={setDrawerOpen}
                openHeightPercent={70}
                title={selectedCleaning && new Date(selectedCleaning.timing.start).toLocaleString()}
            >

                <>

                    <div className={styles.basicInfos}>
                        <div className={styles.basicInfo}>
                            <span>&nbsp;</span>
                            <span>{selectedCleaning && selectedCleaning.cleaning_complete ? <IoMdCheckmarkCircle /> : <IoMdCloseCircleOutline />} &nbsp;</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>Duration</span>
                            <span>{selectedCleaning && formatDuration(selectedCleaning?.timing.start, selectedCleaning?.timing.end)} &nbsp;</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>Area</span>
                            <span>{selectedCleaning && calcTotalArea(selectedCleaning)} m2</span>
                        </div>
                        <div className={styles.basicInfo}>
                            <span>Battery</span>
                            <span>{selectedCleaning?.battery_consumed} %</span>
                        </div>
                    </div>


                    <hr style={{ width: '100%' }} />

                    <Map mapId={selectedCleaning?.floorplan || ''} runId={selectedCleaning?.floorplan || ''} />

                    &lt; info about colors etc &gt;

                    <hr style={{ width: '100%' }} />
                    

                    <div className={styles.runs}>
                        {selectedCleaning && selectedCleaning.runs.map((run, i) =>

                            <div key={i} className={styles.run}>
                                <div className={styles.info}>
                                    <span>{run.state} | {formatDuration(run.timing.start, run.timing.end)}</span>
                                    <span className={styles.type}>
                                        {formatArea(run.stats.area)}m² &nbsp; |
                                        &nbsp; {run.settings.mode} {run.settings.navigation_mode} |
                                        {run.autonomous_dock ? '' : ' not'} docked
                                    </span>
                                    <span className={styles.type}>
                                        {run.timing.error}s errored, {run.timing.pause}s paused, {run.timing.charging}s charging, {run.stats.pickup_count} times picked up
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
        return `${hours}h ${minutes}min ${seconds}sec`;
    }

    return `${minutes}min ${seconds}sec`;
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
