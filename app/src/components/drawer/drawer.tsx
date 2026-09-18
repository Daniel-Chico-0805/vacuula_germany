import { useEffect, useState } from "react";
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
    const [dragStartY, setDragStartY] = useState(0)
    const [lastDelta, setLastDelta] = useState(0)

    const handleDrawerMouseDown = (e: React.MouseEvent) => {
        setIsDraggingDrawer(true)
        setDragStartY(e.clientY)
    }

    const handleDrawerTouchStart = (e: React.TouchEvent) => {
        setIsDraggingDrawer(true)
        setDragStartY(e.touches[0].clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDraggingDrawer) return
        const delta = dragStartY - e.touches[0].clientY
        const newHeight = Math.min(window.innerHeight * 0.9, Math.max(HANDLE_HEIGHT, drawerHeight + delta))
        setDrawerHeight(newHeight)
        setDragStartY(e.touches[0].clientY)
        setLastDelta(delta)
    }

    const handleMouseUp = () => {
        setIsDraggingDrawer(false)
        if (lastDelta < -15) closeDrawer()
        else if (lastDelta > 15) openDrawer()
        else if ((drawerHeight - HANDLE_HEIGHT) > window.innerHeight * 0.2) openDrawer()
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
