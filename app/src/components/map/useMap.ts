import { useRef, useState, useCallback, useEffect } from 'react'
import { DRAWING } from './constants'
import { useCanvasViewport } from './useCanvasViewport'
import { decodeRLE, calcFitZoomAndOffset } from './utils'
import { drawMap, computeIgnoredRunValues, colorForPathValue, type CellShape } from './drawingFunctions'
import { Http } from '../../http'
import type { Offset } from './types'

export interface MapSize { width: number; height: number }

export type ExtraDrawFn = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    zoom: number,
    offset: Offset,
    mapSize: MapSize
) => void

interface UseMapOptions {
    serial: string
    mapId?: string
    runId?: string
    shape?: CellShape
    fitOnLoad?: boolean
    extraDraw?: ExtraDrawFn
    // bump this to force a redraw when extraDraw's closed-over state changes
    // (boundaries, mode, currentLinePoints, etc.) without re-registering the RAF effect's deps.
    redrawKey?: unknown
}

export function useMap({
    serial,
    mapId,
    runId,
    shape = 'circle',
    fitOnLoad = true,
    extraDraw,
    redrawKey
}: UseMapOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cellsRef = useRef<number[] | null>(null)
    const runCellsRef = useRef<number[] | null>(null)
    const runIgnoreSetRef = useRef<Set<number>>(new Set())
    const userInteractedRef = useRef(false)
    const extraDrawRef = useRef(extraDraw)
    extraDrawRef.current = extraDraw

    const [mapSize, setMapSize] = useState<MapSize>()

    const {
        zoom, offset, isDragging, hasMoved,
        handleMouseDown, handleMouseMove, handleMouseUp, handleWheel,
        handleTouchStart, handleTouchMove, handleTouchEnd,
        centerView, setZoom, setOffset
    } = useCanvasViewport({ initialZoom: 4, initialOffset: { x: 0, y: 0 } })

    const draw = useCallback((currentZoom: number = zoom, currentOffset: Offset = offset) => {
        const canvas = canvasRef.current
        if (!canvas || !cellsRef.current || !mapSize) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        drawMap(
            ctx, canvas, cellsRef.current, currentZoom, currentOffset, mapSize,
            shape, runCellsRef.current,
            { getRunColor: colorForPathValue, ignoreRunValues: runIgnoreSetRef.current }
        )

        extraDrawRef.current?.(ctx, canvas, currentZoom, currentOffset, mapSize)
    }, [mapSize, shape])

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        userInteractedRef.current = true
        handleMouseDown(e)
    }, [handleMouseDown])
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        userInteractedRef.current = true
        handleTouchStart(e)
    }, [handleTouchStart])
    const onWheel = useCallback((e: React.WheelEvent) => {
        userInteractedRef.current = true
        handleWheel(e)
    }, [handleWheel])

    // Load floor map
    useEffect(() => {
        if (!mapId) return
        Http.getPersistentMap(serial, mapId).then(res => {
            cellsRef.current = decodeRLE(res.data.rle)
            runCellsRef.current = null
            runIgnoreSetRef.current = new Set()
            setMapSize({ height: res.data.height, width: res.data.width })
        })
    }, [serial, mapId])

    // Load run overlay
    useEffect(() => {
        if (!mapId || !runId) {
            runCellsRef.current = null
            runIgnoreSetRef.current = new Set()
            draw()
            return
        }
        Http.getCleaning(serial, runId).then(res => {
            const runCells = decodeRLE(res.data.rle)
            if (mapSize && (res.data.width !== mapSize.width || res.data.height !== mapSize.height)) {
                console.warn('Run map size mismatch, skipping overlay')
                runCellsRef.current = null
            } else {
                runCellsRef.current = runCells
            }
            runIgnoreSetRef.current = computeIgnoredRunValues(runCellsRef.current, 2)
            draw()
        })
    }, [serial, mapId, runId, mapSize])

    // Redraw on viewport change, or when caller's overlay-relevant state changes
    useEffect(() => {
        const id = requestAnimationFrame(() => draw(zoom, offset))
        return () => cancelAnimationFrame(id)
    }, [zoom, offset, draw, redrawKey])

    // Resize-to-container + fit-to-content
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const parent = canvas.parentElement
        if (!parent) return

        const resizeToContainer = () => {
            const { width, height } = parent.getBoundingClientRect()
            canvas.width = width
            canvas.height = height

            if (fitOnLoad && cellsRef.current && mapSize && !userInteractedRef.current) {
                const fit = calcFitZoomAndOffset(
                    cellsRef.current, mapSize, width, height,
                    DRAWING.MIN_ZOOM, DRAWING.MAX_ZOOM
                )
                if (fit) {
                    setZoom(fit.zoom)
                    setOffset(fit.offset)
                    return
                }
                centerView(mapSize.width, mapSize.height, 4, width, height)
                return
            }
            draw()
        }

        resizeToContainer()
        const ro = new ResizeObserver(resizeToContainer)
        ro.observe(parent)
        return () => ro.disconnect()
    }, [mapSize, fitOnLoad])

    const resetView = useCallback(() => {
        userInteractedRef.current = false
        const canvas = canvasRef.current
        const parent = canvas?.parentElement
        if (!canvas || !parent || !cellsRef.current || !mapSize) return
        const { width, height } = parent.getBoundingClientRect()
        const fit = calcFitZoomAndOffset(cellsRef.current, mapSize, width, height, DRAWING.MIN_ZOOM, DRAWING.MAX_ZOOM)
        if (fit) {
            setZoom(fit.zoom)
            setOffset(fit.offset)
        }
    }, [mapSize])

    return {
        canvasRef, cellsRef, mapSize,
        zoom, offset, isDragging, hasMoved,
        canvasHandlers: {
            onMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
            onWheel,
            onTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        draw,
        resetView
    }
}