import { createSupabaseServerClient } from '@/lib/supabase'
import PlanSelector from '@/components/PlanSelector'
import { Suspense } from 'react'

export default async function MeetCheckoutPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
    const resolvedParams = await params
    const supabase = createSupabaseServerClient()
    let meet: { name?: string; meet_date?: string | null; location?: string | null; payment_status?: string } = { name: 'New swim meet', meet_date: null, location: null, payment_status: 'unpaid' }
    if (supabase) {
        try {
            const result = await supabase.from('meets').select('name, meet_date, location, payment_status').eq('id', resolvedParams.id).maybeSingle()
            if (result.data) meet = result.data as typeof meet
        } catch {
            // Keep checkout usable as a preview when the database is unavailable.
        }
    }

    return (
        <div className="space-y-8 py-4">
            <header className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-700">Secure checkout</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Publish {meet?.name ?? 'this meet'}</h1><p className="mt-3 text-slate-600">Unlock a live spectator portal for this meet in just a few minutes.</p></header>
            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Order details</h2><dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Meet name</dt><dd className="mt-1 font-medium text-slate-900">{meet.name}</dd></div><div><dt className="text-slate-500">Date</dt><dd className="mt-1 font-medium text-slate-900">{meet.meet_date ?? 'Date to be announced'}</dd></div><div><dt className="text-slate-500">Location</dt><dd className="mt-1 font-medium text-slate-900">{meet.location ?? 'Location to be announced'}</dd></div><div><dt className="text-slate-500">Plan tier</dt><dd className="mt-1 font-medium text-slate-900">Single Meet License</dd></div></dl><div className="mt-7 border-t border-slate-100 pt-5"><h3 className="font-semibold text-slate-900">Included with every meet</h3><ul className="mt-3 space-y-2 text-sm text-slate-600"><li>✓ Live spectator portal and QR poster</li><li>✓ Real-time deck and heat tracking</li><li>✓ Roster import and event setup</li></ul></div></section>
                <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-slate-900">Payment summary</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Secure checkout</span></div><div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-600">Starting today</span><span className="text-2xl font-semibold text-slate-950">$34.99</span></div><p className="mt-1 text-sm text-slate-500">Choose the right plan before continuing.</p></div><Suspense fallback={<div className="mt-5 animate-pulse"><div className="h-6 w-40 rounded bg-slate-200" /><div className="mt-4 h-32 rounded bg-slate-100" /></div>}><div className="mt-5"><PlanSelector meetId={resolvedParams.id} stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} /></div></Suspense></section>
            </div>
            <a href={`/meets/${resolvedParams.id}`} className="inline-block text-sm font-medium text-sky-700 hover:underline">Return to meet management</a>
        </div>
    )
}
