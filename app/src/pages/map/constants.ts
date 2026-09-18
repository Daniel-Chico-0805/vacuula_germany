// Canvas colours, resolved from the --map-* tokens in src/theme/theme.css so the
// map follows the active theme. Values are cached per theme/accent because the
// floor loop reads them once per cell.
const MAP_TOKENS = {
    BACKGROUND: '--map-bg',
    EMPTY: '--map-empty',
    WALL: '--map-wall',
    GRID: '--map-grid',
    POLYGON_FILL: '--map-polygon-fill',
    LINE_COLOR: '--map-line',
    CROSSHAIR: '--map-crosshair',
    IN_PROGRESS: '--map-in-progress',
} as const

type MapColorKey = keyof typeof MAP_TOKENS

let cachedKey = ''
let cachedColors: Record<MapColorKey, string> | null = null

function resolveColors(): Record<MapColorKey, string> {
    const html = document.documentElement
    const key = `${html.getAttribute('data-theme')}|${html.getAttribute('data-accent')}`
    if (cachedColors && key === cachedKey) return cachedColors
    const style = getComputedStyle(html)
    const resolved = {} as Record<MapColorKey, string>
    for (const name of Object.keys(MAP_TOKENS) as MapColorKey[]) {
        resolved[name] = style.getPropertyValue(MAP_TOKENS[name]).trim()
    }
    cachedKey = key
    cachedColors = resolved
    return resolved
}

export const COLORS: Readonly<Record<MapColorKey, string>> = new Proxy({} as Record<MapColorKey, string>, {
    get: (_target, prop: string) => resolveColors()[prop as MapColorKey],
})

// Drawing constants
export const DRAWING = {
    GRID_LINE_WIDTH: 1,
    POLYGON_LINE_WIDTH_SCALE: 0.15,
    POLYLINE_LINE_WIDTH_SCALE: 0.15,
    IN_PROGRESS_LINE_WIDTH_SCALE: 0.15,
    POINT_RADIUS: 5,
    CROSSHAIR_SIZE: 20,
    CROSSHAIR_CENTER_RADIUS: 4,
    CELL_OVERLAP_OFF: 0.8,
    MIN_LINE_WIDTH: 2,
    CLOSE_THRESHOLD: 0.02, // Normalized distance threshold for polygon closing
    MIN_ZOOM: 1,
    MAX_ZOOM: 60,
    ZOOM_FACTOR: 1.1,
    PINCH_ZOOM_POWER: 0.5,
    MIN_MOVEMENT: 5, // Pixels before considering it a drag vs click
} as const
