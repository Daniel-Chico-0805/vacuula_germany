import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './schedule.module.scss'
import mapData from '../../assets/map-test.json'
import Drawer from '../../components/drawer/drawer'

import type { GetSchedule, ScheduleEvent } from './types'
import { FaPlus, FaTimes, FaUndo, FaPen, FaCheckCircle, FaCircle, FaTrash } from 'react-icons/fa'
import Input from '../../components/input/input'
import { PiBoundingBox } from "react-icons/pi";
import { biEnum } from '../../types/.helpers'
import Button from '../../components/button/button'
import { CleaningMode, CleaningNavigationMode } from '../../types/neato/gen3/state'
import { Http } from '../../http'
import { useApp } from '../../context/useApp'
import { RobotDay } from '../../types/neato/gen3/api'
import type { UseState } from '../map/types'
import { GEN4_COMMANDS } from '../../http/gen4'
import { Neato } from '../../types'
import type { CommandEvent } from '../../types/neato/gen4'

// For now schduling will be only for cleaning.start for ONE run, later on scheduling can be more advanced

function getDayText(days: Neato.Gen4.Days[]) {
    const set = new Set(days);
    if (set.size === 7) return "everyday"
    if (set.size === 2 && set.has(Neato.Gen4.Days.SATURDAY) && set.has(Neato.Gen4.Days.SATURDAY)) return "on weekends"
    if (set.size === 5 && !set.has(Neato.Gen4.Days.SATURDAY) && !set.has(Neato.Gen4.Days.SATURDAY)) return "on weekdays"
    return days.join(', ')
}

