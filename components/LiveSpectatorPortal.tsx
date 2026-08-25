'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import HeatAlertControls from '@/components/HeatAlertControls'

type EventRow = { id: string; name: string; course?: string | null }
type Entry = { id: string; event_id: string; lane_number?: number | null; lane?: number | null; swimmer_name?: string | null; team_code?: string | null; heat_number?: number | null; heat?: number | null; seed_time?: string | null; result_time?: string | null; place?: number | null }
type RosterEntry = { id: string; event_name: string; swimmer_name: string; team_code?: string | null; seed_time?: string | null }
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> }

const getSupabaseBrowserClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
}

export default function LiveSpectatorPortal({ meetId, meetName, meetLocation, meetDate, accentColor, locationAddress, events, initialEntries, rosterEntries, currentEventId, currentHeat, courseType }: { meetId: string; meetName: string; meetLocation: string; meetDate?: string | null; accentColor?: string | null; locationAddress?: string | null; events: EventRow[]; initialEntries: Entry[]; rosterEntries: RosterEntry[]; currentEventId?: string | null; currentHeat: number; courseType: string }) {
    const [entries, setEntries] = useState(initialEntries)
    const [displayName, setDisplayName] = useState(meetName)
    const [displayLocation, setDisplayLocation] = useState(meetLocation)
    const [displayDate, setDisplayDate] = useState(meetDate ?? '')
    const [displayAccentColor, setDisplayAccentColor] = useState(accentColor ?? '#003296')
    const [activeEventId, setActiveEventId] = useState(currentEventId ?? '')
    const [activeHeat, setActiveHeat] = useState(currentHeat)
    const [course, setCourse] = useState(courseType)
    const [showInstallDrawer, setShowInstallDrawer] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [installMessage, setInstallMessage] = useState('')
    const latestHeat = useRef(currentHeat)
    const latestDeckEventId = useRef(currentEventId ?? '')

    useEffect(() => {
        setDisplayName(meetName)
        setDisplayLocation(meetLocation)
        setDisplayDate(meetDate ?? '')
        setDisplayAccentColor(accentColor ?? '#003296')
    }, [meetName, meetLocation, meetDate, accentColor])

    useEffect(() => {
        const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(navigatorWithStandalone.standalone)
        if (isStandalone) return

        const userAgent = navigator.userAgent
        const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent)
        setIsIOS(isIOSDevice)
        setShowInstallDrawer(true)

        const captureInstallPrompt = (event: Event) => {
            event.preventDefault()
            setDeferredInstallPrompt(event as BeforeInstallPromptEvent)
        }
        const closeInstallDrawer = () => {
            setDeferredInstallPrompt(null)
            setShowInstallDrawer(false)
        }
        window.addEventListener('beforeinstallprompt', captureInstallPrompt)
        window.addEventListener('appinstalled', closeInstallDrawer)
        return () => {
            window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
            window.removeEventListener('appinstalled', closeInstallDrawer)
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        latestHeat.current = currentHeat
        latestDeckEventId.current = currentEventId ?? ''
    }, [currentEventId, currentHeat, events])

    useEffect(() => {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return
        const channel = supabase.channel(`schema-db-changes-${meetId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meets', filter: `id=eq.${meetId}` }, (payload) => {
                const updatedMeet = payload.new as { current_event_id?: string | null; current_heat_number?: number; current_heat?: number; course_type?: string; name?: string; location?: string | null; meet_date?: string | null; accent_color?: string | null; primary_color?: string | null }
                const nextEventId = updatedMeet.current_event_id ?? latestDeckEventId.current
                const nextHeat = updatedMeet.current_heat ?? updatedMeet.current_heat_number
                const eventChanged = Boolean(updatedMeet.current_event_id && updatedMeet.current_event_id !== latestDeckEventId.current)
                const heatChanged = typeof nextHeat === 'number' && nextHeat !== latestHeat.current
                if (updatedMeet.current_event_id) {
                    latestDeckEventId.current = updatedMeet.current_event_id
                    setActiveEventId(updatedMeet.current_event_id)
                }
                if (typeof nextHeat === 'number') {
                    latestHeat.current = nextHeat
                    setActiveHeat(nextHeat)
                }
                if ((eventChanged || heatChanged) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    const eventIndex = events.findIndex((event) => event.id === nextEventId)
                    const eventLabel = eventIndex >= 0 ? `Event ${eventIndex + 1}` : 'Event'
                    new Notification('SwimFlow Heat Alert', { body: `${eventLabel} - Heat ${nextHeat ?? latestHeat.current} is now ON DECK!`, icon: '/logo.png' })
                }
                if (updatedMeet.course_type) setCourse(updatedMeet.course_type)
                if (updatedMeet.name) setDisplayName(updatedMeet.name)
                if (updatedMeet.location !== undefined) setDisplayLocation(updatedMeet.location || 'Venue to be announced')
                if (updatedMeet.meet_date !== undefined) setDisplayDate(updatedMeet.meet_date || '')
                if (updatedMeet.accent_color || updatedMeet.primary_color) setDisplayAccentColor(updatedMeet.accent_color ?? updatedMeet.primary_color ?? '#003296')
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Meet Realtime subscription failed:', status)
            })
        return () => { void supabase.removeChannel(channel) }
    }, [meetId, events])

    const eventFilter = events.map((event) => event.id).join(',')
    useEffect(() => {
        if (!eventFilter) return
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return
        const channel = supabase.channel(`meet-entry-changes-${meetId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_entries', filter: `event_id=in.(${eventFilter})` }, (payload) => {
                if (payload.eventType === 'DELETE') setEntries((current) => current.filter((entry) => entry.id !== payload.old.id))
                else setEntries((current) => current.some((entry) => entry.id === payload.new.id) ? current.map((entry) => entry.id === payload.new.id ? payload.new as Entry : entry) : [...current, payload.new as Entry])
            })
            .subscribe()
        return () => { void supabase.removeChannel(channel) }
    }, [eventFilter, meetId])

    const activeEventIndex = events.findIndex((event) => event.id === activeEventId)
    const activeEvent = activeEventIndex >= 0 ? events[activeEventIndex] : null
    const eventTitle = activeEvent?.name ?? 'No event on deck'
    const activeHeatEntries = entries
        .filter((entry) => entry.event_id === activeEventId && (entry.heat_number ?? entry.heat ?? 1) === activeHeat)
        .sort((firstEntry, secondEntry) => (firstEntry.lane_number ?? firstEntry.lane ?? Number.MAX_SAFE_INTEGER) - (secondEntry.lane_number ?? secondEntry.lane ?? Number.MAX_SAFE_INTEGER))
    const lanes = Array.from({ length: 8 }, (_, index) => index + 1)
    const entryByLane = new Map(activeHeatEntries.map((entry) => [entry.lane_number ?? entry.lane, entry]))
    const installSwimFlow = async () => {
        if (!deferredInstallPrompt) return

        try {
            await deferredInstallPrompt.prompt()
            const choice = await deferredInstallPrompt.userChoice
            setDeferredInstallPrompt(null)
            if (choice.outcome === 'accepted') setShowInstallDrawer(false)
            else setInstallMessage('Installation was not completed. You can continue in the browser.')
        } catch {
            setInstallMessage('Installation could not be started. You can continue in the browser.')
        }
    }
    const handleInstallClick = () => {
        if (!deferredInstallPrompt) {
            setInstallMessage('Installation is not available from this browser. Use its install option to add SwimFlow to your home screen.')
            return
        }
        void installSwimFlow()
    }

    return <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex min-w-0 items-center gap-3">
                <Image src="/logo.png" alt="SwimFlow" width={160} height={32} className="h-7 w-auto object-contain" priority />
                <div className="min-w-0 border-l border-slate-200 pl-3">
                    <h1 className="truncate text-base font-semibold text-slate-950">{displayName} <span className="text-slate-400">&#8226;</span> {displayLocation}</h1>
                    {displayDate ? <p className="mt-0.5 text-sm text-slate-500">{displayDate}</p> : null}
                </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"><span aria-hidden="true">🔴</span> LIVE</span>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl" style={{ borderTopColor: displayAccentColor, borderTopWidth: 3 }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">On deck</p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{eventTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-100">Heat {activeHeat}</span>
                    <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-semibold text-sky-200">{activeEvent?.course ?? course}</span>
                </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {lanes.map((lane) => {
                    const entry = entryByLane.get(lane)
                    return <div key={lane} className={`flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 ${entry ? 'border-slate-800 bg-slate-950/60' : 'border-slate-800/80 bg-slate-950/30'}`}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-sky-200">{lane}</span>
                        <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Lane {lane}</p><p className={`truncate text-sm font-semibold ${entry ? 'text-white' : 'text-slate-500'}`}>{entry?.team_code ?? entry?.swimmer_name ?? 'Awaiting assignment'}</p>{entry?.team_code && entry.swimmer_name ? <p className="truncate text-sm text-slate-400">{entry.swimmer_name}</p> : null}</div>
                    </div>
                })}
            </div>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
                <p className="text-sm font-medium text-slate-300">Heat alerts</p>
                <HeatAlertControls meetId={meetId} className="shrink-0" onInstallRequired={() => setShowInstallDrawer(true)} />
            </footer>
        </section>

        {showInstallDrawer ? <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="install-swimflow-title">
            <div className="w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl sm:rounded-2xl" style={{ animation: 'portal-install-drawer 240ms ease-out' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">SwimFlow</p>
                <h2 id="install-swimflow-title" className="mt-2 text-xl font-semibold">Get Live Heat Alerts on Your Lock Screen</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Install SwimFlow to receive instant alerts when your swimmer is on deck.</p>
                <div className="mt-5">
                    {isIOS ? (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">To enable live lock-screen alerts on iPhone:</p>
                            <ol className="list-inside list-decimal space-y-1">
                                <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari.</li>
                                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                                <li>Open SwimFlow from your home screen!</li>
                            </ol>
                            <p className="pt-1 text-xs text-slate-500">*If opened from Camera QR scan, tap the Safari/Compass icon in the bottom right first.</p>
                        </div>
                    ) : (
                        <button type="button" onClick={handleInstallClick} className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition-all hover:bg-slate-800">
                            Install App Now
                        </button>
                    )}
                </div>
                {installMessage ? <p aria-live="polite" className="mt-3 text-sm text-slate-600">{installMessage}</p> : null}
                <button type="button" onClick={() => setShowInstallDrawer(false)} className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Continue in Browser</button>
            </div>
            <style jsx>{`@keyframes portal-install-drawer { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div> : null}
    </div>
}
