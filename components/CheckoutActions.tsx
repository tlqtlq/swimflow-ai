'use client'

import { useState } from 'react'

export default function CheckoutActions({ meetId, stripeEnabled, planType }: { meetId: string; stripeEnabled: boolean; planType: 'single' | 'annual' }) {
    const [loading, setLoading] = useState<'test' | 'stripe' | null>(null)
    const [message, setMessage] = useState('')
    const startCheckout = async (testMode: boolean) => {
        setLoading(testMode ? 'test' : 'stripe')
        setMessage('')
        try {
            const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ meetId, planType, testMode }) })
            const payload = await response.json()
            if (!response.ok) throw new Error(payload.message || 'Unable to complete checkout.')
            window.location.assign(payload.redirectUrl || payload.url)
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Unable to complete checkout.')
            setLoading(null)
        }
    }
    return <div className="space-y-3"><button type="button" disabled={loading !== null} onClick={() => void startCheckout(true)} className="w-full rounded-lg bg-[#003296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#002878] disabled:opacity-60">{loading === 'test' ? 'Completing payment...' : 'Complete Payment (Test Mode)'}</button>{stripeEnabled ? <button type="button" disabled={loading !== null} onClick={() => void startCheckout(false)} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{loading === 'stripe' ? 'Opening Stripe...' : 'Open Stripe Checkout'}</button> : null}{message ? <p className="text-sm text-red-700" role="alert">{message}</p> : null}</div>
}