import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './schedule.module.scss'
import Drawer from '../../components/drawer/drawer'

import type { GetSchedule, ScheduleEvent } from './types'
import { FaPlus, FaTimes, FaUndo, FaPen, FaCheckCircle, FaCircle, FaTrash } from 'react-icons/fa'
import Input from '../../components/input/input'
import { PiBoundingBox } from "react-icons/pi";
import { biEnum } from '../../types/.helpers'
import Button from '../../components/button/button'
import { GEN3_COMMANDS } from '../../http/gen3'
import { CleaningMode, CleaningNavigationMode } from '../../types/neato/gen3/state'
import { Http } from '../../http'
import { useApp } from '../../context/useApp'
import { RobotDay } from '../../types/neato/gen3/api'
import type { UseState } from '../map/types'
import { GEN4_COMMANDS } from '../../http/gen4'
import { RobotType } from '../../types'
import Scheudle_gen4 from './scheudle_gen4'

export default () => {

    const { robot, persistentMaps } = useApp()

    if (robot?.type === RobotType.NeatoGen4) return <Scheudle_gen4 />


    const [schedule, setSchedule] = useState<GetSchedule>()
    const [drawerOpen, setDrawerOpen] = useState(false)


    const [scheduleForm, SetScheduleForm] = useState<ScheduleEvent>({
        startTime: '',
        day: -1,
        mode: 0
    })

    const getSchedule = () => {
        GEN3_COMMANDS.getSchedule(robot.serial).then(res => {
            setSchedule(res.data.data)
        })

        GEN4_COMMANDS.getSchedule(robot.serial);
    }

    useEffect(() => {
        if (!robot) return;
        getSchedule();
    }, [robot])

    const removeEvent = (index: number) => {
        if (!schedule) return;
        schedule.events.splice(index, 1)
        GEN3_COMMANDS.setSchedule(robot.serial, schedule.events).finally(() => getSchedule())
    }

    const updateForm = <T extends object>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({
            ...prev,
            ...patch
        }))
    }

    if (!schedule) return

    return (
        <div className={styles.container}>

            <div className={styles.featureList}>
                <div className={styles.item} style={{ background: '#45d57d22' }}>
                    <div className={styles.info}>
                        <span>Schedule</span>
                    </div>
                    <Input type="switch" skipSection={true} value={schedule.enabled} onChange={() => {
                        console.log('schedule', schedule)
                        let cmd = GEN3_COMMANDS.enableSchedule;
                        if (schedule.enabled) cmd = GEN3_COMMANDS.disableSchedule;
                        cmd(robot.serial).then(() => getSchedule());
                    }} />
                </div>

                <hr style={{ width: '90%' }} />

                <div className={styles.item} style={{ justifyContent: 'center', textAlign: 'center', background: '#45d57d22' }} onClick={() => setDrawerOpen(true)}>
                    <div className={styles.info}>
                        <span>New schedule</span>
                        <span className={styles.type}>Add one more schedule</span>
                    </div>
                </div>

                {schedule.events?.map((item, i) => (
                    <div key={i} className={styles.item} onClick={() => alert(item)}>
                        <div className={styles.info}>
                            <span>{item.startTime}</span>
                            <span className={styles.type}>Runs on: {RobotDay[item.day]} | Mode: {CleaningMode[item.mode]}</span>
                        </div>
                        <FaTrash onClick={() => removeEvent(i)} />
                    </div>
                ))}
                {persistentMaps?.length === 0 && (
                    <span style={{ textAlign: 'center' }}>You don't have any schedules yet, why not add one?</span>
                )}
            </div>
            <Drawer
                open={drawerOpen}
                handle={false}
                onOpenChange={setDrawerOpen}
                openHeightPercent={70}
                title={'Add event'}
            >

                <div>
                    <Input
                        type="select"
                        label="Day"
                        options={[
                            { value: RobotDay.MONDAY, label: "MONDAY" },
                            { value: RobotDay.TUESDAY, label: "TUESDAY" },
                            { value: RobotDay.WEDNESDAY, label: "WEDNESDAY" },
                            { value: RobotDay.THURSDAY, label: "THURSDAY" },
                            { value: RobotDay.FRIDAY, label: "FRIDAY" },
                            { value: RobotDay.SATURDAY, label: "SATURDAY" },
                            { value: RobotDay.SUNDAY, label: "SUNDAY" },
                        ]}
                        value={scheduleForm.day}
                        onChange={(day) => updateForm(SetScheduleForm, { day })}
                    />

                    <Input
                        type="select"
                        label="Mode"
                        options={[
                            { value: CleaningMode.ECO, label: "Eco" },
                            { value: CleaningMode.NORMAL, label: "NORMAL" },
                        ]}
                        value={scheduleForm.mode}
                        onChange={(mode) => updateForm(SetScheduleForm, { mode })}
                    />

                    <Input
                        type="text"
                        label="Time"
                        value={scheduleForm.startTime}
                        onChange={(startTime) => updateForm(SetScheduleForm, { startTime })} />

                    <Input
                        type="text"
                        label="boundaryId"
                        value={scheduleForm.boundaryId}
                        onChange={(boundaryId) => updateForm(SetScheduleForm, { boundaryId })} />

                    <Button text="Save" style='success' onClick={() => {
                        setDrawerOpen(false)
                        GEN3_COMMANDS.setSchedule(robot.serial, [scheduleForm, ...schedule.events]).finally(() => getSchedule())
                    }} />
                </div>

            </Drawer>

        </div>
    )
}
