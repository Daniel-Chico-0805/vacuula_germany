import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './map.module.scss'
import Drawer from '../../components/drawer/drawer'

import { DRAWING } from './constants'
import type { NoGoLine, Zone, Point, SetZone, UseState } from './types'
// import { decodeRLE, getTouchDistance, getTouchAngle, getCrosshairWorldCoords, getWorldCoords, calcRelevancy, upsertPreserveOrder } from './utils'
import { FaPlus, FaTimes, FaUndo, FaPen, FaCheckCircle, FaCircle } from 'react-icons/fa'
import Input from '../../components/input/input'
import { PiBoundingBox } from "react-icons/pi";
import { biEnum } from '../../types/.helpers'
import Button from '../../components/button/button'
import { GEN3_COMMANDS } from '../../http/gen3'
import { CleaningMode, CleaningNavigationMode } from '../../types/neato/gen3/state'
import { Http } from '../../http'
import { useApp } from '../../context/useApp'
import { useCanvasViewport } from './useCanvasViewport'
import { RobotType } from '../../types'

import { useMap } from '../../components/map/useMap'
import { drawZones, drawNoGoLines, drawInProgressPolyline, drawCrosshair, drawBase } from './drawingFunctions'
import { getCrosshairWorldCoords, upsertPreserveOrder } from './utils'
import { GEN4_COMMANDS } from '../../http/gen4'


