import { COLORS, DRAWING } from './constants'
import type { Zone, NoGoLine, Point } from './types'

/* ---------------- SHAPE TYPES ---------------- */

export type CellShape = 'heart' | 'circle' | 'square'

/* ---------------- SHAPE CACHE ---------------- */

const SHAPE_CACHE = new Map<string, Path2D>()

function getShape(type: CellShape, size: number): Path2D {
    const key = `${type}:${size}`

    const cached = SHAPE_CACHE.get(key)
    if (cached) return cached

    const path = new Path2D()
    const s = size
    const cx = 0
    const cy = 0

    if (type === 'square') {
        path.rect(-s, -s, s * 2, s * 2)
    }
    
    else if (type === 'circle') {
        path.arc(cx, cy, s / 2, 0, Math.PI * 2)
    }

    else if (type === 'heart') {
        path.moveTo(cx, cy + s / 4)
        path.bezierCurveTo(
            cx - s / 2, cy - s / 4,
            cx - s, cy + s / 2,
            cx, cy + s
        )
        path.bezierCurveTo(
            cx + s, cy + s / 2,
            cx + s / 2, cy - s / 4,
            cx, cy + s / 4
        )
    }

    SHAPE_CACHE.set(key, path)
    return path
}

/* ---------------- VIEWPORT ---------------- */

function getVisibleBounds(
    canvas: HTMLCanvasElement,
    zoom: number,
    offset: { x: number; y: number }
) {
    return {
        minX: Math.floor((-offset.x) / zoom),
        minY: Math.floor((-offset.y) / zoom),
        maxX: Math.ceil((canvas.width - offset.x) / zoom),
        maxY: Math.ceil((canvas.height - offset.y) / zoom)
    }
}

/* ---------------- MAIN MAP ---------------- */

export function drawMap(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    cells: number[],
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
    shape: CellShape = 'circle' // 👈 choose mode here
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // The map is drawn like an image: always on its own background so the
    // wall/floor colours keep the same contrast in every app theme.
    ctx.fillStyle = COLORS.BACKGROUND
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const bounds = getVisibleBounds(canvas, zoom, offset)

    const startX = Math.max(0, bounds.minX)
    const startY = Math.max(0, bounds.minY)
    const endX = Math.min(mapSize.width, bounds.maxX)
    const endY = Math.min(mapSize.height, bounds.maxY)

    const scale = zoom
    const ox = offset.x
    const oy = offset.y

    for (let y = startY; y < endY; y++) {
        const row = y * mapSize.width

        for (let x = startX; x < endX; x++) {
            const value = cells[row + x]

            // if (value === 0) ctx.fillStyle = '#1a1f2e'
            if (value === 0) continue
            const isWall = value !== 1
            ctx.fillStyle = isWall ? COLORS.WALL : COLORS.EMPTY

            // walls are drawn larger than floor cells so the outline reads as a solid edge
            const size = isWall ? Math.max(1.5, scale * 0.75) : Math.max(1, scale * 0.45)

            const cx = ox + x * scale + scale / 2
            const cy = oy + y * scale + scale / 2

            ctx.save()
            ctx.translate(cx, cy)
            ctx.fill(getShape(shape, size))
            ctx.restore()
        }
    }
}

// /* ---------------- GRID ---------------- */

// function drawGrid(
//     ctx: CanvasRenderingContext2D,
//     zoom: number,
//     offset: { x: number; y: number },
//     canvas: HTMLCanvasElement
// ) {
//     ctx.strokeStyle = COLORS.GRID
//     ctx.lineWidth = DRAWING.GRID_LINE_WIDTH

//     const bounds = getVisibleBounds(canvas, zoom, offset)

//     const startX = Math.max(0, bounds.minX)
//     const startY = Math.max(0, bounds.minY)
//     const endX = Math.min(mapData.width, bounds.maxX)
//     const endY = Math.min(mapData.height, bounds.maxY)

//     const ox = offset.x
//     const oy = offset.y

//     for (let y = startY; y <= endY; y++) {
//         ctx.beginPath()
//         ctx.moveTo(ox + startX * zoom, oy + y * zoom)
//         ctx.lineTo(ox + endX * zoom, oy + y * zoom)
//         ctx.stroke()
//     }

//     for (let x = startX; x <= endX; x++) {
//         ctx.beginPath()
//         ctx.moveTo(ox + x * zoom, oy + startY * zoom)
//         ctx.lineTo(ox + x * zoom, oy + endY * zoom)
//         ctx.stroke()
//     }
// }

/* ---------------- ZONES ---------------- */

