import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    const { meetId, eventId, heatNumber, courseType } = await request.json() as { meetId?: string; eventId?: string; heatNumber?: number; courseType?: 'SCY' | 'LCM' | 'SCM' }
    if (!meetId || !eventId || !Number.isInteger(heatNumber) || heatNumber! < 1) return NextResponse.json({ message: 'meetId, eventId, and a valid heatNumber are required.' }, { status: 400 })
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    const { data, error } = await (supabase.from('meets' as any) as any).update({ current_event_id: eventId, current_heat_number: heatNumber, current_heat: heatNumber, ...(courseType ? { course_type: courseType } : {}) }).eq('id', meetId).select('id, current_event_id, current_heat, current_heat_number').limit(1)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    const updatedMeet = data?.[0]
    if (!updatedMeet) return NextResponse.json({ message: 'Meet not found.' }, { status: 404 })
    return NextResponse.json({ updated: true, eventId: updatedMeet.current_event_id, heatNumber: updatedMeet.current_heat ?? updatedMeet.current_heat_number })
}
