import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

type PushSubscriptionPayload = {
    endpoint?: string
    keys?: Record<string, string>
}

export async function POST(request: Request) {
    try {
        const { meetId, subscription } = await request.json() as { meetId?: string; subscription?: PushSubscriptionPayload }
        const endpoint = subscription?.endpoint?.trim()
        if (!meetId || !endpoint) {
            return NextResponse.json({ message: 'A meet ID and Push subscription endpoint are required.' }, { status: 400 })
        }

        const supabase = createSupabaseAdminClient()
        if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })

        const existing = await (supabase.from('subscribers' as any) as any)
            .select('id')
            .eq('meet_id', meetId)
            .eq('push_endpoint', endpoint)
            .limit(1)
        if (existing.error) return NextResponse.json({ message: existing.error.message }, { status: 500 })

        const values = { push_endpoint: endpoint, push_subscription: subscription }
        const result = existing.data?.[0]?.id
            ? await (supabase.from('subscribers' as any) as any).update(values).eq('id', existing.data[0].id)
            : await (supabase.from('subscribers' as any) as any).insert({ meet_id: meetId, phone_number: null, ...values })
        if (result.error) return NextResponse.json({ message: result.error.message }, { status: 500 })

        return NextResponse.json({ saved: true })
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to save the Push subscription.' }, { status: 500 })
    }
}