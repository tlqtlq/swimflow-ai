'use client'

import { useState } from 'react'
import RosterUploader from '@/components/RosterUploader'

export default function RosterImportModal({ meetId }: { meetId: string }) {
    const [open, setOpen] = useState(false)
    return <>
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-medium text-white hover:bg-[#002878]">Import Roster</button>
        {open ? <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Import roster"><div className="w-full max-w-2xl"><div className="mb-2 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow">Close</button></div><RosterUploader meetId={meetId} /></div></div> : null}
    </>
}