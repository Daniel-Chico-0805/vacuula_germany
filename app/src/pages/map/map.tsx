import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './map.module.scss'
import Drawer from '../../components/drawer/drawer'

import Input from '../../components/input/input'
import Button from '../../components/button/button'
import { GEN3_COMMANDS } from '../../http/gen3'
import { Http } from '../../http'
import { Neato, RobotType, type Robot } from '../../types'

import MapCanvas, { type MapMode } from './MapCanvas'
import { GEN4_COMMANDS } from '../../http/gen4'
import { useRobot } from '../../context/useRobot'
import { usePersistentMaps } from '../../loaders/resources'
import type { Floorplan } from '../../types/neato/gen4'
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useGetPromotedFloorplan } from '../../utils/floormaps'
import type { NoGoLine, Point, UseState, Zone } from '../../components/map/types'
import { drawZones, drawNoGoLines, drawBase, drawCrosshair, drawInProgressPolyline, onDockImageReady } from '../../components/map/drawingFunctions'
import { upsertPreserveOrder } from '../../components/map/utils'
import { normalizeHex, pickUnusedPreset, withAlpha } from '../../components/map/color'
import ColorPicker from '../../components/colorPicker/ColorPicker'
import { isDocked } from '../../components/topbar/robotInfo'


export default () => {
    const { t } = useTranslation()
    const [boundaries, setBoundaries] = useState<(NoGoLine | Zone)[]>([])
    const [drawerOpen, setDrawerOpen] = useState(true)

    const [editForm, setEditForm] = useState({
        name: '',
        color: '',
        zoneType: BoundaryTypes.NOGO_LINE
    });

    const [mapEditform, setMapEditForm] = useState({
        name: '',
        enabled: true
    })

    const [currentLinePoints, setCurrentLinePoints] = useState<Point[]>([])
    const [closedAsPolygon, setClosedAsPolygon] = useState(false)
    const [persistentMap, setPersistentMap] = useState<string>()

    const [mode, setMode] = useState<MapMode>('maps')
    const [returnFromEditMode, SetReturnFromEditMode] = useState<'boundaries' | 'boundary-info'>('boundaries')
    const [activeBoundaryId, setActiveBoundaryId] = useState<string | undefined>(undefined);

    const { robot } = useRobot()
    const skipNextPostRef = useRef(false)

    const { data: persistentMaps, refresh: updatePersistentMaps } = usePersistentMaps()
    const getPromotedFloorplan = useGetPromotedFloorplan()

    // TODO: the dock marker should be moved to the usemap thing 
    const [dockReady, setDockReady] = useState(false)
    useEffect(() => { onDockImageReady(() => setDockReady(true)) }, [])


    const extraDraw = useCallback((ctx, canvas, currentZoom, currentOffset, mapSize) => {
        const showBoundaries = mode === 'boundary-edit'
            ? boundaries.filter(b => b.id !== activeBoundaryId)
            : boundaries

        drawZones(ctx, showBoundaries.filter(b => b.type === 'polygon'), currentZoom, currentOffset, mapSize)
        drawNoGoLines(ctx, showBoundaries.filter(b => b.type === 'polyline'), currentZoom, currentOffset, mapSize)

        const map = persistentMaps?.find(p => p.id === persistentMap)
        const basicdata = map?.base
        const NO_BASE = 2147483647
        // Gen4: base = [x_mm, y_mm, dir_deg] in the map frame. Gen3 stores an
        // object without heading; it is drawn unrotated when present.
        if (map && 'origin' in map && Array.isArray(basicdata) && basicdata[0] !== NO_BASE && basicdata[1] !== NO_BASE) {
            const [originX, originY] = map.origin
            const resolution = map.resolution
            const [imgW, imgH] = map.imgsize
            const normX = ((basicdata[0] - originX) / resolution) / imgW
            const normY = ((basicdata[1] - originY) / resolution) / imgH
            drawBase(ctx, { x: normX, y: normY, dir: basicdata[2] ?? 0 }, currentZoom, currentOffset, mapSize, resolution)
        }

        if (mode === 'boundary-edit') {
            drawCrosshair(ctx, canvas)
            if (closedAsPolygon) {
                drawZones(ctx, [{ vertices: currentLinePoints, name: '', color: editForm.color, type: 'polygon', id: '', enabled: true }], currentZoom, currentOffset, mapSize)
            } else {
                drawInProgressPolyline(ctx, currentLinePoints, currentZoom, currentOffset, mapSize)
            }
        }
    }, [boundaries, activeBoundaryId, mode, currentLinePoints, closedAsPolygon, editForm.color, persistentMaps, persistentMap, dockReady])

    // Fetch boundaries when persistentMap changes
    useEffect(() => {
        if (!persistentMap) return
        skipNextPostRef.current = true
        if (robot.type === RobotType.NeatoGen4) {
            Http.getBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data))
        } else {
            GEN3_COMMANDS.getMapBoundaries(robot.serial, persistentMap).then(res => setBoundaries(res.data.data.boundaries))
        }
        setMode('boundaries')
    }, [persistentMap])

    const updatePersistentMap = (data: { name: string, enabled: boolean }, mapToChange?: string) => {
        const map = mapToChange || persistentMap;
        if (!map) return;
        Http.updatePersistentMap(robot.serial, map, data).finally(() => {
            updatePersistentMaps()
            if (persistentMap) setMode('boundaries')
        })
    }

    useEffect(() => {
        if (!robot) return;
        updatePersistentMaps();
    }, [robot.serial])

    useEffect(() => {
        if (!persistentMap) return;
        if (skipNextPostRef.current) {
            skipNextPostRef.current = false
            return
        }
        console.log(boundaries);
        Http.postBoundaries(robot.serial, persistentMap, boundaries);
    }, [boundaries]);

    // mode changes
    useEffect(() => {
        if (mode === 'boundaries') setActiveBoundaryId(undefined)
        if (mode === 'map-edit') {
            const pmap = persistentMaps?.find(p => p.id === persistentMap)
            if (!pmap) return;
            setMapEditForm({
                name: pmap.name,
                enabled: 'enabled' in pmap ? pmap.enabled : false // TODO: meh fix
            })
        }
        if (mode !== 'boundary-edit') {
            setCurrentLinePoints([])
            setClosedAsPolygon(false)
            return
        }
        const existingBoundary = boundaries.find(b => b.id === activeBoundaryId);
        setEditForm({
            name: existingBoundary?.name ?? '',
            // New boundary: first preset not used on this map. Existing one with a
            // malformed colour (old un-padded random hex): also fall back to a preset.
            color: normalizeHex(existingBoundary?.color) ?? pickUnusedPreset(boundaries.map(b => b.color)),
            zoneType: existingBoundary?.type === 'polygon' ?
                (existingBoundary?.function === 'cleaning' ?
                    BoundaryTypes.CLEANING_ZONE : BoundaryTypes.NOGO_ZONE
                ) : BoundaryTypes.NOGO_LINE
        });
        setCurrentLinePoints(existingBoundary?.vertices || [])
        setClosedAsPolygon(existingBoundary?.type === 'polygon')
    }, [mode])

    const saveEditBoundary = () => {
        setMode(returnFromEditMode);
        const id = activeBoundaryId ?? uuidv4();
        const updated = {
            id,
            name: editForm.name,
            color: editForm.color,
            function: closedAsPolygon ? (editForm.zoneType === BoundaryTypes.CLEANING_ZONE ? 'cleaning' : 'nogo') : 'nogo',
            type: closedAsPolygon ? 'polygon' as const : 'polyline' as const,
            vertices: currentLinePoints,
            enabled: true
        };
        setBoundaries(prev => upsertPreserveOrder(prev, updated));
    };

    const updateForm = <T extends object>(update: UseState<T>, patch: Partial<T>) => {
        update(prev => ({ ...prev, ...patch }))
    }

    const toggleNoGoLine = (item: NoGoLine) => {
        setBoundaries(prev => upsertPreserveOrder(prev, { ...item, enabled: !item.enabled }));
    };

    const deleteBoundary = (id: string) => {
        setBoundaries(prev => prev.filter(boundary => boundary.id !== id));
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
            case 'maps': return t('map.maps')
            case 'boundaries':
            case 'map-edit':
                return t('map.mapTitle', { name: persistentMaps?.find(p => p.id === persistentMap)?.name ?? '' })
            case 'boundary-info': return ' '
            case 'boundary-edit':
                if (!drawerOpen) return t('map.dragUpToFinish')
                return t('map.editBoundary')
        }
    }

    const cleanZone = async (zone: Zone) => {
        if (robot.type === RobotType.NeatoGen3) {
            GEN3_COMMANDS.startCleaningZone(robot.serial, zone.id, Neato.Gen3.CleaningMode.ECO, Neato.Gen3.CleaningNavigationMode.EXTRA_CARE)
            return;
        }
        const promotedFloorplan = await getPromotedFloorplan();
        if (!promotedFloorplan) return // TODO: ERROR (will do when i do gen3)
        GEN4_COMMANDS.startCleaning(robot.serial, Neato.Gen4.CleaningMode.ECO, Neato.Gen4.CleaningNavigationMode.GENTLE, promotedFloorplan.id, true, [zone.id])
    }

    return (
        <div className={styles.container}>
            {persistentMap ? (
                <MapCanvas
                    mapId={persistentMap}
                    mode={mode}
                    extraDraw={extraDraw}
                    redrawKey={extraDraw}
                    currentLinePoints={currentLinePoints}
                    setCurrentLinePoints={setCurrentLinePoints}
                    closedAsPolygon={closedAsPolygon}
                    setClosedAsPolygon={setClosedAsPolygon}
                    setDrawerOpen={setDrawerOpen}
                />
            ) : (
                <canvas className={styles.canvas} />
            )}

            {mode === 'maps' && (
                <div className={styles.selectMap}>
                    <span>{t('map.selectMap')}</span>
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
                                    <span className={styles.type}>{new Date(robot.type === RobotType.NeatoGen4 ? item.created_at : item.id).toLocaleString(i18n.language)}</span>
                                </div>
                                {'enabled' in item ? (
                                    <Input type="switch" skipSection={true} value={item.enabled} onChange={() => {
                                        updatePersistentMap({ name: item.name, enabled: !item.enabled }, item.id);
                                    }} />
                                ) : (
                                    <PromoteDemoteBtn robot={robot} map={item} onSuccess={updatePersistentMaps} />
                                )}
                            </div>
                        ))}
                        {persistentMaps?.length === 0 && (
                            <span style={{ textAlign: 'center' }}>{t('map.noMaps')}</span>
                        )}
                        <hr style={{ width: '90%' }} />
                        <div className={`${styles.item} ${styles.actionItem} ${isDocked(robot) ? '' : styles.disabled}`} onClick={() => robot.type === RobotType.NeatoGen4
                            ? GEN4_COMMANDS.startCleaning(robot.serial, Neato.Gen4.CleaningMode.ECO, Neato.Gen4.CleaningNavigationMode.GENTLE)
                            : GEN3_COMMANDS.startPersistentMapExploration(robot.serial)}>
                            <div className={styles.info}>
                                <span>{t('map.newMap')}</span>
                                <span className={styles.type}>{isDocked(robot) ? t('map.exploreNewMap') : t('map.cannotExploreNewMap')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'map-edit' && mapEditform && persistentMap && (
                    <div>
                        <Input
                            type="text"
                            label={t('common.name')}
                            value={mapEditform.name}
                            onChange={(name) => updateForm(setMapEditForm, { name })} />
                        {robot.type === RobotType.NeatoGen3 && (
                            <Input type="switch" label={t('common.enabled')} value={mapEditform.enabled} onChange={(enabled) => updateForm(setMapEditForm, { enabled })} />
                        )}
                        <Button text={t('common.save')} style='success' onClick={() => {
                            updatePersistentMap(mapEditform);
                        }} />
                        {robot.type === RobotType.NeatoGen4 &&
                            (persistentMaps?.find(p => p.id === persistentMap) as Floorplan)?.in_maps_list &&
                            !(persistentMaps?.find(p => p.id === persistentMap) as Floorplan)?.promoted && (
                                <div style={{ padding: '1rem 0' }}>
                                    <Button text={t('map.stopUsingAsFloormap')} style='fail' onClick={() =>
                                        Http.postUnuseMapAsFloorPlan(robot.serial, persistentMap).then(() => {
                                            setMode('maps')
                                            updatePersistentMaps()
                                        })} />
                                </div>
                            )}
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
                        zoneType={editForm.zoneType}
                        setName={(name) => updateForm(setEditForm, { name })}
                        setColor={(color) => updateForm(setEditForm, { color })}
                        setZoneType={(zoneType) => updateForm(setEditForm, { zoneType })}
                        cancel={() => {
                            setMode(returnFromEditMode)
                        }}
                        supportsZoneType={robot.type === RobotType.NeatoGen4}
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
                        onCleanZone={(zone) => cleanZone(zone)}
                    />
                )}

                {mode === 'boundaries' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                            {robot.type === RobotType.NeatoGen4 ? (
                                <PromoteDemoteBtn robot={robot} map={persistentMaps?.find(p => p.id === persistentMap) as Floorplan} onSuccess={updatePersistentMaps} />
                            ) : (
                                <span>{(persistentMaps?.find(p => p.id === persistentMap) as Neato.Gen3.PersistentMap)?.enabled ? t('common.enabled') : t('common.disabled')}</span>
                            )}

                            <Button text={t('map.editMapDetails')} style='primary' onClick={() => setMode('map-edit')} />
                        </div>
                        <hr />
                        <div className={styles.buttonContainer}>
                            <Button text={t('map.addFeature')} style='primary' onClick={() => openEdit(uuidv4())} />
                        </div>

                        <div className={styles.featureList}>
                            {boundaries.map((item, i) => (
                                <div key={i} className={styles.item} style={{ background: withAlpha(item.color, 0.13) }} onClick={() => openInfo(item.id)}>
                                    <div className={styles.info}>
                                        <span>{item.name}</span>
                                        <span className={styles.type} style={{ color: normalizeHex(item.color) ?? undefined }}>
                                            {item.type === 'polygon' ? t('map.zone') : t('map.noGoLine')}
                                        </span>
                                    </div>
                                    {item.type === 'polyline' && (<Input type="switch" skipSection={true} value={item.enabled} onChange={() => toggleNoGoLine(item)} />)}
                                    {item.type === 'polygon' && (<Button style='primary' text={t('map.cleanZone')} onClick={() => cleanZone(item)} />)}
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
    onCleanZone: (boundary: Zone) => void
}

const BoundaryDetails = (props: BoundaryDetailsProps) => {
    const { t } = useTranslation()
    return (
        <div className={styles.boundaryDetails}>
            <div className={styles.featureList}>
                <div className={styles.item} style={{ background: withAlpha(props.boundary.color, 0.13) }}>
                    <div className={styles.info}>
                        <span>{props.boundary.name}</span>
                        <span className={styles.type} style={{ color: normalizeHex(props.boundary.color) ?? undefined }}>{props.boundary.type === 'polygon' ? t('map.zone') : t('map.noGoLine')}</span>
                    </div>
                    {props.boundary.type === 'polyline' && (<Input type="switch" skipSection={true} value={props.boundary.enabled} onChange={(value) => props.boundary.enabled = value} />)}
                    {props.boundary.type === 'polygon' && (<Button style='primary' text={t('map.cleanZone')} onClick={() => props.onCleanZone(props.boundary as Zone)} />)}
                </div>
            </div>

            <div className={styles.zoneActions}>
                {/* TODO: add a scheduiling feature here in the future */}
                {/* {props.boundary.type === 'polygon' && (
                    <Button text={t('map.addSchedule')} style='secondary' onClick={() => console.log('Add schedule')} />
                )} */}
                <Button text={t('common.edit')} style='primary' onClick={() => props.editBoundary(props.boundary.id)} />
                <Button text={t('common.delete')} style='fail' onClick={() => props.deleteBoundary(props.boundary.id)} />
            </div>
        </div>
    )
}


enum BoundaryTypes {
    NOGO_LINE = 'nogo-line',
    NOGO_ZONE = 'nogo-zone',
    CLEANING_ZONE = 'cleaning-zone',
}

interface EditBoundaryDetailsProps {
    currentLinePoints: Point[]
    closedAsPolygon: boolean
    name: string,
    setName: (name: string) => void;
    color: string,
    setColor: (color: string) => void;
    zoneType: BoundaryTypes;
    setZoneType: (zoneType: BoundaryTypes) => void;
    save: () => void
    cancel: () => void
    setDrawerOpen: (open: boolean) => void;
    supportsZoneType: boolean
}

const EditBoundaryDetails = (props: EditBoundaryDetailsProps) => {
    const { t } = useTranslation()
    return (
        <div className={styles.editBoundaryDetails}>

            <div>
                <Input
                    type="text"
                    label={t('common.name')}
                    value={props.name}
                    onChange={(value) => props.setName(value)} />

                {props.currentLinePoints.length > 1 ? (
                    <Input
                        type="select"
                        label={props.supportsZoneType && props.closedAsPolygon ? t('map.zoneType') : t('common.type')}
                        options={[
                            {
                                value: props.closedAsPolygon ? BoundaryTypes.CLEANING_ZONE : BoundaryTypes.NOGO_LINE,
                                label: props.closedAsPolygon ? (props.supportsZoneType ? t('map.cleaning') : t('map.zone')) : t('map.noGoLine')
                            },
                            ...((props.supportsZoneType && props.closedAsPolygon) ? [{ value: BoundaryTypes.NOGO_ZONE, label: t('map.noGo') }] : [])
                        ]}
                        value={props.closedAsPolygon ? (props.supportsZoneType ? props.zoneType : BoundaryTypes.CLEANING_ZONE) : BoundaryTypes.NOGO_LINE}
                        onChange={(zoneType) => {
                            if (!props.supportsZoneType) return;
                            props.setZoneType(zoneType)
                        }}
                        extraInfo={
                            props.closedAsPolygon ?
                                t('map.polygonHint') :
                                t('map.lineHint')
                        }
                    />
                ) : (
                    <Input
                        type="custom"
                        label={t('common.type')}
                        extraInfo={t('map.drawHint')}>
                        <Button text={t('map.drawBoundary')} style='primary' onClick={() => props.setDrawerOpen(false)} />
                    </Input>
                )}

                <Input type="custom" label={t('map.color')}>
                    <ColorPicker value={props.color} onChange={props.setColor} />
                </Input>
            </div>


            <div className={styles.editBoundaryActionButtons}>
                <Button text={t('common.cancel')} style='fail' onClick={() => props.cancel()} />
                <Button text={t('common.save')} style='success' onClick={() => props.save()} />
            </div>
        </div>
    )
}

interface PromoteDemoteBtnProps {
    robot: Robot,
    map: Floorplan
    onSuccess: () => void
}
const PromoteDemoteBtn = ({ robot, map, onSuccess }: PromoteDemoteBtnProps) => {
    const { t } = useTranslation()
    return <Button text={map.promoted ? t('map.demote') : t('map.promote')} onClick={() => {
        if (map.promoted) Http.demoteFloorplan(robot.serial, map.id).finally(() => onSuccess())
        else Http.test(robot.serial, map.id).finally(() => onSuccess());
    }} style={map.promoted ? 'fail' : 'success'} />
}
