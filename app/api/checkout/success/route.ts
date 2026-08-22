import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export async function GET(request: Request) {
    const sessionId = new URL(request.url).searchParams.get('session_id')
    const stripe = getStripe()
    const supabase = createSupabaseAdminClient()
    if (!sessionId || !stripe || !supabase) return NextResponse.redirect(new URL('/', request.url))

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!session.metadata?.meetId) return NextResponse.redirect(new URL('/', request.url))
    if (session.payment_status === 'paid') {
        const plan = session.metadata.planType === 'annual' ? 'annual' : 'single'
        const paidUntil = new Date()
        paidUntil.setDate(paidUntil.getDate() + (plan === 'annual' ? 365 : 30))
        await (supabase.from('meets' as any) as any).update({
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            paid_until: paidUntil.toISOString(),
            payment_status: 'paid',
            is_published: true,
            status: 'published',
        }).eq('id', session.metadata.meetId)
    }
    return NextResponse.redirect(new URL(`/dashboard/meets/${session.metadata.meetId}?payment=${session.payment_status === 'paid' ? 'success' : 'pending'}`, request.url))
}
