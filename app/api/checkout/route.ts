import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { getCheckoutPrice, getStripe } from '@/lib/stripe'
import { getAppBaseUrl } from '@/lib/app-url'

export async function POST(request: Request) {
    try {
        const { meetId, planType, plan, testMode } = await request.json() as { meetId?: string; planType?: 'single' | 'annual'; plan?: 'meet' | 'single' | 'annual'; testMode?: boolean }
        const selectedPlan = planType ?? (plan === 'annual' ? 'annual' : 'single')
        if (!meetId || !['single', 'annual'].includes(selectedPlan)) return NextResponse.json({ message: 'meetId and a valid planType are required.' }, { status: 400 })
        const stripe = getStripe()
        const supabase = createSupabaseAdminClient()
        if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })

        const { data: meet } = await (supabase.from('meets' as any) as any).select('id, name').eq('id', meetId).single()
        if (!meet) return NextResponse.json({ message: 'Meet not found.' }, { status: 404 })
        if (testMode) {
            const paidUntil = new Date()
            paidUntil.setFullYear(paidUntil.getFullYear() + (selectedPlan === 'annual' ? 1 : 0))
            if (selectedPlan === 'single') paidUntil.setDate(paidUntil.getDate() + 30)
            const { error } = await (supabase.from('meets' as any) as any).update({ payment_status: 'paid', is_published: true, status: 'published', paid_until: paidUntil.toISOString() }).eq('id', meetId)
            if (error) return NextResponse.json({ message: error.message }, { status: 500 })
            return NextResponse.json({ paid: true, redirectUrl: `/meets/${meetId}?payment=success` })
        }
        if (!stripe) return NextResponse.json({ message: 'Stripe is not configured.' }, { status: 500 })
        const baseUrl = getAppBaseUrl() === 'http://localhost:3000' ? new URL(request.url).origin : getAppBaseUrl()
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{ price_data: { currency: 'usd', product_data: { name: selectedPlan === 'annual' ? 'SwimFlow.ai annual pass' : `SwimFlow.ai meet pass: ${meet.name}` }, unit_amount: getCheckoutPrice(selectedPlan === 'annual' ? 'annual' : 'meet') }, quantity: 1 }],
            success_url: `${baseUrl}/dashboard?payment=success&meetId=${meetId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard/meets/${meetId}?checkout=cancelled`,
            metadata: { meetId, planType: selectedPlan },
        })
        await (supabase.from('meets' as any) as any).update({ stripe_checkout_session_id: session.id, payment_status: 'pending' }).eq('id', meetId)
        return NextResponse.json({ url: session.url })
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to create Checkout session.' }, { status: 500 })
    }
}
