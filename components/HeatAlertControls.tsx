'use client'

import { useEffect, useState } from 'react'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

const toApplicationServerKey = (value: string) => {
    const padded = `${value}${'='.repeat((4 - value.length % 4) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
    const raw = window.atob(padded)
    return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

const normalizeHeatLeadTime = (value: unknown) => {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) return value as 1 | 2 | 3 | 4 | 5
    return 'on-deck' as const
}

const readNotificationSettings = (meetId: string) => {
    if (typeof window === 'undefined') {
        return { heatEnabled: true, heatLeadTime: 'on-deck' as const, resultEnabled: true, trackedSwimmers: [] as string[] }
    }

    try {
        const saved = JSON.parse(localStorage.getItem(`swimflow_notification_settings_${meetId}`) ?? 'null') as Partial<{ heatEnabled?: boolean; heatLeadTime?: number | 'on-deck'; resultEnabled?: boolean; trackedSwimmers?: string[] }> | null
        const tracked = saved && Array.isArray(saved.trackedSwimmers) ? saved.trackedSwimmers : []
        return {
            heatEnabled: saved?.heatEnabled ?? true,
            heatLeadTime: normalizeHeatLeadTime(saved?.heatLeadTime ?? 'on-deck'),
            resultEnabled: saved?.resultEnabled ?? true,
            trackedSwimmers: tracked.map((value) => String(value).trim()).filter(Boolean),
        }
    } catch {
        return { heatEnabled: true, heatLeadTime: 'on-deck' as const, resultEnabled: true, trackedSwimmers: [] as string[] }
    }
}

export default function HeatAlertControls({ meetId, tone = 'dark', className, onInstallRequired }: { meetId: string; tone?: 'dark' | 'light'; className?: string; onInstallRequired?: () => void }) {
    const [enabled, setEnabled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [notificationSupported, setNotificationSupported] = useState(false)
    const [requesting, setRequesting] = useState(false)
    const [showInstallSheet, setShowInstallSheet] = useState(false)
    const [message, setMessage] = useState('')
    const storageKey = `swimflow-alerts:${meetId}`

    useEffect(() => {
        const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
        const notificationAvailable = 'Notification' in window
        const pushAvailable = 'PushManager' in window
        const supported = notificationAvailable && 'serviceWorker' in navigator && pushAvailable
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || Boolean(navigatorWithStandalone.standalone))
        setNotificationSupported(supported)
        const persisted = localStorage.getItem(storageKey) === 'enabled'
        setEnabled(persisted)
    }, [storageKey])

    const savePushSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription && vapidPublicKey) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: toApplicationServerKey(vapidPublicKey),
            })
        }
        if (!subscription) return false

        const settings = readNotificationSettings(meetId)
        const response = await fetch('/api/notifications/push-subscription', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                meetId,
                subscription: subscription.toJSON(),
                trackedSwimmers: settings.trackedSwimmers,
                heatEnabled: settings.heatEnabled,
                resultEnabled: settings.resultEnabled,
                heatLeadTime: settings.heatLeadTime,
            }),
        })
        return response.ok
    }

    const enableHeatAlerts = async () => {
        if (isIOS && !isStandalone) {
            if (onInstallRequired) {
                onInstallRequired()
                return
            }
            setShowInstallSheet(true)
            return
        }
        if (!notificationSupported) {
            setEnabled(false)
            setMessage('This browser does not support web push notifications. Open SwimFlow from a supported browser or from the installed app to receive heat alerts.')
            return
        }

        setRequesting(true)
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                setEnabled(false)
                localStorage.removeItem(storageKey)
                setMessage(permission === 'denied' ? 'Notifications are blocked in browser settings. You can try again after changing that setting.' : 'Heat alerts were not enabled. You can try again when ready.')
                return
            }

            const subscriptionSaved = await savePushSubscription()
            if (!subscriptionSaved) {
                setEnabled(false)
                localStorage.removeItem(storageKey)
                setMessage('This browser could not register a push subscription. Please open the app in a supported browser and try again.')
                return
            }

            localStorage.setItem(storageKey, 'enabled')
            setEnabled(true)
            setMessage('Heat alerts are enabled on this device.')
        } catch {
            setEnabled(false)
            localStorage.removeItem(storageKey)
            setMessage('Heat alerts could not be enabled. You can try again when ready.')
        } finally {
            setRequesting(false)
        }
    }

    return <div className={className ?? 'mt-5'}>
        {isIOS && !isStandalone && !onInstallRequired ? <p className="mb-3 rounded-lg border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-sm text-sky-100">Install SwimFlow from Safari for lock-screen heat alerts.</p> : null}
        <button type="button" onClick={() => void enableHeatAlerts()} disabled={requesting} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-sky-100 disabled:cursor-wait disabled:bg-slate-200">
            {requesting ? 'Enabling alerts...' : enabled ? 'Heat alerts enabled' : 'Enable Lock-Screen Heat Alerts'}
        </button>
        {message ? <p aria-live="polite" className={`mt-2 text-xs ${tone === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p> : null}
        {showInstallSheet ? <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Install SwimFlow for heat alerts"><div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900 shadow-xl"><h2 className="text-xl font-semibold">Enable lock-screen heat alerts</h2><p className="mt-3 text-sm leading-6 text-slate-600">To enable lock-screen heat alerts on iPhone, tap Share -&gt; Add to Home Screen. Open SwimFlow from your Home Screen, then tap Enable Heat Alerts.</p><button type="button" onClick={() => setShowInstallSheet(false)} className="mt-5 rounded-lg bg-[#003296] px-4 py-2 text-sm font-medium text-white hover:bg-[#002878]">Done</button></div></div> : null}
    </div>
}