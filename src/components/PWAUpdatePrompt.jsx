import { useEffect, useState } from 'react'

export default function PWAUpdatePrompt() {
    const [needRefresh, setNeedRefresh] = useState(false)
    const [updateServiceWorker, setUpdateServiceWorker] = useState(null)

    useEffect(() => {
        const onNeedRefresh = (event) => {
            setNeedRefresh(true)
            setUpdateServiceWorker(() => event.detail?.updateSW || null)
        }

        window.addEventListener('edutraker:pwa-need-refresh', onNeedRefresh)
        return () => {
            window.removeEventListener('edutraker:pwa-need-refresh', onNeedRefresh)
        }
    }, [])

    if (!needRefresh) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-2xl bg-indigo-600 px-6 py-4 text-white shadow-2xl">
            <span className="text-sm font-medium">New version available!</span>
            <button
                onClick={() => {
                    if (typeof updateServiceWorker === 'function') {
                        updateServiceWorker(true)
                        return
                    }
                    window.location.reload()
                }}
                className="rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-indigo-600"
                type="button"
            >
                Update
            </button>
            <button
                onClick={() => setNeedRefresh(false)}
                className="text-sm text-indigo-200 hover:text-white"
                type="button"
            >
                Later
            </button>
        </div>
    )
}
