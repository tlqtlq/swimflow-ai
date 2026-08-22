import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
export async function POST(request: Request) {
    try {
        const { meetId, eventId, heatNumber } = await request.json() as { meetId?: string; eventId?: string; heatNumber?: number }

        if (!meetId || !eventId || !heatNumber) {
            return NextResponse.json({ success: false, message: 'meetId, eventId, and heatNumber are required.' }, { status: 400 })
        }

        const message = `Event ${eventId} Heat ${heatNumber} is on deck!`
        const supabase = createSupabaseAdminClient()
        if (!supabase) return NextResponse.json({ success: false, message: 'Supabase is not configured.' }, { status: 500 })
        const { data, error } = await (supabase.from('heat_announcements' as any) as any)
            .insert({ meet_id: meetId, event_id: eventId, heat_number: heatNumber, message })
            .select('id, message')
            .single()
        if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
        return NextResponse.json({ success: true, sent: 1, channel: 'browser', announcement: data })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Unable to send heat calls.', error: String(error) }, { status: 500 })
    }
}
