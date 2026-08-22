'use client'

import { useState } from 'react'

export default function MeetBillingControls({ meetId, paidUntil, isPublished }: { meetId: string; paidUntil?: string | null; isPublished?: boolean }) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const checkout = async (planType: 'single' | 'annual') => {
        setLoading(true)
        const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meetId, planType }) })
        const payload = await response.json()
        if (payload.url) window.location.assign(payload.url)
        else setMessage(payload.message ?? 'Unable to start checkout.')
        setLoading(false)
    }
    const publish = async () => {
        setLoading(true)
        const response = await fetch('/api/meets/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meetId }) })
        const payload = await response.json()
        setMessage(payload.published ? 'Public portal published.' : payload.message)
        setLoading(false)
    }
    const paid = paidUntil && new Date(paidUntil) > new Date()
    return <div className="flex flex-wrap items-center justify-end gap-2">
        {paid ? <button type="button" disabled={loading || isPublished} onClick={publish} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-default disabled:opacity-80">{isPublished ? 'Published' : 'Publish portal'}</button> : <><button type="button" disabled={loading} onClick={() => checkout('single')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Buy meet pass $49</button><button type="button" disabled={loading} onClick={() => checkout('annual')} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Upgrade annual $499</button></>}
        {message ? <span className="w-full text-right text-xs text-slate-500">{message}</span> : null}
    </div>
}