export default () => {
    const [boundaries, setBoundaries] = useState<(NoGoLine | Zone)[]>([])
    const [drawerOpen, setDrawerOpen] = useState(true)

    const [editForm, setEditForm] = useState({
        startTime: '',
        color: ''
    });

    const [mapEditform, setMapEditForm] = useState({
        startTime: '',
        enabled: true
    })
    const [showCloseAsPolygon, setShowCloseAsPolygon] = useState(false)
    const [currentLinePoints, setCurrentLinePoints] = useState<Point[]>([])
    const [closedAsPolygon, setClosedAsPolygon] = useState(false)
    const [persistentMap, setPersistentMap] = useState<string>()

    const [mode, setMode] = useState<'maps' | 'map-edit' | 'boundaries' | 'boundary-info' | 'boundary-edit'>('maps')
    const [returnFromEditMode, SetReturnFromEditMode] = useState<'boundaries' | 'boundary-info'>('boundaries')
    const [activeBoundaryId, setActiveBoundaryId] = useState<string | undefined>(undefined);

    const { robot, persistentMaps, setPersistentMaps } = useApp()

    const skipNextPostRef = useRef(false)

    if (persistentMap) console.log(Http.test.bind(this, robot.serial, persistentMap))


    const extraDraw = useCallback((ctx, canvas, currentZoom, currentOffset, mapSize) => {
        const showBoundaries = mode === 'boundary-edit'
            ? boundaries.filter(b => b.id !== activeBoundaryId)
            : boundaries

        drawZones(ctx, showBoundaries.filter(b => b.type === 'polygon'), currentZoom, currentOffset, mapSize)
        drawNoGoLines(ctx, showBoundaries.filter(b => b.type === 'polyline'), currentZoom, currentOffset, mapSize)

        const map = persistentMaps?.find(p => p.id === persistentMap)
        const basicdata = map?.base
        const NO_BASE = 2147483647
        if (basicdata && basicdata[0] !== NO_BASE && basicdata[1] !== NO_BASE) {
            const [originX, originY] = map.origin
            const resolution = map.resolution
            const [imgW, imgH] = map.imgsize
            const normX = ((basicdata[0] - originX) / resolution) / imgW
            const normY = ((basicdata[1] - originY) / resolution) / imgH
            drawBase(ctx, { x: normX, y: normY, width: 4 / imgW, height: 4 / imgH }, currentZoom, currentOffset, mapSize)
        }

        if (mode === 'boundary-edit') {
            drawCrosshair(ctx, canvas)
            if (closedAsPolygon) {
                drawZones(ctx, [{ vertices: currentLinePoints, name: '', color: editForm.color, type: 'polygon', id: '', enabled: true }], currentZoom, currentOffset, mapSize)
            } else {
                drawInProgressPolyline(ctx, currentLinePoints, currentZoom, currentOffset, mapSize)
            }
        }
    }, [boundaries, activeBoundaryId, mode, currentLinePoints, closedAsPolygon, editForm.color, persistentMaps, persistentMap])

    const { canvasRef, mapSize, zoom, offset, isDragging, hasMoved, canvasHandlers } = useMap({
        serial: robot.serial,
        mapId: persistentMap,
        extraDraw,
        redrawKey: extraDraw // any change to the deps above re-triggers a draw
    })

    const addPointAtCrosshair = () => {
        const coords = getCrosshairWorldCoords(canvasRef, offset, zoom, mapSize)
        setCurrentLinePoints(prev => [...prev, coords])
    }

    // Fetch boundaries when persistentMap changes — unchanged from your current code,
    // just drop the old cellsRef/setMapSize/centerView/draw calls since useMap now owns that:
    useEffect(() => {
        if (!persistentMap) return
        skipNextPostRef.current = true
        if (robot.type === RobotType.NeatoGen4) {
            Http.getBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data.boundaries))
        } else {
            GEN3_COMMANDS.getMapBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data.data.boundaries))
        }
        setMode('boundaries')
    }, [persistentMap])

    // ...postBoundaries effect on [boundaries] unchanged...

    // onTouchMove/onTouchEnd wrap canvasHandlers instead of the old handleTouchMove/handleTouchEnd directly:
    const onTouchMove = (e: React.TouchEvent) => {
        canvasHandlers.onTouchMove(e)
        if (currentLinePoints.length > 1 && mapSize) {
            const coords = getCrosshairWorldCoords(canvasRef, offset, zoom, mapSize)
            const [fx, fy] = currentLinePoints[0]
            const distance = Math.sqrt((coords[0] - fx) ** 2 + (coords[1] - fy) ** 2)
            setShowCloseAsPolygon(distance < DRAWING.CLOSE_THRESHOLD)
        }
    }

    const onTouchEnd = () => {
        canvasHandlers.onTouchEnd()
        if (mode === 'boundary-edit' && !hasMoved) addPointAtCrosshair()
    }


    const getPersistentMaps = () => {
        Http.getPersistentMaps(robot.serial).then(res => {
            setPersistentMaps(res.data)
            // setPersistentMaps([])
        })
    }

    const updatePersistentMap = (data: { name: string, enabled: boolean }, mapToChange?: string) => {
        const map = mapToChange || persistentMap;
        if (!map) return; // If this happens, we have done something bad in the code
        Http.updatePersistentMap(robot.serial, map, data).finally(() => {
            getPersistentMaps();
            if (persistentMap) setMode('boundaries')
        })
    }

    useEffect(() => {
        if (!robot) return;
        getPersistentMaps();
    }, [robot])

    useEffect(() => {
        if (!persistentMap) return;


        if (skipNextPostRef.current) {
            skipNextPostRef.current = false
            return
        }



        console.log(boundaries);
        Http.postBoundaries(robot.serial, persistentMap, boundaries);


        // GEN3 code, dont delete yet!!!
        // const updatedBoundaries = boundaries.map(boundary =>
        //     boundary.type === 'polygon'
        //         ? {
        //             ...boundary,
        //             relevancy: calcRelevancy(boundary.vertices)
        //         }
        //         : boundary
        // );
        // GEN3_COMMANDS.setMapBoundaries(robot.serial, persistentMap, updatedBoundaries).catch((err) => {
        //     console.log(err.response?.data)
        //     getMapBoundaries();
        // });
    }, [boundaries]);

    const undo = () => {
        // If we have closed as polygon, undo the close
        if (closedAsPolygon) {
            setClosedAsPolygon(false)
            return;
        }

        // If we are not as a polygon (zone), just remove the last point
        if (currentLinePoints.length > 0) {
            setCurrentLinePoints(currentLinePoints.slice(0, -1))
        }
    }

    const closeAsPolyon = () => {
        setClosedAsPolygon(true)
        setDrawerOpen(true)
    }

    // mode changes
    useEffect(() => {
        if (mode === 'boundaries') setActiveBoundaryId(undefined)
        if (mode === 'map-edit') {
            const pmap = persistentMaps?.find(p => p.id === persistentMap)
            if (!pmap) return;
            setMapEditForm({
                startTime: pmap.name,
                enabled: pmap.enabled
            })
        }
        if (mode !== 'boundary-edit') {
            setCurrentLinePoints([])
            setClosedAsPolygon(false)
            // setDrawerOpen(false)
            return
        }
        const existingBoundary = boundaries.find(b => b.id === activeBoundaryId);
        // edit enable
        setEditForm({
            startTime: existingBoundary?.name ?? '',
            color: existingBoundary?.color ?? `#${Math.floor(Math.random() * 16777215).toString(16)}`
        });
        setCurrentLinePoints(existingBoundary?.vertices || [])
        setClosedAsPolygon(existingBoundary?.type === 'polygon')
    }, [mode])

    const saveEditBoundary = () => {
        setMode(returnFromEditMode);

        const id = activeBoundaryId ?? Date.now().toString();

        const updated = {
            id,
            name: editForm.name,
            color: editForm.color,
            type: closedAsPolygon ? 'polygon' as const : 'polyline' as const,
            vertices: currentLinePoints,
            enabled: true
        };

        setBoundaries(prev => upsertPreserveOrder(prev, updated));
    };

    const updateForm = <T extends object>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({
            ...prev,
            ...patch
        }))
    }

    const toggleNoGoLine = (item: NoGoLine) => {
        setBoundaries(prev => upsertPreserveOrder(prev, {
            ...item,
            enabled: !item.enabled
        }));
    };

    const deleteBoundary = (id: string) => {
        setBoundaries(prev =>
            prev.filter(boundary => boundary.id !== id)
        );
        setMode('boundaries')
    };

    const openInfo = (id: string) => {
        setMode('boundary-info')
        setActiveBoundaryId(id)
    }

    const openEdit = (id: string) => {
        if (mode !== 'boundaries' && mode !== 'boundary-info') return;
        SetReturnFromEditMode(mode)
        setMode('boundary-edit')
        setActiveBoundaryId(id)
    }

    const handleBackBtn = () => {
        if (mode === 'boundaries') {
            setPersistentMap(undefined);
            setMode('maps')
        } else if (mode === 'map-edit' || mode === 'boundary-info') {
            setMode('boundaries')
        }
    }

    const getTitle = () => {
        switch (mode) {
            case 'maps': return "Maps"
            case 'boundaries':
            case 'map-edit':
                return "Map: " + persistentMaps?.find(p => p.id === persistentMap)?.name
            case 'boundary-info': return ' '
            case 'boundary-edit':
                if (!drawerOpen) return 'Drag up to finish'
                return 'Edit boundary'
        }
    }

    return (
        <div className={styles.container}>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={canvasHandlers.onMouseDown}
                onMouseMove={canvasHandlers.onMouseMove}
                onMouseUp={canvasHandlers.onMouseUp}
                onMouseLeave={canvasHandlers.onMouseLeave}
                onWheel={canvasHandlers.onWheel}
                onTouchStart={canvasHandlers.onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    cursor: mode === 'boundary-edit' ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none'
                }}
            />

            {mode === 'maps' && (
                <div className={styles.selectMap}>
                    <span>Select a map</span>
                </div>
            )}

            {mode === 'boundary-edit' && (
                <div className={styles.actionButtons}>
                    <div onClick={undo} className={styles.undo}>
                        <FaUndo size={20} color="#fff" />
                    </div>
                    <div onClick={addPointAtCrosshair} className={`${styles.add} ${closedAsPolygon ? styles.disabled : ''}`}>
                        <FaPlus size={40} color="#fff" />
                    </div>
                    <div onClick={closeAsPolyon} className={`${styles.closePolygon} ${(showCloseAsPolygon && !closedAsPolygon) ? '' : styles.disabled}`}>
                        <PiBoundingBox size={20} color="#fff" />
                    </div>
                </div>
            )}

            <Drawer
                open={drawerOpen}
                handle={true}
                showBackButton={['map-edit', 'boundaries', 'boundary-info'].includes(mode)}
                onBackButtonClick={handleBackBtn}
                onOpenChange={setDrawerOpen}
                openHeightPercent={mode === 'boundary-edit' ? 60 : mode === 'boundary-info' ? 30 : 70}
                title={getTitle()}
            >
                {mode === 'maps' && (
                    <div className={styles.featureList}>
                        {persistentMaps?.map((item, i) => (
                            <div key={i} className={styles.item} onClick={() => setPersistentMap(item.id)}>
                                <div className={styles.info}>
                                    <span>{item.name}</span>
                                    <span className={styles.type}>{new Date(robot.type === RobotType.NeatoGen4 ? item.created_at : item.id).toLocaleString()}</span>
                                </div>
                                {'enabled' in item ? (
                                    <Input type="switch" skipSection={true} value={item.enabled} onChange={() => {
                                        updatePersistentMap({ name: item.name, enabled: !item.enabled }, item.id);
                                    }} />
                                ) : (
                                    <Button text={item.promoted ? 'Demote' : 'Promote'} onClick={() => {
                                        if (robot.type === RobotType.NeatoGen4) {
                                            if (item.promoted) Http.demoteFloorplan(robot.serial, item.id).finally(() => getPersistentMaps())
                                            else Http.test(robot.serial, item.id).finally(() => getPersistentMaps());
                                            // Http.test(robot.serial, item.id);
                                        }
                                    }} style={item.promoted ? 'fail' : 'success'} />
                                )}
                            </div>
                        ))}
                        {persistentMaps?.length === 0 && (
                            <span style={{ textAlign: 'center' }}>You don't have any explored maps yet, start an exploration to draw boundaries!</span>
                        )}
                        <hr style={{ width: '90%' }} />
                        <div className={styles.item} style={{ justifyContent: 'center', textAlign: 'center', background: '#45d57d22' }} onClick={() => GEN3_COMMANDS.startPersistentMapExploration(robot.serial)}>
                            <div className={styles.info}>
                                <span>New map</span>
                                <span className={styles.type}>Explore new map</span>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'map-edit' && mapEditform && (
                    <div>
                        <Input
                            type="text"
                            label="Name"
                            value={mapEditform.name}
                            onChange={(name) => updateForm(setMapEditForm, { name })} />
                        <Input type="switch" label='Enabled' value={mapEditform.enabled} onChange={(enabled) => updateForm(setMapEditForm, { enabled })} />
                        <Button text="Save" style='success' onClick={() => {
                            updatePersistentMap(mapEditform);
                        }} />
                    </div>
                )}

                {mode === 'boundary-edit' && (
                    <EditBoundaryDetails
                        currentLinePoints={currentLinePoints}
                        closedAsPolygon={closedAsPolygon}
                        setDrawerOpen={setDrawerOpen}
                        save={saveEditBoundary}
                        name={editForm.name}
                        color={editForm.color}
                        setName={(name) => updateForm(setEditForm, { name })}
                        setColor={(color) => updateForm(setEditForm, { color })}
                        cancel={() => {
                            setMode(returnFromEditMode)
                        }}
                    />
                )}

                {mode === 'boundary-info' && activeBoundaryId && (
                    <BoundaryDetails
                        boundary={boundaries.find(b => b.id === activeBoundaryId)!}
                        deleteBoundary={deleteBoundary}
                        editBoundary={() => {
                            setMode('boundary-edit');
                            SetReturnFromEditMode(mode)
                        }}
                    />
                )}

                {mode === 'boundaries' && (
                    <div>


                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                            <span>{persistentMaps?.find(p => p.id === persistentMap)?.enabled ? 'Enabled' : 'Disabled'}</span>
                            <Button text="Edit map details" style='primary' onClick={() => {
                                // setEditBoundaryId(Date.now().toString())
                                setMode('map-edit');
                                // openEdit(Date.now().toString())
                                // setReturnMode(mode)
                            }} />
                        </div>
                        <hr />
                        <div className={styles.buttonContainer}>
                            <Button text="Add feature" style='primary' onClick={() => {
                                // setEditBoundaryId(Date.now().toString())
                                // setMode('edit');
                                openEdit(Date.now().toString())
                                // setReturnMode(mode)
                            }} />
                        </div>

                        <div className={styles.featureList}>
                            {boundaries.map((item, i) => (
                                <div key={i} className={styles.item} style={{ background: `${item.color || 'red'}22` }} onClick={() => openInfo(item.id)}>
                                    <div className={styles.info}>
                                        <span>{item.name}</span>
                                        <span className={styles.type} style={{ color: item.color }}>{item.type === 'polygon' ? 'Zone' : 'No-Go Line'}</span>
                                    </div>
                                    {item.type === 'polyline' && (<Input type="switch" skipSection={true} value={item.enabled} onChange={() => toggleNoGoLine(item)} />)}
                                    {item.type === 'polygon' && (<Button style='primary' text='Clean zone' onClick={() => {
                                        GEN3_COMMANDS.startCleaningZone('GPC23118-40bd32d13ac7', item.id, CleaningMode.ECO, CleaningNavigationMode.EXTRA_CARE)
                                    }} />)}
                                </div>
                            ))}
                        </div>

                    </div>
                )}

            </Drawer>

        </div>
    )
}

