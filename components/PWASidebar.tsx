'use client'

import {
    Bell,
    ChevronLeft,
    Home,
    Search,
    X,
} from 'lucide-react'
import { useMemo, useState } from 'react'

export type HeatLeadTime = 'on-deck' | 1 | 2 | 3 | 4 | 5

export type NotificationSettings = {
    heatEnabled: boolean
    heatLeadTime: HeatLeadTime
    resultEnabled: boolean
    trackedSwimmers: string[]
}

const notificationKey = (meetId: string) => `swimflow_notification_settings_${meetId}`

const normalizeHeatLeadTime = (value: unknown): HeatLeadTime => {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) return value as 1 | 2 | 3 | 4 | 5
    return 'on-deck'
}

const readSettings = (meetId: string): NotificationSettings => {
    if (typeof window === 'undefined') {
        return {
            heatEnabled: false,
            heatLeadTime: 'on-deck',
            resultEnabled: false,
            trackedSwimmers: [],
        }
    }

    const permission = 'Notification' in window ? Notification.permission : 'default'
    if (permission !== 'granted') {
        return {
            heatEnabled: false,
            heatLeadTime: 'on-deck',
            resultEnabled: false,
            trackedSwimmers: [],
        }
    }

    try {
        const saved = JSON.parse(localStorage.getItem(notificationKey(meetId)) ?? 'null') as Partial<NotificationSettings> | null
        const trackedList = saved && Array.isArray(saved.trackedSwimmers) ? saved.trackedSwimmers : []

        return {
            heatEnabled: saved?.heatEnabled ?? false,
            heatLeadTime: normalizeHeatLeadTime(saved?.heatLeadTime ?? 'on-deck'),
            resultEnabled: saved?.resultEnabled ?? false,
            trackedSwimmers: trackedList.map((value) => String(value).trim()).filter(Boolean),
        }
    } catch {
        return {
            heatEnabled: false,
            heatLeadTime: 'on-deck',
            resultEnabled: false,
            trackedSwimmers: [],
        }
    }
}

