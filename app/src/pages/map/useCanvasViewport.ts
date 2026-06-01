import { useState } from 'react'
import type { Offset, TouchState } from './types'
import { DRAWING } from './constants'
import { getTouchDistance, getTouchAngle } from './utils'

interface Props {
    initialZoom: number
    initialOffset: Offset
}

export const useCanvasViewport = ({
    initialZoom,
    initialOffset
}: Props) => {
    const [zoom, setZoom] = useState(initialZoom)
    const [offset, setOffset] = useState(initialOffset)

    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [touchStart, setTouchStart] = useState<TouchState | null>(null)
    const [hasMoved, setHasMoved] = useState(false)

    const pan = (dx: number, dy: number) => {
        setOffset(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
        }))
    }

    const zoomAt = (newZoom: number, centerX: number, centerY: number) => {
        setOffset(prev => {
            const worldX = (centerX - prev.x) / zoom
            const worldY = (centerY - prev.y) / zoom

            return {
                x: centerX - worldX * newZoom,
                y: centerY - worldY * newZoom
            }
        })

        setZoom(newZoom)
    }

    // ─────────────────────────────
    // Mouse
    // ─────────────────────────────

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setHasMoved(false)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

        if (
            Math.abs(dx) >= DRAWING.MIN_MOVEMENT ||
            Math.abs(dy) >= DRAWING.MIN_MOVEMENT
        ) {
            setHasMoved(true)
            pan(dx, dy)

            setDragStart({
                x: e.clientX,
                y: e.clientY
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setHasMoved(false)
    }

    const handleWheel = (e: React.WheelEvent) => {
        // e.preventDefault()

        // const factor =
        //     e.deltaY < 0
        //         ? DRAWING.ZOOM_FACTOR
        //         : 1 / DRAWING.ZOOM_FACTOR

        // const newZoom = Math.max(
        //     DRAWING.MIN_ZOOM,
        //     Math.min(DRAWING.MAX_ZOOM, zoom * factor)
        // )

        // zoomAt(newZoom, e.clientX, e.clientY)

        e.preventDefault()
        const mouseX = e.clientX
        const mouseY = e.clientY
        const worldX = (mouseX - offset.x) / zoom
        const worldY = (mouseY - offset.y) / zoom
        const factor = e.deltaY < 0 ? DRAWING.ZOOM_FACTOR : 1 / DRAWING.ZOOM_FACTOR
        const newZoom = Math.max(DRAWING.MIN_ZOOM, Math.min(DRAWING.MAX_ZOOM, zoom * factor))
        const newOffsetX = mouseX - worldX * newZoom
        const newOffsetY = mouseY - worldY * newZoom
        setZoom(newZoom)
        setOffset({ x: newOffsetX, y: newOffsetY })
    }

    // ─────────────────────────────
    // Touch
    // ─────────────────────────────

    const handleTouchStart = (e: React.TouchEvent) => {
        const t = e.touches

        if (t.length === 1) {
            setIsDragging(true)
            setDragStart({ x: t[0].clientX, y: t[0].clientY })
            setHasMoved(false)
        } else if (t.length === 2) {
            setTouchStart({
                distance: getTouchDistance(t[0], t[1]),
                angle: getTouchAngle(t[0], t[1])
            })
            setIsDragging(false)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const t = e.touches
        setHasMoved(true)

        if (t.length === 1 && isDragging) {
            const dx = t[0].clientX - dragStart.x
            const dy = t[0].clientY - dragStart.y

            if (
                Math.abs(dx) >= DRAWING.MIN_MOVEMENT ||
                Math.abs(dy) >= DRAWING.MIN_MOVEMENT
            ) {
                pan(dx, dy)

                setDragStart({
                    x: t[0].clientX,
                    y: t[0].clientY
                })
            }
        }

        if (t.length === 2 && touchStart) {
            const distance = getTouchDistance(t[0], t[1])
            const ratio = distance / touchStart.distance

            const newZoom = Math.max(
                DRAWING.MIN_ZOOM,
                Math.min(
                    DRAWING.MAX_ZOOM,
                    zoom * Math.pow(ratio, DRAWING.PINCH_ZOOM_POWER)
                )
            )

            const centerX = (t[0].clientX + t[1].clientX) / 2
            const centerY = (t[0].clientY + t[1].clientY) / 2

            zoomAt(newZoom, centerX, centerY)

            setTouchStart({
                distance,
                angle: getTouchAngle(t[0], t[1])
            })
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        setTouchStart(null)
        setHasMoved(false)
    }

    const centerView = (mapWidth: number, mapHeight: number, baseZoom: number) => {
        setZoom(baseZoom)

        setOffset({
            x: window.innerWidth / 2 - (mapWidth * baseZoom) / 2,
            y: window.innerHeight / 2 - (mapHeight * baseZoom) / 2
        })
    }

    return {
        // viewport state
        zoom,
        offset,

        // interaction state
        isDragging,
        hasMoved,

        // handlers
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,

        centerView
    }
}