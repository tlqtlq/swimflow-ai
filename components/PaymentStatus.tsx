'use client'

import { useEffect, useState } from 'react'

export default function PaymentStatus({ status, meetId }: { status?: string; meetId?: string }) {
    const [visible, setVisible] = useState(Boolean(status))
    useEffect(() => {
        if (!status) return
        const timer = window.setTimeout(() => setVisible(false), 7000)
        return () => window.clearTimeout(timer)
    }, [status])
    if (!visible) return null
    return <div role="status" className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg">
        {status === 'success' ? `Payment successful${meetId ? ` for meet ${meetId.slice(0, 8)}...` : ''}. Your SwimFlow.ai portal is published.` : 'Checkout is processing. Refresh shortly to confirm payment.'}
        <button type="button" onClick={() => setVisible(false)} className="ml-3 font-semibold">Dismiss</button>
    </div>
}