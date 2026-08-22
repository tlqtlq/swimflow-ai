import CheckoutActions from '@/components/CheckoutActions'
import { createSupabaseServerClient } from '@/lib/supabase'

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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold text-slate-900">Pricing options</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-blue-300 bg-blue-50 p-3"><p className="font-semibold text-slate-900">Single Meet License</p><p className="mt-1 text-xl font-bold text-[#003296]">$34.99 <span className="text-sm font-normal">/ meet</span></p><p className="mt-1 text-sm text-slate-600">Live portal, QR codes, and unlimited heat tracking.</p></div><div className="rounded-lg border border-slate-200 p-3"><p className="font-semibold text-slate-900">Annual Unlimited Pass</p><p className="mt-1 text-xl font-bold text-[#003296]">$299.99 <span className="text-sm font-normal">/ year</span></p><p className="mt-1 text-sm text-slate-600">Unlimited meets, custom branding, and roster importing.</p></div></div><div className="mt-5 border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-900">Order breakdown</h3><div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-600">Single Meet License</span><span className="font-medium text-slate-900">$34.99</span></div><div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 font-semibold"><span>Total</span><span>$34.99</span></div><p className="mt-5 text-sm font-medium text-slate-700">Payment method</p><div className="mt-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900">Test payment or Stripe Checkout</div><div className="mt-5"><CheckoutActions meetId={params.id} stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY)} /></div></div></section>
            <a href={`/meets/${params.id}`} className="inline-block text-sm font-medium text-sky-700 hover:underline">Return to meet management</a>
        </div>
    )
}
