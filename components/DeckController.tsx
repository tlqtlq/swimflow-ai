'use client'

import { useState, useTransition } from 'react'
import { getClientPortalUrl } from '@/lib/app-url'
import { saveEventResults, type ScoreInput } from '@/lib/actions/score-event'

type EventOption = { id: string; name: string; course?: string | null }
type EntryOption = { id: string; event_id: string; swimmer_name?: string | null; lane_number?: number | null; lane?: number | null; heat_number?: number | null; heat?: number | null; result_time?: string | null }

export default function DeckController({ meetId, events, entries = [], currentEventId, currentHeat, courseType }: { meetId: string; events: EventOption[]; entries?: EntryOption[]; currentEventId?: string | null; currentHeat: number; courseType: 'SCY' | 'LCM' | 'SCM' }) {
    const [eventId, setEventId] = useState(currentEventId ?? events[0]?.id ?? '')
    const [heat, setHeat] = useState(currentHeat || 1)
    const [course, setCourse] = useState(courseType)
    const [message, setMessage] = useState('')
    const [times, setTimes] = useState<Record<string, string>>(() => Object.fromEntries(entries.map((entry) => [entry.id, entry.result_time ?? ''])))
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
    const activeEntries = entries.filter((entry) => entry.event_id === eventId && (entry.heat_number ?? entry.heat ?? 1) === heat)
    const submitResults = () => {
        const inputs: ScoreInput[] = activeEntries.filter((entry) => times[entry.id]?.trim()).map((entry) => ({ entryId: entry.id, resultTime: times[entry.id] }))
        startTransition(async () => {
            try {
                const result = await saveEventResults(eventId, inputs)
                setMessage(`${result.saved} result${result.saved === 1 ? '' : 's'} submitted to spectators.`)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Unable to submit heat results.')
            }
        })
    }
    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Live deck controller</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Starter / clerk console</h2></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.open(getClientPortalUrl(meetId), '_blank', 'noopener,noreferrer')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">Test Spectator View</button><button type="button" disabled={pending || !eventId} onClick={advance} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-medium text-white hover:bg-[#002878] disabled:opacity-60">Advance deck</button></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_9rem]">
            <label className="text-sm font-medium text-slate-700">Event #<select value={eventId} onChange={(event) => { setEventId(event.target.value); save(event.target.value, heat) }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">{events.map((event, index) => <option key={event.id} value={event.id}>#{index + 1} {event.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Heat #<input type="number" min="1" value={heat} onChange={(event) => setHeat(Number(event.target.value))} onBlur={() => save(eventId, heat)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-700">Course<select value={course} onChange={(event) => { const nextCourse = event.target.value as 'SCY' | 'LCM' | 'SCM'; setCourse(nextCourse); save(eventId, heat, nextCourse) }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option>SCY</option><option>LCM</option><option>SCM</option></select></label>
        </div>
        {activeEntries.length > 0 ? <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Heat {heat} touch times</h3><button type="button" disabled={pending} onClick={submitResults} className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878] disabled:opacity-60">Submit Heat Results</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{activeEntries.map((entry) => <label key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"><span><strong>Lane {entry.lane_number ?? entry.lane ?? '-'}</strong> <span className="text-slate-500">{entry.swimmer_name ?? 'Swimmer'}</span></span><input inputMode="decimal" placeholder="48.52" value={times[entry.id] ?? ''} onChange={(event) => setTimes((current) => ({ ...current, [entry.id]: event.target.value }))} className="w-24 rounded border border-slate-300 px-2 py-1" /></label>)}</div></div> : null}
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">{message || 'Changes sync to the public spectator portal.'}</p>
    </section>
}