export default function PWASidebar({ meetId, rosterNames, open, onClose }: { meetId: string; rosterNames: string[]; open: boolean; onClose: () => void }) {
    const [view, setView] = useState<'main' | 'notifications'>('main')
    const [settings, setSettings] = useState<NotificationSettings>(() => readSettings(meetId))
    const [search, setSearch] = useState('')

    const filteredNames = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return []
        const seen = new Set<string>()
        return rosterNames
            .filter((name) => !settings.trackedSwimmers.includes(name))
            .filter((name) => {
                const normalized = name.toLowerCase()
                if (seen.has(name)) return false
                seen.add(name)
                return normalized.startsWith(query)
            })
            .slice(0, 6)
    }, [rosterNames, search, settings.trackedSwimmers])

    const persist = (next: NotificationSettings) => {
        setSettings(next)
        localStorage.setItem(notificationKey(meetId), JSON.stringify(next))
    }

    const requestNotifications = async (next: NotificationSettings) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false
        if (Notification.permission === 'denied') return false

        const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
        if (permission !== 'granted') return false

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()

        if (!subscription) {
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            if (!vapidPublicKey) return false

            const padded = `${vapidPublicKey}${'='.repeat((4 - vapidPublicKey.length % 4) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
            const raw = window.atob(padded)
            const applicationServerKey = Uint8Array.from(raw, (character) => character.charCodeAt(0))
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            })
        }

        if (!subscription) return false

        const response = await fetch('/api/notifications/push-subscription', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                meetId,
                subscription: subscription.toJSON(),
                trackedSwimmers: next.trackedSwimmers,
                heatEnabled: next.heatEnabled,
                resultEnabled: next.resultEnabled,
                heatLeadTime: next.heatLeadTime,
            }),
        })

        return response.ok
    }

    const enableHeatNotifications = async () => {
        const next = { ...settings, heatEnabled: !settings.heatEnabled }
        persist(next)

        if (!next.heatEnabled) return

        const granted = await requestNotifications(next)
        if (!granted) {
            persist({ ...next, heatEnabled: false })
        }
    }

    const enableResultNotifications = async () => {
        const next = { ...settings, resultEnabled: !settings.resultEnabled }
        persist(next)

        if (!next.resultEnabled) return

        const granted = await requestNotifications(next)
        if (!granted) {
            persist({ ...next, resultEnabled: false })
        }
    }

    const addTrackedSwimmer = () => {
        const value = search.trim()
        if (!value) return
        const next = {
            ...settings,
            trackedSwimmers: Array.from(new Set([...settings.trackedSwimmers, value])),
        }
        persist(next)
        setSearch('')
    }

    const removeTrackedSwimmer = (name: string) => {
        const next = {
            ...settings,
            trackedSwimmers: settings.trackedSwimmers.filter((tracked) => tracked !== name),
        }
        persist(next)
    }

    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-40 bg-slate-950/35" onClick={onClose} />
            <aside className="fixed inset-0 z-50 w-full max-w-none border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200">
                {view === 'main' ? (
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                            <button type="button" aria-label="Close menu" onClick={onClose} className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                                <X size={18} />
                            </button>
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Menu</span>
                        </div>

                        <div className="flex-1 px-3 py-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                                <Home size={16} className="text-slate-400" />
                                <span>Home</span>
                            </button>

                            <div className="my-3 border-b border-slate-200" />

                            <button
                                type="button"
                                onClick={() => setView('notifications')}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                                <Bell size={16} className="text-slate-400" />
                                <span>Notifications</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-full flex-col bg-slate-50">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
                            <button type="button" aria-label="Back to menu" onClick={() => setView('main')} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
                                <ChevronLeft size={18} />
                                <span>Back</span>
                            </button>
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Alerts</span>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heat Notifications</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Toggle heat notifications"
                                        onClick={() => void enableHeatNotifications()}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.heatEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.heatEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {settings.heatEnabled ? (
                                    <div className="mt-4 space-y-3">
                                        <label className="block text-sm text-slate-700">
                                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Alert timing</span>
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                <span className="whitespace-nowrap text-sm text-slate-700">Alert me</span>
                                                <select
                                                    value={settings.heatLeadTime === 'on-deck' ? 'on-deck' : String(settings.heatLeadTime)}
                                                    onChange={(event) => {
                                                        const nextValue = event.target.value
                                                        persist({ ...settings, heatLeadTime: nextValue === 'on-deck' ? 'on-deck' : (Number(nextValue) as 1 | 2 | 3 | 4 | 5) })
                                                    }}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
                                                >
                                                    {[1, 2, 3, 4, 5].map((leadTime) => (
                                                        <option key={leadTime} value={String(leadTime)}>{leadTime}</option>
                                                    ))}
                                                    <option value="on-deck">On Deck</option>
                                                </select>
                                                <span className="whitespace-nowrap text-sm text-slate-700">heats before</span>
                                            </div>
                                        </label>
                                    </div>
                                ) : null}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Swimmer Result Notifications</p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Toggle swimmer result notifications"
                                        onClick={() => void enableResultNotifications()}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.resultEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.resultEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {settings.resultEnabled ? (
                                    <div className="mt-4 space-y-3">
                                        <div className="relative">
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                                <Search size={14} className="text-slate-400" />
                                                <input
                                                    value={search}
                                                    onChange={(event) => setSearch(event.target.value)}
                                                    placeholder="Add swimmer name to track..."
                                                    className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                                />
                                            </div>
                                            {search.trim() && filteredNames.length > 0 ? (
                                                <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                                    {filteredNames.map((name) => (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            onMouseDown={(event) => event.preventDefault()}
                                                            onClick={() => {
                                                                setSearch(name)
                                                                const next = { ...settings, trackedSwimmers: Array.from(new Set([...settings.trackedSwimmers, name])) }
                                                                persist(next)
                                                                setSearch('')
                                                            }}
                                                            className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 last:border-b-0 hover:bg-slate-50"
                                                        >
                                                            {name}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex gap-2">
                                            <button type="button" onClick={addTrackedSwimmer} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                                                Add
                                            </button>
                                        </div>

                                        {settings.trackedSwimmers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {settings.trackedSwimmers.map((name) => (
                                                    <span key={name} className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800">
                                                        {name}
                                                        <button type="button" aria-label={`Remove ${name}`} onClick={() => removeTrackedSwimmer(name)} className="text-sky-700 hover:text-sky-900">✕</button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500">No swimmers tracked yet.</p>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    )
}
