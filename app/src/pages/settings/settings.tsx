import styles from './settings.module.scss'
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
import { Neato } from '../../types'
import { IoMdTime, IoMdCheckmarkCircle, IoMdCloseCircleOutline } from "react-icons/io";
import { SlEnergy } from "react-icons/sl";
import Map from '../../components/map/map'
import { GEN4_COMMANDS } from '../../http/gen4'

export default () => {
    const { robot, persistentMaps } = useApp()


    return (
        <div className={styles.container}>

            <Gen4RobotSettings />

            {/* <div className={styles.featureList} style={{ overflow: drawerOpen ? 'hidden' : 'auto' }}>
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
            </div> */}
        </div>

    )
}



const Gen4RobotSettings = () => {
    const { robot } = useApp()

    const [cleaningOptions, setCleaningOptions] = useState<Neato.Gen4.SettingsCleaningOptions>()
    const [robotLanguage, setRobotLanguage] = useState<Neato.Gen4.SettingsRobotLanguage>()

    useEffect(() => {
        getCleaningOptions();
        getRobotLanguage();
    }, []);

    const getCleaningOptions = () => GEN4_COMMANDS.getSettings(robot.serial, { operation: Neato.Gen4.SettingsCleaningOptionsOperation.GET }).then(d => setCleaningOptions(d.data.body))
    const getRobotLanguage = () => GEN4_COMMANDS.getSettings(robot.serial, { operation: Neato.Gen4.SettingsRobotLanguageOperation.GET }).then(d => setRobotLanguage(d.data.body))

    const settingsDataBinders = {
        [Neato.Gen4.SettingsCleaningOptionsOperation.SET]: {
            useStateUpdater: setCleaningOptions,
            dataFetcher: getCleaningOptions
        },
        [Neato.Gen4.SettingsRobotLanguageOperation.SET]: {
            useStateUpdater: setRobotLanguage,
            dataFetcher: getRobotLanguage
        }
    }

    const setSettings = <Op extends Neato.Gen4.SettingsSetOperation>(operation: Op, update: Neato.Gen4.SettingsMap[Op]) => {
        const b = settingsDataBinders[operation]
        b.useStateUpdater(update as any) // TODO: Find out how to type this
        GEN4_COMMANDS.setSettings(robot.serial, { operation: operation, values: update }).finally(b.dataFetcher)
    }

    if (!robot || !cleaningOptions || !robotLanguage) return; // TODO: loading UI

    return (
        <div className={styles.boundaryDetails}>
            Robot settings
            <div className={styles.featureList}>
                <div className={styles.item} style={{ background: '#45d57d22' }}>
                    <div className={styles.info}>
                        <span>Force floorplan</span>
                    </div>
                    <Input type="switch" skipSection={true} value={cleaningOptions.force_floorplan} onChange={(value) => {
                        setSettings(Neato.Gen4.SettingsCleaningOptionsOperation.SET, { ...cleaningOptions, force_floorplan: value })
                    }} />
                </div>

                <Input
                    type="select"
                    label="Language"
                    options={robotLanguage.available_languages.map(lang => ({ value: lang, label: lang }))}
                    value={robotLanguage.language}
                    onChange={(language) => setSettings(Neato.Gen4.SettingsRobotLanguageOperation.SET, { ...robotLanguage, language })}
                />
            </div>
        </div>
    )
}


