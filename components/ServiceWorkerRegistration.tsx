'use client'

import { useEffect } from 'react'
import { startOfflineSync } from '@/lib/offline-sync'

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        const stopOfflineSync = startOfflineSync()
        if ('serviceWorker' in navigator) {
            void navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.warn('Unable to register the SwimFlow service worker:', error)
            })
        }
        return stopOfflineSync
    }, [])

    return null
}