interface BoundaryDetailsProps {
    boundary: NoGoLine | Zone
    editBoundary: (id: string) => void
    deleteBoundary: (id: string) => void
}

const BoundaryDetails = (props: BoundaryDetailsProps) => {
    return (
        <div className={styles.boundaryDetails}>
            <div className={styles.featureList}>
                <div className={styles.item} style={{ background: `${props.boundary.color || 'red'}22` }}>
                    <div className={styles.info}>
                        <span>{props.boundary.name}</span>
                        <span className={styles.type} style={{ color: props.boundary.color }}>{props.boundary.type === 'polygon' ? 'Zone' : 'No-Go Line'}</span>
                    </div>
                    {props.boundary.type === 'polyline' && (<Input type="switch" skipSection={true} value={props.boundary.enabled} onChange={(value) => props.boundary.enabled = value} />)}
                    {props.boundary.type === 'polygon' && (<Button style='primary' text='Clean zone' onClick={() => { }} />)}
                </div>
            </div>

            <div className={styles.zoneActions}>
                {props.boundary.type === 'polygon' && (
                    <Button text="Add schedule" style='secondary' onClick={() => console.log('Add schedule')} />
                )}
                <Button text="Edit" style='primary' onClick={() => props.editBoundary(props.boundary.id)} />
                <Button text="Delete" style='fail' onClick={() => props.deleteBoundary(props.boundary.id)} />
            </div>
        </div>
    )
}


