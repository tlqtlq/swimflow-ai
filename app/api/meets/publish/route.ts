import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    const { meetId } = await request.json() as { meetId?: string }
    if (!meetId) return NextResponse.json({ message: 'meetId is required.' }, { status: 400 })
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })

    const { data: meet } = await (supabase.from('meets' as any) as any).select('paid_until, payment_status').eq('id', meetId).single()
    if (meet?.payment_status !== 'paid' || !meet?.paid_until || new Date(meet.paid_until) <= new Date()) {
        return NextResponse.json({ message: 'A paid meet pass or annual pass is required before publishing.' }, { status: 402 })
    }
    const { error } = await (supabase.from('meets' as any) as any).update({ status: 'published', is_published: true }).eq('id', meetId)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    return NextResponse.json({ published: true })
}
