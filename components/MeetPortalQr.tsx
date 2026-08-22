'use client'

import { QRCodeSVG } from 'qrcode.react'
import { getClientPortalUrl, getPortalUrl } from '@/lib/app-url'
import { useEffect, useState } from 'react'

export default function MeetPortalQr({ meetId, meetName }: { meetId: string; meetName: string }) {
    const [portalUrl, setPortalUrl] = useState(getPortalUrl(meetId))

    useEffect(() => {
        setPortalUrl(getClientPortalUrl(meetId))
    }, [meetId])

    return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print-poster">
        <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">Spectator access</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{meetName}</h2>
                <p className="mt-2 max-w-md text-sm text-slate-600">Post this QR code on deck so families can follow live heats and lane assignments.</p>
                <button type="button" onClick={() => window.print()} className="no-print mt-4 rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878]">Print deck poster</button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3"><QRCodeSVG value={portalUrl} size={156} includeMargin /></div>
        </div>
        <p className="mt-3 break-all text-xs text-slate-500"><a href={portalUrl} target="_blank" rel="noreferrer" className="text-sky-700 underline">{portalUrl}</a></p>
        <style>{`@media print { body * { visibility: hidden; } .print-poster, .print-poster * { visibility: visible; } .print-poster { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; } .no-print { display: none !important; } }`}</style>
    </section>
}
