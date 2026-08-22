import CheckoutActions from '@/components/CheckoutActions'
import { createSupabaseServerClient } from '@/lib/supabase'
import PlanSelector from '@/components/PlanSelector'

export default async function MeetCheckoutPage({ params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient()
    let meet: { name?: string; meet_date?: string | null; location?: string | null; payment_status?: string } = { name: 'New swim meet', meet_date: null, location: null, payment_status: 'unpaid' }
    if (supabase) {
        try {
            const result = await supabase.from('meets').select('name, meet_date, location, payment_status').eq('id', params.id).maybeSingle()
            if (result.data) meet = result.data as typeof meet
        } catch {
            // Keep checkout usable as a preview when the database is unavailable.
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 py-8">
            <header className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-700">Checkout</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Publish {meet?.name ?? 'this meet'}</h1>
                <p className="mt-2 text-slate-700">Complete payment to publish the live spectator portal. You can review and manage the meet before paying.</p>
            </header>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Meet summary</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Meet name</dt><dd className="font-medium text-slate-900">{meet.name}</dd></div><div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{meet.meet_date ?? 'Date to be announced'}</dd></div><div><dt className="text-slate-500">Location</dt><dd className="font-medium text-slate-900">{meet.location ?? 'Location to be announced'}</dd></div><div><dt className="text-slate-500">Plan tier</dt><dd className="font-medium text-slate-900">Single Meet License</dd></div></dl><div className="mt-6 border-t border-slate-200 pt-4"><div className="flex items-center justify-between"><span className="text-slate-600">Live portal access</span><span className="text-xl font-semibold text-slate-900">$34.99</span></div><p className="mt-1 text-sm text-slate-500">Live spectator portal, QR codes, and unlimited heat tracking.</p></div></section>
            <PlanSelector meetId={params.id} stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} />
            <a href={`/meets/${params.id}`} className="inline-block text-sm font-medium text-sky-700 hover:underline">Return to meet management</a>
        </div>
    )
}
