'use client'

import { QRCodeSVG } from 'qrcode.react'
import { getClientPortalUrl, getPortalUrl } from '@/lib/app-url'
import { useEffect, useState } from 'react'

export default function MeetPortalQr({ meetId, meetName }: { meetId: string; meetName: string }) {
    const [portalUrl, setPortalUrl] = useState(getPortalUrl(meetId))

    useEffect(() => {
        setPortalUrl(getClientPortalUrl(meetId))
    }, [meetId])

    return <section className="print-poster rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 text-center">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Spectator access</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Follow this meet live</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Share the code with families for live heats and lane assignments.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><QRCodeSVG value={portalUrl} size={184} includeMargin /></div>
        </div>
        <p className="mt-5 break-all text-xs text-slate-500"><a href={portalUrl} target="_blank" rel="noreferrer" className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2">{portalUrl}</a></p>
        <button type="button" onClick={() => window.print()} className="no-print mt-5 w-full rounded-lg bg-[#003296] px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002878]">Print Deck Poster</button>
        <style>{`@media print { body * { visibility: hidden; } .print-poster, .print-poster * { visibility: visible; } .print-poster { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; } .no-print { display: none !important; } }`}</style>
    </section>
}
