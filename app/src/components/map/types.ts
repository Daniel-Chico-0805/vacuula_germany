export type UseState<T> = React.Dispatch<React.SetStateAction<T>>


export type Point = [number, number]

export interface Zone {
    id: string
    name: string
    color: string
    type: 'polygon'
    vertices: Point[]
    enabled: boolean
}

export interface SetZone extends Zone {
    relevancy: Point
}

export interface NoGoLine {
    id: string
    name: string
    color: string
    type: 'polyline'
    vertices: Point[]
    enabled: boolean
}

export interface Offset {
    x: number
    y: number
}

export interface TouchState {
    distance: number
    angle: number
}
