import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendHeatAlertPushes } from '@/lib/web-push'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    const { meetId, eventId, heatNumber, courseType } = await request.json() as { meetId?: string; eventId?: string; heatNumber?: number; courseType?: 'SCY' | 'LCM' | 'SCM' }
    if (!meetId || !eventId || !Number.isInteger(heatNumber) || heatNumber! < 1) return NextResponse.json({ message: 'meetId, eventId, and a valid heatNumber are required.' }, { status: 400 })
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    const { data, error } = await (supabase.from('meets' as any) as any).update({ current_event_id: eventId, current_heat_number: heatNumber, current_heat: heatNumber, ...(courseType ? { course_type: courseType } : {}) }).eq('id', meetId).select('id, current_event_id, current_heat, current_heat_number').limit(1)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    const updatedMeet = data?.[0]
    if (!updatedMeet) return NextResponse.json({ message: 'Meet not found.' }, { status: 404 })
    const subscribersResult = await (supabase.from('subscribers' as any) as any).select('id, push_subscription').eq('meet_id', meetId).not('push_subscription', 'is', null)
    if (!subscribersResult.error && subscribersResult.data?.length) {
        const expiredSubscriptionIds = await sendHeatAlertPushes(subscribersResult.data, meetId, updatedMeet.current_heat ?? updatedMeet.current_heat_number)
        if (expiredSubscriptionIds.length) {
            await (supabase.from('subscribers' as any) as any).delete().in('id', expiredSubscriptionIds)
        }
    }
    return NextResponse.json({ updated: true, eventId: updatedMeet.current_event_id, heatNumber: updatedMeet.current_heat ?? updatedMeet.current_heat_number })
}
