import styles from './map.module.scss'
import { useMap } from './useMap'
import { useApp } from '../../context/useApp'

interface MapProps {
    mapId: string
    runId?: string
}

export default function Map({ mapId, runId }: MapProps) {
    const { robot } = useApp()

    const { canvasRef, isDragging, canvasHandlers } = useMap({
        serial: robot.serial,
        mapId,
        runId
    })

    return (
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
    )
}