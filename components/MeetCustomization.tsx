'use client'

import { CheckCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function MeetCustomization({ meetId, name, location, date, accentColor }: { meetId: string; name: string; location?: string | null; date?: string | null; accentColor?: string | null }) {
    const router = useRouter()
    const [meetName, setMeetName] = useState(name)
    const [meetDate, setMeetDate] = useState(date ?? '')
    const [meetLocation, setMeetLocation] = useState(location ?? '')
    const [color, setColor] = useState(accentColor ?? '#003296')
    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)
    const saveTimer = useRef<number | null>(null)
    const latestSaveId = useRef(0)
    const savedDraft = useRef({ name, location: location ?? '', date: date ?? '', accentColor: accentColor ?? '#003296' })

    useEffect(() => {
        const incomingDraft = { name, location: location ?? '', date: date ?? '', accentColor: accentColor ?? '#003296' }
        if (latestSaveId.current && JSON.stringify(incomingDraft) !== JSON.stringify(savedDraft.current)) return
        setMeetName(name)
        setMeetDate(date ?? '')
        setMeetLocation(location ?? '')
        setColor(accentColor ?? '#003296')
        savedDraft.current = incomingDraft
    }, [name, date, location, accentColor])

    useEffect(() => {
        if (!message) return
        const timer = window.setTimeout(() => setMessage(''), 4000)
        return () => window.clearTimeout(timer)
    }, [message])

    const publishDraft = (draft: { name: string; location: string; date: string; accentColor: string }) => {
        window.dispatchEvent(new CustomEvent('meet-display-updated', { detail: draft }))
    }

    const save = async (draft = { name: meetName, location: meetLocation, date: meetDate, accentColor: color }, showMessage = true) => {
        const saveId = ++latestSaveId.current
        setSaving(true)
        try {
            const response = await fetch('/api/meets/settings', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    meetId,
                    meetName: draft.name,
                    title: draft.name,
                    meetDate: draft.date,
                    meetLocation: draft.location,
                    accentColor: draft.accentColor,
                    primaryColor: draft.accentColor,
                }),
            })
            const result = await response.json() as { message?: string; meet?: { name?: string; location?: string | null; meetDate?: string | null; accentColor?: string | null } }
            if (saveId !== latestSaveId.current) return
            if (showMessage || !response.ok) setMessage(response.ok ? 'Meet settings saved.' : result.message ?? 'Unable to save meet settings.')
            if (response.ok) {
                const acknowledgedDraft = { name: result.meet?.name ?? draft.name, location: result.meet?.location ?? draft.location, date: result.meet?.meetDate ?? draft.date, accentColor: result.meet?.accentColor ?? draft.accentColor }
                savedDraft.current = acknowledgedDraft
                publishDraft(acknowledgedDraft)
            }
        } catch {
            setMessage('Unable to save meet settings.')
        } finally {
            if (saveId === latestSaveId.current) setSaving(false)
        }
    }

    const queueSave = (draft: { name: string; location: string; date: string; accentColor: string }) => {
        publishDraft(draft)
        if (saveTimer.current) window.clearTimeout(saveTimer.current)
        latestSaveId.current += 1
        saveTimer.current = window.setTimeout(() => void save(draft, false), 350)
    }

    useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current) }, [])

    return (
        <>
            <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Director settings</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">Customize meet</h2>
                    </div>
                    <button type="button" disabled={saving} onClick={() => void save()} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#002878] disabled:opacity-60">{saving ? 'Saving...' : 'Save Meet Settings'}</button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_12rem_8rem]">
                    <label className="text-sm font-medium text-slate-700">Meet title<input value={meetName} onChange={(event) => { const name = event.target.value; setMeetName(name); queueSave({ name, location: meetLocation, date: meetDate, accentColor: color }) }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Location<input value={meetLocation} onChange={(event) => { const location = event.target.value; setMeetLocation(location); queueSave({ name: meetName, location, date: meetDate, accentColor: color }) }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Start date<input type="date" value={meetDate} onChange={(event) => { const date = event.target.value; setMeetDate(date); queueSave({ name: meetName, location: meetLocation, date, accentColor: color }) }} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                    <label className="text-sm font-medium text-slate-700">Accent color<input type="color" value={color} onChange={(event) => { const accentColor = event.target.value; setColor(accentColor); queueSave({ name: meetName, location: meetLocation, date: meetDate, accentColor }) }} className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1" /></label>
                </div>
            </section>
            {message ? (
                <div role="status" className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-lg bg-emerald-600 p-4 font-bold text-white shadow-xl">
                    <CheckCircle aria-hidden="true" size={22} />
                    <span>{message}</span>
                    <button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')} className="ml-auto">
                        <X aria-hidden="true" size={18} />
                    </button>
                </div>
            ) : null}
        </>
    )
}
