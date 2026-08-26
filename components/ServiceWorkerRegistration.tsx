'use client'

import { useEffect } from 'react'
import { startOfflineSync } from '@/lib/offline-sync'

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        const stopOfflineSync = startOfflineSync()

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload()
            })

            void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
                .then((registration) => {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
                    }

                    registration.addEventListener('updatefound', () => {
                        const installing = registration.installing
                        if (!installing) return

                        installing.addEventListener('statechange', () => {
                            if (installing.state === 'activated') {
                                window.location.reload()
                            }
                        })
                    })
                })
                .catch((error) => {
                    console.warn('Unable to register the SwimFlow service worker:', error)
                })
        }

        return stopOfflineSync
    }, [])

    return null
}