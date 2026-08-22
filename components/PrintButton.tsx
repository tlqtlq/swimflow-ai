'use client'

export default function PrintButton() {
    return <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#003296] px-3 py-2 text-sm font-medium text-white hover:bg-[#002878]">Print / Save PDF</button>
}
