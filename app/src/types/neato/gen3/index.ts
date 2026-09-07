export * from './state'
export * from './robot'
export * from './api'
export * from './strings'


export interface PersistentMap {
    id: string
    name: string
    enabled: boolean
    base: { x: number, y: number }
}
