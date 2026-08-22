'use client'

import { useState, useTransition } from 'react'
import { saveEventResults, type ScoreInput } from '@/lib/actions/score-event'

type Entry = {
    id: string
    swimmer_name: string | null
    lane_number: number | null
    lane: number | null
    heat_number: number | null
    heat: number | null
    result_time: string | null
    place: number | null
}

export default function Scorekeeper({ eventId, eventName, entries }: { eventId: string; eventName: string; entries: Entry[] }) {
    const heats = [...new Set(entries.map((entry) => entry.heat_number ?? entry.heat ?? 1))].sort((a, b) => a - b)
    const [selectedHeat, setSelectedHeat] = useState(heats[0] ?? 1)
    const [times, setTimes] = useState<Record<string, string>>(
        Object.fromEntries(entries.map((entry) => [entry.id, entry.result_time ?? ''])),
    )
    const [message, setMessage] = useState('')
    const [isPending, startTransition] = useTransition()
    const heatEntries = entries.filter((entry) => (entry.heat_number ?? entry.heat ?? 1) === selectedHeat)
    const ranked = heatEntries
        .filter((entry) => times[entry.id]?.trim())
        .sort((a, b) => Number(times[a.id]) - Number(times[b.id]))

    const save = () => {
        setMessage('')
        const inputs: ScoreInput[] = entries
            .filter((entry) => times[entry.id]?.trim())
            .map((entry) => ({ entryId: entry.id, resultTime: times[entry.id] }))
        startTransition(async () => {
            try {
                const result = await saveEventResults(eventId, inputs)
                setMessage(`${result.saved} result${result.saved === 1 ? '' : 's'} saved.`)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Unable to save results.')
            }
        })
    }

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-sky-600">Deck scorekeeper</p>
                    <h1 className="mt-1 text-3xl font-semibold text-slate-900">{eventName}</h1>
                </div>
                <label className="text-sm font-medium text-slate-700">
                    Heat
                    <select value={selectedHeat} onChange={(event) => setSelectedHeat(Number(event.target.value))} className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                        {heats.map((heat) => <option key={heat} value={heat}>{heat}</option>)}
                    </select>
                </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[5rem_1fr_9rem_5rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Lane</span><span>Swimmer</span><span>Final time</span><span>Place</span>
                </div>
                {heatEntries.map((entry) => {
                    const place = ranked.findIndex((rankedEntry) => rankedEntry.id === entry.id)
                    return (
                        <div key={entry.id} className="grid grid-cols-[5rem_1fr_9rem_5rem] items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                            <span className="font-semibold text-slate-500">{entry.lane_number ?? entry.lane ?? '-'}</span>
                            <span className="font-medium text-slate-800">{entry.swimmer_name ?? 'Swimmer'}</span>
                            <input inputMode="decimal" placeholder="54.12" value={times[entry.id] ?? ''} onChange={(event) => setTimes((current) => ({ ...current, [entry.id]: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                            <span className="text-center text-lg font-semibold text-slate-700">{place >= 0 ? place + 1 : '-'}</span>
                        </div>
                    )
                })}
            </div>
            <div className="flex items-center justify-between gap-4">
                <p aria-live="polite" className="text-sm text-slate-600">{message}</p>
                <button type="button" onClick={save} disabled={isPending} className="rounded-xl bg-sky-600 px-5 py-3 font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {isPending ? 'Saving...' : 'Save official results'}
                </button>
            </div>
        </section>
    )
}
