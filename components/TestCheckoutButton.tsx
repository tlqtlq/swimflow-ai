'use client'

import { useState } from 'react'

export default function TestCheckoutButton({ meetId }: { meetId: string }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const startCheckout = async () => {
        setLoading(true)
        setMessage('')
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ meetId, planType: 'single', testMode: true }),
            })
            const payload = await response.json()
            if (!response.ok || !payload.redirectUrl) throw new Error(payload.message || 'Unable to complete test payment.')
            window.location.assign(payload.redirectUrl)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Unable to start checkout.')
            setLoading(false)
        }
    }
    return <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">Test Checkout</p>
        <p className="mt-1 text-sm text-amber-800">Completes the $34.99 single-meet test payment.</p>
        <button type="button" onClick={startCheckout} disabled={loading} className="mt-3 rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878] disabled:opacity-60">{loading ? 'Completing payment...' : 'Test payment'}</button>
        {message ? <p className="mt-2 text-xs text-red-700">{message}</p> : null}
    </div>
}