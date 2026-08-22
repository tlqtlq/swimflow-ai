'use client'

import { useEffect, useState } from 'react'

type MeetDisplay = {
    name: string
    location: string | null
    date: string | null
    accentColor: string | null
}

export default function MeetDashboardHeader({ initialMeet, isLive }: { initialMeet: MeetDisplay; isLive: boolean }) {
    const [meet, setMeet] = useState(initialMeet)

    useEffect(() => {
        setMeet(initialMeet)
    }, [initialMeet])

    useEffect(() => {
        const updateMeet = (event: Event) => {
            const detail = (event as CustomEvent<Partial<MeetDisplay>>).detail
            setMeet((current) => ({ ...current, ...detail }))
        }

        window.addEventListener('meet-display-updated', updateMeet)
        return () => window.removeEventListener('meet-display-updated', updateMeet)
    }, [])

    return (
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" style={{ borderTop: `4px solid ${meet.accentColor ?? '#003296'}` }}>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Meet dashboard</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-900">{meet.name || 'Meet Details'}</h1>
                {isLive ? <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>Live</div> : null}
            </div>
            <p className="mt-2 text-slate-600">{meet.location || 'No location'} · {meet.date || 'No date'}</p>
        </header>
    )
}
