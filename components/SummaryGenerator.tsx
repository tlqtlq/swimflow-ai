'use client'

import { useState, useTransition } from 'react'
import { generateMeetSummary } from '@/lib/actions/generate-summary'

export default function SummaryGenerator({ meetId }: { meetId: string }) {
    const [summary, setSummary] = useState<{ metrics: { swimmersScored: number; resultsRecorded: number; personalRecords: number; teamScore: number }; pressRelease: string } | null>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
                <div><p className="text-sm font-medium uppercase tracking-[0.14em] text-sky-600">Post-meet desk</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">Press release & PR summary</h1></div>
                <button type="button" disabled={isPending} onClick={() => startTransition(async () => setSummary(await generateMeetSummary(meetId)))} className="rounded-xl bg-sky-600 px-4 py-3 font-medium text-white disabled:opacity-60">{isPending ? 'Writing...' : 'Generate summary'}</button>
            </div>
            {!summary ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">Generate a summary after official results have been recorded.</div> : <>
                <div className="grid gap-3 sm:grid-cols-4">{[['Swimmers', summary.metrics.swimmersScored], ['Results', summary.metrics.resultsRecorded], ['PRs', summary.metrics.personalRecords], ['Team points', summary.metrics.teamScore]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
                <article className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-6 leading-7 text-slate-800">{summary.pressRelease}</article>
            </>}
        </section>
    )
}
