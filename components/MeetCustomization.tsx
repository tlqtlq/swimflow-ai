'use client'

import { CheckCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function MeetCustomization({ meetId, name, location, date, accentColor }: { meetId: string; name: string; location?: string | null; date?: string | null; accentColor?: string | null }) {
    const [meetName, setMeetName] = useState(name)
    const [meetDate, setMeetDate] = useState(date ?? '')
    const [meetLocation, setMeetLocation] = useState(location ?? '')
    const [color, setColor] = useState(accentColor ?? '#003296')
    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)
    useEffect(() => {
        if (!message) return
        const timer = window.setTimeout(() => setMessage(''), 4000)
        return () => window.clearTimeout(timer)
    }, [message])
    const save = async () => {
        setSaving(true)
        const response = await fetch('/api/meets/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meetId, meetName, meetDate, meetLocation, accentColor: color }) })
        const result = await response.json()
        setMessage(response.ok ? 'Meet settings saved.' : result.message ?? 'Unable to save meet settings.')
        setSaving(false)
    }
    return <><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Director settings</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Customize meet</h2></div><button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#002878] disabled:opacity-60">{saving ? 'Saving...' : 'Save Meet Settings'}</button></div><div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_12rem_8rem]"><label className="text-sm font-medium text-slate-700">Meet title<input value={meetName} onChange={(event) => setMeetName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Location<input value={meetLocation} onChange={(event) => setMeetLocation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Start date<input type="date" value={meetDate} onChange={(event) => setMeetDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Accent color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" /></label></div></section>{message ? <div role="status" className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-lg bg-emerald-600 p-4 font-bold text-white shadow-xl"><CheckCircle aria-hidden="true" size={22} /><span>{message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')} className="ml-auto"><X aria-hidden="true" size={18} /></button></div> : null}</>
}
