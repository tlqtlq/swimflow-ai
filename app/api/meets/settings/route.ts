import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    const body = await request.json() as { meetId?: string; courseType?: 'SCY' | 'LCM' | 'SCM'; locationId?: string; locationName?: string; address?: string }
    if (!body.meetId) return NextResponse.json({ message: 'meetId is required.' }, { status: 400 })
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })

    let locationId = body.locationId || null
    if (!locationId && body.locationName?.trim()) {
        const locationResult = await (supabase.from('locations' as any) as any).insert({
            name: body.locationName.trim(),
            address: body.address?.trim() || null,
            course_type_default: body.courseType || 'SCY',
        }).select('id').single()
        if (locationResult.error) return NextResponse.json({ message: locationResult.error.message }, { status: 500 })
        locationId = locationResult.data.id
    }

    const update: Record<string, string | null> = { location_id: locationId }
    if (body.courseType) update.course_type = body.courseType
    const { error } = await (supabase.from('meets' as any) as any).update(update).eq('id', body.meetId)
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    return NextResponse.json({ saved: true, locationId })
}
