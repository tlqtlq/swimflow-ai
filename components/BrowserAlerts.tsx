'use client'

import { useEffect, useState } from 'react'

export default function BrowserAlerts({ meetId }: { meetId: string }) {
    const [enabled, setEnabled] = useState(false)
    const [message, setMessage] = useState('')

    const enable = async () => {
        if (!('Notification' in window)) {
            setMessage('Browser notifications are not supported here.')
            return
        }
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            setMessage('Notification permission was not granted.')
            return
        }
        localStorage.setItem(`swimflow-alerts:${meetId}`, '1')
        setEnabled(true)
        setMessage('Browser alerts enabled on this device.')
    }

    useEffect(() => {
        if (typeof window === 'undefined') return
        setEnabled(localStorage.getItem(`swimflow-alerts:${meetId}`) === '1')
        let latestId = ''
        const check = async () => {
            if (localStorage.getItem(`swimflow-alerts:${meetId}`) !== '1') return
            const response = await fetch(`/api/notifications/latest?meetId=${encodeURIComponent(meetId)}`, { cache: 'no-store' })
            if (!response.ok) return
            const announcement = await response.json()
            if (announcement?.id && announcement.id !== latestId) {
                latestId = announcement.id
                new Notification('SwimFlow.ai heat call', { body: announcement.message })
            }
        }
        const interval = window.setInterval(check, 5000)
        void check()
        return () => window.clearInterval(interval)
    }, [meetId])

    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Browser alerts</h2>
        <p className="mt-2 text-sm text-slate-600">Get free on-device alerts when a heat is called. No phone number or paid SMS provider is required.</p>
        <button type="button" onClick={enable} disabled={enabled} className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-default disabled:bg-emerald-600">
            {enabled ? 'Alerts enabled' : 'Enable browser alerts'}
        </button>
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">{message}</p>
    </div>
}
