import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    const { meetId, eventId, heatNumber, courseType } = await request.json() as { meetId?: string; eventId?: string; heatNumber?: number; courseType?: 'SCY' | 'LCM' | 'SCM' }
    if (!meetId || !eventId || !Number.isInteger(heatNumber) || heatNumber! < 1) return NextResponse.json({ message: 'meetId, eventId, and a valid heatNumber are required.' }, { status: 400 })
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    const { error } = await (supabase.from('meets' as any) as any).update({ current_event_id: eventId, current_heat_number: heatNumber, current_heat: heatNumber, ...(courseType ? { course_type: courseType } : {}) }).eq('id', meetId)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    return NextResponse.json({ updated: true, eventId, heatNumber })
}
