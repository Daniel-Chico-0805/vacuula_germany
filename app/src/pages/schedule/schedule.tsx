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
import { Http, type ServerInfo } from '../../http'
import { useRobot } from '../../context/useRobot'
import { RobotDay } from '../../types/neato/gen3/api'
import type { UseState } from '../map/types'
import { GEN4_COMMANDS } from '../../http/gen4'
import { RobotType } from '../../types'
import Scheudle_gen4 from './scheudle_gen4'
import { useTranslation } from 'react-i18next'
import { dayKey } from '../../i18n/days'
import { formatUtcOffset, localSlotToUtc, utcSlotToLocal, type Weekday } from '../../utils/clockTime'

export default () => {
    const { t } = useTranslation()

    const { robot, persistentMaps } = useRobot()

    if (robot?.type === RobotType.NeatoGen4) return <Scheudle_gen4 />


    const [schedule, setSchedule] = useState<GetSchedule>()
    const [drawerOpen, setDrawerOpen] = useState(false)

    // Gen3 robots keep their clock in UTC; times are shown/entered in the
    // server's local time using its current UTC offset (GET /api/server).
    const [serverInfo, setServerInfo] = useState<ServerInfo>()
    const offset = serverInfo?.utc_offset_minutes ?? 0


    const [scheduleForm, SetScheduleForm] = useState<ScheduleEvent>({
        startTime: '',
        day: -1,
        mode: 0
    })

    const getSchedule = () => {
        GEN3_COMMANDS.getSchedule(robot.serial).then(res => {
            setSchedule(res.data.data)
        })

        // GEN4_COMMANDS.getSchedule(robot.serial);
    }

    useEffect(() => {
        Http.getServerInfo().then(res => setServerInfo(res.data)).catch(() => setServerInfo(undefined))
    }, [])

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

    /** Robot (UTC) event -> server-local time and weekday for display. */
    const toLocal = (ev: ScheduleEvent) =>
        utcSlotToLocal({ time: ev.startTime, day: ev.day as Weekday }, offset)

    /** Form (server-local) -> UTC as the robot stores it. */
    const toRobot = (ev: ScheduleEvent): ScheduleEvent => {
        const utc = localSlotToUtc({ time: ev.startTime, day: ev.day as Weekday }, offset)
        return { ...ev, startTime: utc.time, day: utc.day as RobotDay }
    }

    if (!schedule) return

    return (
        <div className={styles.container}>

            <div className={styles.featureList}>
                <div className={`${styles.item} ${styles.staticItem}`}>
                    <div className={styles.info}>
                        <span>{t('schedule.schedule')}</span>
                        {serverInfo && (
                            <span className={styles.type}>{serverInfo.timezone} ({formatUtcOffset(offset)})</span>
                        )}
                    </div>
                    <Input type="switch" skipSection={true} value={schedule.enabled} onChange={() => {
                        console.log('schedule', schedule)
                        let cmd = GEN3_COMMANDS.enableSchedule;
                        if (schedule.enabled) cmd = GEN3_COMMANDS.disableSchedule;
                        cmd(robot.serial).then(() => getSchedule());
                    }} />
                </div>

                <hr style={{ width: '90%' }} />

                <div className={`${styles.item} ${styles.actionItem}`} onClick={() => setDrawerOpen(true)}>
                    <div className={styles.info}>
                        <span>{t('schedule.newSchedule')}</span>
                        <span className={styles.type}>{t('schedule.addOneMore')}</span>
                    </div>
                </div>

                {schedule.events?.map((item, i) => {
                    const local = toLocal(item)
                    return (
                        <div key={i} className={styles.item} onClick={() => alert(item)}>
                            <div className={styles.info}>
                                <span>{local.time}</span>
                                <span className={styles.type}>{t('schedule.gen3Summary', { day: t(`days.${dayKey(local.day)}`), mode: CleaningMode[item.mode] })}</span>
                            </div>
                            <FaTrash onClick={() => removeEvent(i)} />
                        </div>
                    )
                })}
                {persistentMaps?.length === 0 && (
                    <span style={{ textAlign: 'center' }}>{t('schedule.noSchedules')}</span>
                )}
            </div>
            <Drawer
                open={drawerOpen}
                handle={false}
                onOpenChange={setDrawerOpen}
                openHeightPercent={70}
                title={t('schedule.addEvent')}
            >

                <div>
                    <Input
                        type="select"
                        label={t('common.day')}
                        options={[
                            { value: RobotDay.MONDAY, label: t('days.monday') },
                            { value: RobotDay.TUESDAY, label: t('days.tuesday') },
                            { value: RobotDay.WEDNESDAY, label: t('days.wednesday') },
                            { value: RobotDay.THURSDAY, label: t('days.thursday') },
                            { value: RobotDay.FRIDAY, label: t('days.friday') },
                            { value: RobotDay.SATURDAY, label: t('days.saturday') },
                            { value: RobotDay.SUNDAY, label: t('days.sunday') },
                        ]}
                        value={scheduleForm.day}
                        onChange={(day) => updateForm(SetScheduleForm, { day })}
                    />

                    <Input
                        type="select"
                        label={t('common.mode')}
                        options={[
                            { value: CleaningMode.ECO, label: t('modes.eco') },
                            { value: CleaningMode.NORMAL, label: t('modes.normal') },
                        ]}
                        value={scheduleForm.mode}
                        onChange={(mode) => updateForm(SetScheduleForm, { mode })}
                    />

                    <Input
                        type="text"
                        label={`${t('common.time')} (${serverInfo?.timezone ?? 'UTC'})`}
                        value={scheduleForm.startTime}
                        onChange={(startTime) => updateForm(SetScheduleForm, { startTime })} />

                    <Input
                        type="text"
                        label={t('schedule.boundaryId')}
                        value={scheduleForm.boundaryId}
                        onChange={(boundaryId) => updateForm(SetScheduleForm, { boundaryId })} />

                    <Button text={t('common.save')} style='success' onClick={() => {
                        setDrawerOpen(false)
                        GEN3_COMMANDS.setSchedule(robot.serial, [toRobot(scheduleForm), ...schedule.events]).finally(() => getSchedule())
                    }} />
                </div>

            </Drawer>

        </div>
    )
}
