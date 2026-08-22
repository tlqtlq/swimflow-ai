'use client'

export default function PrintButton() {
    return <button type="button" onClick={() => window.print()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Print / Save PDF</button>
}