const BoundaryTypes = biEnum({
    NO_GO_LINE: 'no-go',
    ZONE: 'zone',
})

interface EditBoundaryDetailsProps {
    currentLinePoints: Point[]
    closedAsPolygon: boolean
    name: string,
    setName: (name: string) => void;
    color: string,
    setColor: (color: string) => void;
    save: () => void
    cancel: () => void
    setDrawerOpen: (open: boolean) => void
}

const EditBoundaryDetails = (props: EditBoundaryDetailsProps) => {
    return (
        <div className={styles.editBoundaryDetails}>

            <div>
                <Input
                    type="text"
                    label="Name"
                    value={props.name}
                    onChange={(value) => props.setName(value)} />

                {props.currentLinePoints.length > 1 ? (
                    <Input
                        type="select"
                        label="Type"
                        options={[
                            {
                                value: props.closedAsPolygon ? BoundaryTypes.ZONE : BoundaryTypes.NO_GO_LINE,
                                label: props.closedAsPolygon ? 'Zone' : 'No-Go Line'
                            }
                        ]}
                        value={props.closedAsPolygon ? BoundaryTypes.ZONE : BoundaryTypes.NO_GO_LINE}
                        onChange={() => { }}
                        extraInfo={
                            props.closedAsPolygon ?
                                "To make a no-go line, don't press the button to close the polygon." :
                                "To make a Zone, move cursor to the first point and click the Zone button (blue to the right), this will connect the points and make a Zone."
                        }
                    />
                ) : (
                    <Input
                        type="custom"
                        label="Type"
                        extraInfo='By drawing a line you are making a no-go lines, by using the polygon button to connect the cursor with the first point, you are making a zone'>
                        <Button text="Draw boundary" style='primary' onClick={() => props.setDrawerOpen(false)} />
                    </Input>
                )}

                <Input
                    type="text"
                    label="Color"
                    value={props.color}
                    onChange={(value) => props.setColor(value)}
                />
            </div>


            <div className={styles.editBoundaryActionButtons}>
                <Button text="Cancel" style='fail' onClick={() => props.cancel()} />
                <Button text="Save" style='success' onClick={() => props.save()} />
            </div>
        </div>
    )
}
