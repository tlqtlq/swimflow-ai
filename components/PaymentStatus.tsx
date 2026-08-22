'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

export default function PaymentStatus({ status, meetId }: { status?: string; meetId?: string }) {
    const [visible, setVisible] = useState(Boolean(status))
    useEffect(() => {
        if (!status) return
        const timer = window.setTimeout(() => setVisible(false), 4000)
        return () => window.clearTimeout(timer)
    }, [status])
    if (!visible) return null
    const success = status === 'success'
    return <div role={success ? 'status' : 'alert'} className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg p-4 font-bold text-white shadow-xl ${success ? 'bg-emerald-600' : 'bg-red-600'}`}>
        {success ? <CheckCircle aria-hidden="true" size={22} /> : <AlertTriangle aria-hidden="true" size={22} />}<span>{success ? `Payment successful${meetId ? ` for meet ${meetId.slice(0, 8)}...` : ''}. Your SwimFlow.ai portal is published.` : 'Checkout is processing. Refresh shortly to confirm payment.'}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => setVisible(false)} className="ml-auto shrink-0"><X aria-hidden="true" size={18} /></button>
    </div>
}