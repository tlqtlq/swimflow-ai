import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!stripe || !webhookSecret) return NextResponse.json({ message: 'Stripe webhook is not configured.' }, { status: 500 })

    const signature = request.headers.get('stripe-signature')
    if (!signature) return NextResponse.json({ message: 'Missing Stripe signature.' }, { status: 400 })

    let event
    try {
        event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Invalid webhook signature.' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const meetId = session.metadata?.meetId
        if (meetId && session.payment_status === 'paid') {
            const planType = session.metadata?.planType === 'annual' ? 'annual' : 'single'
            const paidUntil = new Date()
            paidUntil.setDate(paidUntil.getDate() + (planType === 'annual' ? 365 : 30))
            const supabase = createSupabaseAdminClient()
            if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
            const { error } = await (supabase.from('meets' as any) as any).update({
                stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
                stripe_checkout_session_id: session.id,
                paid_until: paidUntil.toISOString(),
                payment_status: 'paid',
                is_published: true,
                status: 'published',
            }).eq('id', meetId)
            if (error) return NextResponse.json({ message: error.message }, { status: 500 })
        }
    }

    return NextResponse.json({ received: true })
}