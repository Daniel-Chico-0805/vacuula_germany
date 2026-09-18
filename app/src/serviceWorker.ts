// Registers the service worker (public/sw.js) in production builds.
// Browsers only allow it on HTTPS or localhost; elsewhere registration is
// rejected and the app simply runs without it.
export function registerServiceWorker() {
    if (!import.meta.env.PROD) return
    if (!('serviceWorker' in navigator)) return
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // not a secure context or not supported - nothing to do
        })
    })
}
