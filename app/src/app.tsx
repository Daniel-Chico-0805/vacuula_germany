import Navbar from "./components/navbar/navbar"
import Map from "./pages/map/map"
import styles from './app.module.scss'
import { Routes, Route } from "react-router"
import Scroll from "./pages/scroll/scroll"
import Topbar from "./components/topbar/topbar"
import Home from "./pages/home/home"
import AppLoadingIndicator from "./components/appLoadingIndicator/appLoadingIndicator"
import Schedule from "./pages/schedule/schedule"

export default () => {
    return (
        <div className={styles.app}>
            <AppLoadingIndicator />
            <div className={styles.topbar}>
                <Topbar />
            </div>
            <div className={styles.content}>
                <Routes>
                    <Route index element={<Home />} />
                    <Route path="stats" element={<Scroll />} />
                    <Route path="map" element={<Map />} />
                    <Route path="schedule" element={<Schedule />} />
                    <Route path="settings" element={<Scroll />} />

                </Routes>
            </div>
            <div className={styles.navbar}>
                <Navbar />
            </div>
        </div>
    )
}

