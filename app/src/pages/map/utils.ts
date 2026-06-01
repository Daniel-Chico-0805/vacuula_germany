import type { Point } from './types'

// RLE Decode helper
export function decodeRLE(rle: Array<any>) {
    const output: number[] = []
    for (const [value, count] of rle) {
        for (let i = 0; i < count; i++) {
            output.push(value)
        }
    }
    return output
}

// Touch helpers
export function getTouchDistance(t1: React.Touch, t2: React.Touch) {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
}

export function getTouchAngle(t1: React.Touch, t2: React.Touch) {
    const dx = t2.clientX - t1.clientX
    const dy = t2.clientY - t1.clientY
    return Math.atan2(dy, dx)
}

// Coordinate conversion
export function getWorldCoords(screenX: number, screenY: number, offset: { x: number; y: number }, zoom: number, mapSize: { height: number, width: number }): Point {
    return [
        ((screenX - offset.x) / zoom) / mapSize.width, // x
        ((screenY - offset.y) / zoom) / mapSize.height // y
    ]
}

export function getCrosshairWorldCoords(canvasRef: React.RefObject<HTMLCanvasElement>, offset: { x: number; y: number }, zoom: number, mapSize: { height: number, width: number }): Point {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]
    // Center of screen in canvas coordinates
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    return getWorldCoords(centerX, centerY, offset, zoom, mapSize)
}

export function calcRelevancy(vertices: Point[]): Point {
    const x = vertices.reduce((sum, v) => sum + v[0], 0) / vertices.length;
    const y = vertices.reduce((sum, v) => sum + v[1], 0) / vertices.length;
    return [x, y];
}

export const upsertPreserveOrder = <T extends { id: string }>(
    list: T[],
    item: T
): T[] => {
    const index = list.findIndex(b => b.id === item.id);

    if (index === -1) return [...list, item];

    const copy = [...list];
    copy[index] = item;
    return copy;
};