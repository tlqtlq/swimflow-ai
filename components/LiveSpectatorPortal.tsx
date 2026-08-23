'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type EventRow = { id: string; name: string; course?: string | null }
type Entry = { id: string; event_id: string; lane_number?: number | null; lane?: number | null; swimmer_name?: string | null; heat_number?: number | null; heat?: number | null; seed_time?: string | null; result_time?: string | null; place?: number | null }
type RosterEntry = { id: string; event_name: string; swimmer_name: string; team_code?: string | null; seed_time?: string | null }

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
    const [activeEventId, setActiveEventId] = useState(currentEventId ?? events[0]?.id ?? '')
    const [activeHeat, setActiveHeat] = useState(currentHeat)
    const [course, setCourse] = useState(courseType)
    const [alertsEnabled, setAlertsEnabled] = useState(false)
    const [alertMessage, setAlertMessage] = useState('')
    const latestHeat = useRef(currentHeat)

    useEffect(() => {
        setDisplayName(meetName)
        setDisplayLocation(meetLocation)
        setDisplayDate(meetDate ?? '')
        setDisplayAccentColor(accentColor ?? '#003296')
    }, [meetName, meetLocation, meetDate, accentColor])

    useEffect(() => {
        if (typeof window === 'undefined') return
        latestHeat.current = currentHeat
        setAlertsEnabled('Notification' in window && Notification.permission === 'granted')
    }, [currentHeat])

    const enableHeatAlerts = async () => {
        if (!('Notification' in window)) {
            setAlertMessage('Browser notifications are not supported here.')
            return
        }
        const permission = await Notification.requestPermission()
        setAlertsEnabled(permission === 'granted')
        setAlertMessage(permission === 'granted' ? 'Heat alerts are enabled on this device.' : 'Notification permission was not granted.')
    }

    useEffect(() => {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return
        const channel = supabase.channel(`meet-${meetId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meets', filter: `id=eq.${meetId}` }, (payload) => {
                const next = payload.new as { current_event_id?: string | null; current_heat_number?: number; current_heat?: number; course_type?: string; name?: string; location?: string | null; meet_date?: string | null; accent_color?: string | null; primary_color?: string | null }
                if (next.current_event_id) setActiveEventId(next.current_event_id)
                const nextHeat = next.current_heat ?? next.current_heat_number
                if (nextHeat) {
                    if (nextHeat > latestHeat.current && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('Heat Alert', { body: `Heat ${nextHeat} is now on deck!` })
                    }
                    latestHeat.current = nextHeat
                    setActiveHeat(nextHeat)
                }
                if (next.course_type) setCourse(next.course_type)
                if (next.name) setDisplayName(next.name)
                if (next.location !== undefined) setDisplayLocation(next.location || 'Venue to be announced')
                if (next.meet_date !== undefined) setDisplayDate(next.meet_date || '')
                if (next.accent_color || next.primary_color) setDisplayAccentColor(next.accent_color ?? next.primary_color ?? '#003296')
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_entries', filter: `event_id=in.(${events.map((event) => event.id).join(',')})` }, (payload) => {
                if (payload.eventType === 'DELETE') setEntries((current) => current.filter((entry) => entry.id !== payload.old.id))
                else setEntries((current) => current.some((entry) => entry.id === payload.new.id) ? current.map((entry) => entry.id === payload.new.id ? payload.new as Entry : entry) : [...current, payload.new as Entry])
            })
            .subscribe()
        return () => { void supabase.removeChannel(channel) }
    }, [meetId, events])

    const eventCards = events.filter((event) => event.id === activeEventId).map((event) => {
        const eventEntries = entries.filter((entry) => entry.event_id === event.id)
        const heatNumbers = [activeHeat]
        return { event, eventEntries, heatNumbers }
    })
    const rosterByEvent = rosterEntries.reduce<Record<string, RosterEntry[]>>((groups, entry) => {
        const eventName = entry.event_name || 'Unassigned event'
        groups[eventName] = [...(groups[eventName] ?? []), entry]
        return groups
    }, {})
    return <div className="space-y-6">
        <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-8 text-white shadow-2xl" style={{ borderTopColor: displayAccentColor, borderTopWidth: 4 }}><div className="relative"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Live spectator portal</p><h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{displayName}</h1></div><div className="flex items-center gap-2"><span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-sm font-medium text-sky-200">{course}</span><div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>Live</div></div></div><p className="mt-5 text-slate-300">{displayLocation}{displayDate ? ` · ${displayDate}` : ''}{locationAddress ? <> · <a className="text-sky-300 underline decoration-sky-500/60 underline-offset-2" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}`} target="_blank" rel="noreferrer">View on Google Maps</a></> : null}</p><p className="mt-2 text-sm text-slate-400">Heat order, lane assignments, and official results in one live view.</p><div className="mt-5"><button type="button" onClick={enableHeatAlerts} disabled={alertsEnabled} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-100 disabled:cursor-default disabled:bg-emerald-300">{alertsEnabled ? 'Heat alerts enabled' : 'Enable Heat Alerts'}</button>{alertMessage ? <p aria-live="polite" className="mt-2 text-xs text-slate-300">{alertMessage}</p> : null}</div></div></header>
        {events.length > 1 ? <nav aria-label="Meet events" className="flex gap-2 overflow-x-auto pb-1">{events.map((event, index) => <button type="button" key={event.id} onClick={() => setActiveEventId(event.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${event.id === activeEventId ? 'bg-[#003296] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>Event {index + 1}: {event.name}</button>)}</nav> : null}
        <section className="space-y-4">{eventCards.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No events are available yet.</div> : eventCards.map(({ event, eventEntries, heatNumbers }) => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{event.course ?? 'SCY'}</p><h2 className="text-xl font-semibold text-slate-900">{event.name}</h2></div><span className="text-sm text-slate-500">{heatNumbers.length} heat{heatNumbers.length === 1 ? '' : 's'}</span></div><div className="mt-4 grid gap-4 md:grid-cols-2">{heatNumbers.map((heat) => <div key={`${event.id}-${heat}`} className="rounded-xl border border-slate-200"><div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">Heat {heat}</div><div className="divide-y divide-slate-100">{eventEntries.filter((entry) => (entry.heat_number ?? entry.heat ?? 1) === heat).map((entry) => <div key={entry.id} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 px-4 py-3"><span className="text-sm font-semibold text-slate-500">L{entry.lane_number ?? entry.lane ?? '-'}</span><span className="font-medium text-slate-800">{entry.swimmer_name ?? 'Swimmer'}</span><span className="text-right text-sm text-slate-500">{entry.result_time ?? entry.seed_time ?? '-'}{entry.place ? ` · ${entry.place}` : ''}</span></div>)}</div></div>)}</div></article>)}</section>
        {Object.keys(rosterByEvent).length > 0 ? <section className="space-y-3"><h2 className="text-xl font-semibold text-slate-900">Roster by event</h2>{Object.entries(rosterByEvent).map(([eventName, eventRoster]) => <details key={eventName} className="rounded-xl border border-slate-200 bg-white p-4" open><summary className="cursor-pointer font-semibold text-slate-900">{eventName} <span className="ml-2 text-sm font-normal text-slate-500">{eventRoster.length} swimmer{eventRoster.length === 1 ? '' : 's'}</span></summary><div className="mt-3 divide-y divide-slate-100">{eventRoster.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="font-medium text-slate-800">{entry.swimmer_name}</span><span className="text-right text-slate-500">{entry.team_code ?? ''}{entry.team_code && entry.seed_time ? ' · ' : ''}{entry.seed_time ?? ''}</span></div>)}</div></details>)}</section> : null}
    </div>
}
