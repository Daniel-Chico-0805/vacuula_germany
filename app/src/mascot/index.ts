import { useCallback, useSyncExternalStore } from 'react'
import logoVacuula from '../assets/logo.svg'
import logoRobot from '../assets/robot.svg'

// Mascot shown on the home page, the loading spinner and the tab icon.
// Add a mascot: drop the SVG in src/assets and public/favicon-<id>.svg, add the id
// here, an entry in MASCOTS and a `settings.mascot_<id>` string in every locale.
export type MascotId = 'vacuula' | 'robot'

export interface MascotOption {
    id: MascotId
    /** Image used inside the app */
    src: string
    /** Tab / bookmark icon (no drop shadow) */
    favicon: string
}

export const MASCOTS: MascotOption[] = [
    { id: 'vacuula', src: logoVacuula, favicon: `${import.meta.env.BASE_URL}favicon-vacuula.svg`, },
    { id: 'robot', src: logoRobot, favicon: `${import.meta.env.BASE_URL}favicon-robot.svg`, },
]
export const DEFAULT_MASCOT = MASCOTS[0].id
export const MASCOT_STORAGE_KEY = 'vacuula.mascot'

const byId = (id: string | null) => MASCOTS.find(m => m.id === id)

export function getMascot(): MascotOption {
    try {
        return byId(localStorage.getItem(MASCOT_STORAGE_KEY)) ?? MASCOTS[0]
    } catch {
        return MASCOTS[0]
    }
}

const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
}

function applyFavicon(mascot: MascotOption) {
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', mascot.favicon)
}

export function setMascot(id: string) {
    const mascot = byId(id)
    if (!mascot) return
    try { localStorage.setItem(MASCOT_STORAGE_KEY, id) } catch { /* storage unavailable */ }
    applyFavicon(mascot)
    listeners.forEach(fn => fn())
}

export function useMascot() {
    const mascot = useSyncExternalStore(subscribe, getMascot, () => MASCOTS[0])
    const set = useCallback((id: string) => setMascot(id), [])
    return { mascot, setMascot: set }
}

// Tab icon follows the stored choice from the first paint of the app
applyFavicon(getMascot())
