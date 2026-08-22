'use client'

import { useState } from 'react'

export default function MeetBillingControls({ meetId, paidUntil, isPublished }: { meetId: string; paidUntil?: string | null; isPublished?: boolean }) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const paid = Boolean(paidUntil && new Date(paidUntil) > new Date())
    return <div className="flex flex-wrap items-center justify-end gap-2">
        {paid ? <a href={`/meets/${meetId}/checkout`} className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878]">{isPublished ? 'Manage Subscription' : 'Publish portal'}</a> : <a href={`/meets/${meetId}/checkout`} className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878]">Checkout</a>}
        {message ? <span className="w-full text-right text-xs font-bold text-red-600">{message}</span> : null}
    </div>
}
