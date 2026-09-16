// Color constants
export const COLORS = {
    BACKGROUND: '#181920',
    EMPTY: '#303240',
    WALL: '#45d57d',
    GRID: 'rgba(255, 255, 255, 0.2)',
    POLYGON_FILL: 'rgba(255, 90, 31, 0.2)',
    LINE_COLOR: '#45d57d',
    CROSSHAIR: '#45d57d',
    IN_PROGRESS: '#4ab3f5',
} as const

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
    RUN_OVERLAY_OPACITY: 0.55,
    MIN_PINCH_DISTANCE: 10,
} as const