export default () => {
    const [schedule, setSchedule] = useState<Neato.Gen4.ScheduledCommands>()
    const [drawerOpen, setDrawerOpen] = useState(false)

    const [scheduleFormNavigationMode, setScheduleFormNavigationMode] = useState<Neato.Gen4.CleaningNavigationMode>()
    const [scheduleFormCleaningMode, setScheduleCleaningMode] = useState<Neato.Gen4.CleaningMode>()

    // const [schduleRuns, setScheduleRuns] = useState<Neato.Gen4.Run[]>()
    const [scheduleForm, setScheduleForm] = useState<Omit<Neato.Gen4.CommandEvent, "command">>({
        enabled: true,
        days: [],
        time: '',
    })

    const { robot, persistentMaps } = useApp()

    const setFormFromEvent = (event: Neato.Gen4.CommandEvent) => {
        setScheduleForm(event);
        setScheduleFormNavigationMode(event.command.runs[0].settings.navigation_mode);
        setScheduleCleaningMode(event.command.runs[0].settings.mode);
        setDrawerOpen(true)
    }

    const openCleanForm = () => {
        setScheduleForm({
            enabled: true,
            days: [],
            time: ''
        });
        setScheduleFormNavigationMode(undefined);
        setScheduleCleaningMode(undefined);
        setDrawerOpen(true)
    }


    const getSchedule = () => {
        GEN4_COMMANDS.getSchedule(robot.serial).then(res => {
            setSchedule(res.data.body)
        })
    }

    useEffect(() => {
        if (!robot) return;
        getSchedule();
    }, [robot])

    const removeEvent = (id: string) => {
        if (!schedule) return;
        setDrawerOpen(false);
        GEN4_COMMANDS.deleteScheduledEvent(robot.serial, id).finally(() => getSchedule())
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
                {/* <div className={styles.item} style={{ background: '#45d57d22' }}>
                    <div className={styles.info}>
                        <span>Schedule</span>
                    </div>
                    <Input type="switch" skipSection={true} value={schedule.enabled} onChange={() => {
                        console.log('schedule', schedule)
                        let cmd = GEN4_COMMANDS.enableSchedule;
                        if (schedule.enabled) cmd = GEN4_COMMANDS.disableSchedule;
                        cmd(robot.serial).then(() => getSchedule());
                    }} />
                </div>

                <hr style={{ width: '90%' }} /> */}

                <div className={styles.item} style={{ justifyContent: 'center', textAlign: 'center', background: '#45d57d22' }} onClick={() => openCleanForm()}>
                    <div className={styles.info}>
                        <span>New schedule</span>
                        <span className={styles.type}>Add one more schedule</span>
                    </div>
                </div>

                {schedule.events?.map((item, i) => (
                    <div key={i} className={styles.item} onClick={() => setFormFromEvent(item)}>
                        <div className={styles.info}>
                            <span>{item.time}</span>
                            <span className={styles.type}>Runs {getDayText(item.days)} | {item.command.runs[0].settings.mode} mode | {item.command.runs[0].settings.navigation_mode} nav </span>
                        </div>
                        <Input type="switch" skipSection={true} value={item.enabled} onChange={() => {
                            item.enabled = !item.enabled;
                            GEN4_COMMANDS.updateOrAddSchduledEvent(robot.serial, item).then(() => getSchedule())
                        }} />
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
                        type="multi-select"
                        label="Day"
                        options={[
                            { value: Neato.Gen4.Days.MONDAY, label: "MONDAY" },
                            { value: Neato.Gen4.Days.TUESDAY, label: "TUESDAY" },
                            { value: Neato.Gen4.Days.WEDNESDAY, label: "WEDNESDAY" },
                            { value: Neato.Gen4.Days.THURSDAY, label: "THURSDAY" },
                            { value: Neato.Gen4.Days.FRIDAY, label: "FRIDAY" },
                            { value: Neato.Gen4.Days.SATURDAY, label: "SATURDAY" },
                            { value: Neato.Gen4.Days.SUNDAY, label: "SUNDAY" },
                        ]}
                        value={scheduleForm.days}
                        onChange={(days) => updateForm(setScheduleForm, { days })}
                    />

                    <Input
                        type="select"
                        label="Mode"
                        options={[
                            { value: Neato.Gen4.CleaningMode.AUTO, label: "AUTO" },
                            { value: Neato.Gen4.CleaningMode.ECO, label: "ECO" },
                            { value: Neato.Gen4.CleaningMode.MAX, label: "MAX" },
                            { value: Neato.Gen4.CleaningMode.TURBO, label: "TURBO" },
                        ]}
                        value={scheduleFormCleaningMode}
                        onChange={(mode) => setScheduleCleaningMode(mode)}
                    />

                    <Input
                        type="select"
                        label="Navigation"
                        options={[
                            { value: Neato.Gen4.CleaningNavigationMode.NORMAL, label: "NORMAL" },
                            { value: Neato.Gen4.CleaningNavigationMode.GENTLE, label: "GENTLE" },
                        ]}
                        value={scheduleFormNavigationMode}
                        onChange={(mode) => setScheduleFormNavigationMode(mode)}
                    />

                    <Input
                        type="text"
                        label="Time"
                        value={scheduleForm.time}
                        onChange={(time) => updateForm(setScheduleForm, { time })} />

                    {/* <Input
                        type="text"
                        label="boundaryId"
                        value={scheduleForm.boundaryId}
                        onChange={(boundaryId) => updateForm(SetScheduleForm, { boundaryId })} /> */}

                    <Button text="Save" style='success' onClick={() => {
                        if (!scheduleFormNavigationMode || !scheduleFormCleaningMode) return;

                        GEN4_COMMANDS.updateOrAddSchduledEvent(robot.serial, {
                            ...scheduleForm,
                            command: {
                                ability: "cleaning.start",
                                auto_localization: false, // unused
                                force_floorplan: false,
                                runs: [{
                                    settings: {
                                        navigation_mode: scheduleFormNavigationMode,
                                        mode: scheduleFormCleaningMode,
                                    },
                                    map: {
                                        rank_id: null as any,
                                        track_id: null,
                                        nogo_enabled: true
                                    }
                                }]
                            }
                        }).finally(() => getSchedule())
                    }} />

                    {scheduleForm.id && (
                        <Button text="Delete" style='fail' onClick={() => removeEvent(scheduleForm.id!)} /> // Allowed here because check on row above
                    )}
                </div>

            </Drawer>

        </div>
    )
}
