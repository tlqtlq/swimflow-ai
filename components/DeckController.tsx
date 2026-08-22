'use client'

import { useState, useTransition } from 'react'
import { getClientPortalUrl } from '@/lib/app-url'

type EventOption = { id: string; name: string; course?: string | null }

export default function DeckController({ meetId, events, currentEventId, currentHeat, courseType }: { meetId: string; events: EventOption[]; currentEventId?: string | null; currentHeat: number; courseType: 'SCY' | 'LCM' | 'SCM' }) {
    const [eventId, setEventId] = useState(currentEventId ?? events[0]?.id ?? '')
    const [heat, setHeat] = useState(currentHeat || 1)
    const [course, setCourse] = useState(courseType)
    const [message, setMessage] = useState('')
    const [pending, startTransition] = useTransition()
    const save = (nextEventId = eventId, nextHeat = heat, nextCourse = course) => {
        startTransition(async () => {
            const response = await fetch('/api/meets/deck', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meetId, eventId: nextEventId, heatNumber: nextHeat, courseType: nextCourse }) })
            const result = await response.json()
            setMessage(response.ok ? 'Deck position updated.' : result.message ?? 'Unable to update deck position.')
        })
    }
    const advance = () => {
        const index = events.findIndex((event) => event.id === eventId)
        const nextEvent = events[index + 1]
        if (nextEvent) {
            setEventId(nextEvent.id)
            setHeat(1)
            save(nextEvent.id, 1)
        } else {
            setHeat((value) => value + 1)
            save(eventId, heat + 1)
        }
    }
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Live deck controller</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Starter / clerk console</h2></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.open(getClientPortalUrl(meetId), '_blank', 'noopener,noreferrer')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">Test Spectator View</button><button type="button" disabled={pending || !eventId} onClick={advance} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">Advance deck</button></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_9rem]">
            <label className="text-sm font-medium text-slate-700">Event #<select value={eventId} onChange={(event) => { setEventId(event.target.value); save(event.target.value, heat) }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{events.map((event, index) => <option key={event.id} value={event.id}>#{index + 1} {event.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Heat #<input type="number" min="1" value={heat} onChange={(event) => setHeat(Number(event.target.value))} onBlur={() => save(eventId, heat)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Course<select value={course} onChange={(event) => { const nextCourse = event.target.value as 'SCY' | 'LCM' | 'SCM'; setCourse(nextCourse); save(eventId, heat, nextCourse) }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option>SCY</option><option>LCM</option><option>SCM</option></select></label>
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">{message || 'Changes sync to the public spectator portal.'}</p>
    </section>
}
