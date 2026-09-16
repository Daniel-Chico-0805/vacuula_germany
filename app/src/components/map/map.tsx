import styles from './map.module.scss'
import { useMap } from './useMap'
import { useApp } from '../../context/useApp'
import { useRobot } from '../../context/useRobot'
import { RobotType } from '../../types'
import Button from '../button/button'
import { Http } from '../../http'
import { usePersistentMap } from '../../loaders/resources'

interface MapProps {
    mapId: string
    runId?: string
}

export default function Map({ mapId, runId }: MapProps) {
    const { robot } = useRobot()
    const { data: persistantMapData, refresh: refreshPersistantMapData } = usePersistentMap(mapId);


    const { canvasRef, isDragging, canvasHandlers } = useMap({
        serial: robot.serial,
        mapId,
        runId
    })

    return (
        <>
            <div className={styles.container}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    {...canvasHandlers}
                    style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        touchAction: 'none'
                    }}
                />

            </div>
            {robot.type === RobotType.NeatoGen4 && !persistantMapData?.in_maps_list && (
                <div style={{ padding: '1.5rem' }}>
                    <Button text='Use as floormap' style='success' onClick={() => { Http.postUseMapAsFloorPlan(robot.serial, mapId).then(refreshPersistantMapData) }} />
                </div>
            )}
        </>
    )
}