function drawZone(
    ctx: CanvasRenderingContext2D,
    zone: Zone,
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    if (zone.vertices.length < 3) return

    ctx.fillStyle = zone.color ? zone.color + '33' : COLORS.POLYGON_FILL
    ctx.strokeStyle = zone.color || COLORS.LINE_COLOR

    const sx = mapSize.width * zoom
    const sy = mapSize.height * zoom

    ctx.beginPath()

    const first = zone.vertices[0]
    ctx.moveTo(offset.x + first[0] * sx, offset.y + first[1] * sy)

    for (let i = 1; i < zone.vertices.length; i++) {
        const p = zone.vertices[i]
        ctx.lineTo(offset.x + p[0] * sx, offset.y + p[1] * sy)
    }

    ctx.closePath()
    ctx.fill()
    ctx.stroke()
}

export function drawZones(
    ctx: CanvasRenderingContext2D,
    zones: Zone[],
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    // ctx.fillStyle = COLORS.POLYGON_FILL
    // ctx.strokeStyle = COLORS.LINE_COLOR
    ctx.lineWidth = Math.max(DRAWING.MIN_LINE_WIDTH, zoom * DRAWING.POLYGON_LINE_WIDTH_SCALE)

    for (const p of zones) {
        drawZone(ctx, p, zoom, offset, mapSize)
    }
}

/* ---------------- POLYLINES ---------------- */

function drawNoGoLine(
    ctx: CanvasRenderingContext2D,
    nogoLine: NoGoLine,
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    if (nogoLine.vertices.length < 2) return

    ctx.strokeStyle = nogoLine.color || COLORS.LINE_COLOR

    const sx = mapSize.width * zoom
    const sy = mapSize.height * zoom

    ctx.beginPath()

    const first = nogoLine.vertices[0]
    ctx.moveTo(offset.x + first[0] * sx, offset.y + first[1] * sy)

    for (let i = 1; i < nogoLine.vertices.length; i++) {
        const p = nogoLine.vertices[i]
        ctx.lineTo(offset.x + p[0] * sx, offset.y + p[1] * sy)
    }

    ctx.stroke()
}

export function drawNoGoLines(
    ctx: CanvasRenderingContext2D,
    nogoLines: NoGoLine[],
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    // ctx.strokeStyle = COLORS.LINE_COLOR
    ctx.lineWidth = Math.max(DRAWING.MIN_LINE_WIDTH, zoom * DRAWING.POLYLINE_LINE_WIDTH_SCALE)

    for (const p of nogoLines) {
        drawNoGoLine(ctx, p, zoom, offset, mapSize)
    }
}

/* ---------------- IN PROGRESS ---------------- */

export function drawInProgressPolyline(
    ctx: CanvasRenderingContext2D,
    pts: Point[],
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    if (!pts.length) return

    const sx = mapSize.width * zoom
    const sy = mapSize.height * zoom

    ctx.strokeStyle = COLORS.IN_PROGRESS
    ctx.lineWidth = Math.max(DRAWING.MIN_LINE_WIDTH, zoom * DRAWING.IN_PROGRESS_LINE_WIDTH_SCALE)

    if (pts.length > 1) {
        ctx.beginPath()

        const first = pts[0]
        ctx.moveTo(offset.x + first[0] * sx, offset.y + first[1] * sy)

        for (let i = 1; i < pts.length; i++) {
            const p = pts[i]
            ctx.lineTo(offset.x + p[0] * sx, offset.y + p[1] * sy)
        }

        ctx.stroke()
    }

    ctx.fillStyle = COLORS.IN_PROGRESS

    for (const p of pts) {
        ctx.beginPath()
        ctx.arc(
            offset.x + p[0] * sx,
            offset.y + p[1] * sy,
            DRAWING.POINT_RADIUS,
            0,
            Math.PI * 2
        )
        ctx.fill()
    }
}

/* ---------------- CROSSHAIR ---------------- */

export function drawCrosshair(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
) {
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    ctx.strokeStyle = COLORS.CROSSHAIR
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(cx - DRAWING.CROSSHAIR_SIZE, cy)
    ctx.lineTo(cx + DRAWING.CROSSHAIR_SIZE, cy)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx, cy - DRAWING.CROSSHAIR_SIZE)
    ctx.lineTo(cx, cy + DRAWING.CROSSHAIR_SIZE)
    ctx.stroke()

    ctx.fillStyle = COLORS.CROSSHAIR
    ctx.beginPath()
    ctx.arc(cx, cy, DRAWING.CROSSHAIR_CENTER_RADIUS, 0, Math.PI * 2)
    ctx.fill()
}

export function drawBase(
    ctx: CanvasRenderingContext2D,
    coords: { x: number; y: number; width: number; height: number },
    zoom: number,
    offset: { x: number; y: number },
    mapSize: { height: number, width: number },
) {
    const sx = mapSize.width * zoom
    const sy = mapSize.height * zoom

    const x = offset.x + coords.x * sx
    const y = offset.y + coords.y * sy
    const w = coords.width * sx
    const h = coords.height * sy

    ctx.fillStyle = 'red'
    console.log(x, y, w, h)
    ctx.fillRect(x, y, w, h)
}
