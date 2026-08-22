import { ArrowRight, FileSpreadsheet, QrCode, Radio, SlidersHorizontal } from 'lucide-react'
import LandingDeckDemo from '@/components/LandingDeckDemo'

export default function Page() {
    return (
        <div className="space-y-20 pb-10 pt-6 sm:pt-12">
            <section className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Meet operations, simplified</p>
                    <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Run Flawless Swim Meets in Real-Time</h1>
                    <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">SwimFlow gives directors one calm command center for rosters, live deck control, and instant spectator access.</p>
                    <div className="mt-8 flex flex-wrap gap-3"><a href="/api/demo/seed" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-colors hover:bg-blue-600">Create Free Meet <ArrowRight size={16} /></a><a href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">View Spectator Demo <Radio size={16} /></a></div>
                    <p className="mt-5 text-sm text-slate-500">No hardware, no paper heat sheets, no spectator app download.</p>
                </div>
                <LandingDeckDemo />
            </section>

            <section className="border-y border-slate-200 py-16">
                <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Everything stays in sync</p><h2 className="mt-3 text-3xl font-semibold text-slate-950">A faster meet day, from file upload to final heat.</h2></div>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <article className="rounded-xl border border-slate-800 bg-slate-900/95 p-6 text-white shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><QrCode size={20} /></span><h3 className="mt-5 text-lg font-semibold">Instant QR Access</h3><p className="mt-2 text-sm leading-6 text-slate-400">Share one code at the pool. Families see live heat and lane changes on any device.</p></article>
                    <article className="rounded-xl border border-slate-800 bg-slate-900/95 p-6 text-white shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><SlidersHorizontal size={20} /></span><h3 className="mt-5 text-lg font-semibold">One-Tap Deck Control</h3><p className="mt-2 text-sm leading-6 text-slate-400">Advance the meet, call the next heat, and keep every display aligned in real time.</p></article>
                    <article className="rounded-xl border border-slate-800 bg-slate-900/95 p-6 text-white shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><FileSpreadsheet size={20} /></span><h3 className="mt-5 text-lg font-semibold">Automated HY3 / CSV Parsing</h3><p className="mt-2 text-sm leading-6 text-slate-400">Bring in roster files once and let SwimFlow build events and swimmer assignments.</p></article>
                </div>
            </section>

            <section className="grid items-center gap-10 rounded-2xl border border-slate-200 bg-slate-100/70 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Try the live flow</p><h2 className="mt-3 text-3xl font-semibold text-slate-950">Advance a heat. The room stays in step.</h2><p className="mt-4 leading-7 text-slate-600">The interactive console is a small version of the director workflow: make the call, then let the spectator portal carry it to the stands.</p></div>
                <LandingDeckDemo />
            </section>
        </div>
    )
}
