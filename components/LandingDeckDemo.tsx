'use client'

import { useState } from 'react'

const heats = [
    {
        eventNumber: 12,
        eventName: 'Girls 50 Yard Freestyle',
        heat: 3,
        lanes: [
            { lane: 1, swimmer: 'M. Evans', team: 'NPA', seed: '25.98' },
            { lane: 2, swimmer: 'R. Kim', team: 'RBC', seed: '25.70' },
            { lane: 3, swimmer: 'S. Brooks', team: 'LAC', seed: '25.86' },
            { lane: 4, swimmer: 'T. Lewis', team: 'CSD', seed: '25.92' },
            { lane: 5, swimmer: 'J. Wu', team: 'MTS', seed: '25.81' },
            { lane: 6, swimmer: 'A. Patel', team: 'NWS', seed: '25.76' },
            { lane: 7, swimmer: 'L. Diaz', team: 'BSC', seed: '25.95' },
            { lane: 8, swimmer: 'K. Allen', team: 'CVA', seed: '26.02' },
        ],
    },
    {
        eventNumber: 13,
        eventName: 'Boys 100 Yard Butterfly',
        heat: 2,
        lanes: [
            { lane: 1, swimmer: 'A. Hall', team: 'RBC', seed: '58.22' },
            { lane: 2, swimmer: 'J. Ross', team: 'NPA', seed: '57.65' },
            { lane: 3, swimmer: 'E. Flores', team: 'LAC', seed: '58.44' },
            { lane: 4, swimmer: 'M. Shah', team: 'MTS', seed: '57.93' },
            { lane: 5, swimmer: 'N. Cole', team: 'CVA', seed: '58.01' },
            { lane: 6, swimmer: 'D. Hughes', team: 'BSC', seed: '57.80' },
            { lane: 7, swimmer: 'T. Smith', team: 'CSD', seed: '58.18' },
            { lane: 8, swimmer: 'P. Adams', team: 'NWS', seed: '58.60' },
        ],
    },
]

export default function LandingDeckDemo() {
    const [heatIndex, setHeatIndex] = useState(0)
    const heat = heats[heatIndex]

    return (
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100 shadow-[0_25px_60px_rgba(15,23,42,0.18)]">
            <div className="relative h-36 w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_35%),linear-gradient(135deg,#0f172a,#111827_35%,#020617)]">
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 text-white">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200">Live results</p>
                        <h3 className="mt-1 text-lg font-black leading-none">Northside Invite</h3>
                        <p className="mt-1 text-xs text-slate-200">Lakeview Aquatic Center</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/80 bg-red-500/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-100"><span aria-hidden="true">🔴</span> LIVE</span>
                </div>
            </div>

            <div className="bg-slate-100 px-4 pb-4 pt-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Current event</p>
                            <h4 className="mt-1 text-lg font-black text-slate-950">Event {heat.eventNumber} — {heat.eventName}</h4>
                        </div>
                        <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">SCY</div>
                    </div>
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"><span className="font-bold text-slate-950">Heat {heat.heat} of 8</span> · On deck</div>
                </div>

                <div className="mt-4 space-y-2">
                    {heat.lanes.map((lane) => (
                        <div key={`${lane.lane}-${lane.swimmer}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-base font-black text-white">{lane.lane}</div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Lane {lane.lane}</p>
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{lane.seed}</span>
                                </div>
                                <p className="mt-1 truncate text-base font-bold text-slate-900">{lane.team}</p>
                                <p className="truncate text-sm text-slate-500">{lane.swimmer}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" onClick={() => setHeatIndex((current) => (current + 1) % heats.length)} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Next Heat</button>
            </div>
        </div>
    )
}
