'use client'

import { ChevronRight, Radio } from 'lucide-react'
import { useState } from 'react'

const heats = [
    { event: '200 Medley Relay', heat: 1, lanes: ['Northside Aquatics', 'Cedar Rapids Swim', 'Bluewater Club', 'Harbor Swim Team'] },
    { event: '100 Freestyle', heat: 2, lanes: ['Summit Swim Club', 'Metro Aquatics', 'Cedar Rapids Swim', 'Northside Aquatics'] },
    { event: '100 Breaststroke', heat: 3, lanes: ['Bluewater Club', 'Harbor Swim Team', 'Summit Swim Club', 'Metro Aquatics'] },
]

export default function LandingDeckDemo() {
    const [heatIndex, setHeatIndex] = useState(0)
    const heat = heats[heatIndex]

    const nextHeat = () => setHeatIndex((current) => (current + 1) % heats.length)

    return (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
                <p className="text-xs font-medium text-slate-400">deck.swimflow.ai/live</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400"><Radio size={13} /> LIVE</span>
            </div>
            <div className="grid lg:grid-cols-[11rem_1fr]">
                <aside className="border-b border-slate-800 bg-slate-900/70 p-4 lg:border-b-0 lg:border-r">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">On deck</p>
                    <div className="mt-4 space-y-3 text-sm"><p className="font-medium text-white">Event {heatIndex + 4}</p><p className="text-slate-400">Heat {heat.heat}</p><p className="text-slate-400">SCY</p></div>
                </aside>
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-400">Current heat</p><h3 className="mt-1 text-xl font-semibold text-white">{heat.event}</h3></div><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300">Heat {heat.heat}</span></div>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">{heat.lanes.map((team, index) => <div key={team} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-slate-300">{index + 2}</span><span className="text-sm font-medium text-slate-200">{team}</span></div>)}</div>
                    <button type="button" onClick={nextHeat} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-100">Next Heat <ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    )
}
