import { useEffect, useRef, useState } from "react";
import styles from './drawer.module.scss'
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";



interface DrawerProps {
    handle: boolean // should the handle be visible when closed
    open: boolean,
    openHeightPercent: number
    onOpenChange?: (open: boolean) => void,
    children?: React.ReactNode,
    title?: string,

    showBackButton?: boolean
    onBackButtonClick?: () => void
}

const HANDLE_HEIGHT = 60

export default function Drawer(props: DrawerProps) {
    const { t } = useTranslation()
    const [drawerHeight, setDrawerHeight] = useState(props.handle ? HANDLE_HEIGHT : 0)
    const [isDraggingDrawer, setIsDraggingDrawer] = useState(false)

    // Per-gesture values the window listeners below are registered per gesture
    // and would otherwise keep reading the values from the render in which the
    // drag started.
    const dragStartYRef = useRef(0)
    const startHeightRef = useRef(0)
    const currentHeightRef = useRef(0)
    const lastYRef = useRef(0)
    const lastDeltaRef = useRef(0)

    const startDrag = (clientY: number) => {
        dragStartYRef.current = clientY
        lastYRef.current = clientY
        startHeightRef.current = drawerHeight
        currentHeightRef.current = drawerHeight
        lastDeltaRef.current = 0
        setIsDraggingDrawer(true)
    }

    const handleDrawerMouseDown = (e: React.MouseEvent) => {
        startDrag(e.clientY)
    }

    const handleDrawerTouchStart = (e: React.TouchEvent) => {
        startDrag(e.touches[0].clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
        const y = e.touches[0].clientY
        lastDeltaRef.current = lastYRef.current - y // flick detection
        lastYRef.current = y
        const total = dragStartYRef.current - y
        const newHeight = Math.min(window.innerHeight * 0.9, Math.max(HANDLE_HEIGHT, startHeightRef.current + total))
        currentHeightRef.current = newHeight
        setDrawerHeight(newHeight)
    }

    const handleMouseUp = () => {
        setIsDraggingDrawer(false)
        const lastDelta = lastDeltaRef.current
        if (lastDelta < -15) closeDrawer()
        else if (lastDelta > 15) openDrawer()
        else if ((currentHeightRef.current - HANDLE_HEIGHT) > window.innerHeight * 0.2) openDrawer()
        else closeDrawer()
    }

    const openDrawer = () => {
        setDrawerHeight(window.innerHeight * (props.openHeightPercent / 100));
        props.onOpenChange?.(true);
    }
    const closeDrawer = () => {
        setDrawerHeight(props.handle ? HANDLE_HEIGHT : 0);
        props.onOpenChange?.(false);
    }
    const isDrawerOpen = () => drawerHeight > 100;

    useEffect(() => {
        if (props.open) openDrawer()
        else closeDrawer()
    }, [props.open])

    useEffect(() => {
        if (isDraggingDrawer) return
        setDrawerHeight(props.open ? window.innerHeight * (props.openHeightPercent / 100) : (props.handle ? HANDLE_HEIGHT : 0))
    }, [props.openHeightPercent])

    useEffect(() => {
        if (isDraggingDrawer) {
            window.addEventListener('touchmove', handleTouchMove)
            window.addEventListener('mouseup', handleMouseUp)
            window.addEventListener('touchend', handleMouseUp)
            return () => {
                window.removeEventListener('touchmove', handleTouchMove)
                window.removeEventListener('mouseup', handleMouseUp)
                window.removeEventListener('touchend', handleMouseUp)
            }
        }
    }, [isDraggingDrawer])

    // if (!props.handle && !props.open) return null

    return (
        <div
            className={styles.drawer}
            style={{
                height: `${drawerHeight}px`,
                transition: isDraggingDrawer ? 'none' : 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                borderTop: (props.handle || props.open) ? '2px solid var(--border-strong)' : ''
            }}>

            {(props.handle || props.open) && (
                <div
                    className={styles.drawerHandle}
                    onMouseDown={handleDrawerMouseDown}
                    onTouchStart={handleDrawerTouchStart}
                    onClick={isDrawerOpen() ? closeDrawer : openDrawer}>
                    {props.showBackButton && props.open && <FaArrowLeft size={25} className={styles.handleIcon} onClick={(e) => {
                        e.stopPropagation()
                        props.onBackButtonClick?.()
                    }} />}
                    <div className={styles.drawerTitle}>
                        {props.title || t('common.options')}
                    </div>
                </div>
            )}

            {drawerHeight > 100 && (
                <div className={styles.drawerContent}>
                    {props.children}
                </div>
            )}
        </div>
    )
}
