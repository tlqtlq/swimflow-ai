import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

const ids = {
    organization: '11111111-1111-1111-1111-111111111111',
    meet: '22222222-2222-2222-2222-222222222222',
    event: '44444444-4444-4444-4444-444444444441',
}

const standardEvents = [
    '50 Freestyle', '100 Freestyle', '200 Freestyle', '500 Freestyle', '1000 Freestyle', '1650 Freestyle',
    '100 Backstroke', '200 Backstroke', '100 Breaststroke', '200 Breaststroke', '100 Butterfly', '200 Butterfly',
    '200 Individual Medley', '400 Individual Medley', '200 Medley Relay', '200 Freestyle Relay', '400 Medley Relay', '400 Freestyle Relay',
].map((name, index) => ({ id: `44444444-4444-4444-4444-${String(index === 1 ? 441 : 100 + index).padStart(12, '0')}`, name }))

export async function GET(request: Request) {
    const supabase = createSupabaseAdminClient()
    if (!supabase) return NextResponse.redirect(new URL('/setup?error=Supabase%20is%20not%20configured', request.url))

    const organizationResult = await (supabase.from('organizations' as any) as any).upsert({ id: ids.organization, name: 'Demo Swim Club', slug: 'demo-swim-club' })
    if (organizationResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(organizationResult.error.message)}`, request.url))

    const locationResult = await (supabase.from('locations' as any) as any).upsert({ id: '66666666-6666-6666-6666-666666666666', name: 'Central HS Aquatic Center', address: '123 Pool Way, Miami, FL', course_type_default: 'SCY' })
    if (locationResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(locationResult.error.message)}`, request.url))

    const meetResult = await (supabase.from('meets' as any) as any).upsert({ id: ids.meet, organization_id: ids.organization, location_id: '66666666-6666-6666-6666-666666666666', name: 'Florida Gold Coast Invitational', location: 'Central HS Aquatic Center', meet_date: '2026-09-12', course_type: 'SCY', current_heat_number: 1, current_heat: 1, status: 'draft' })
    if (meetResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(meetResult.error.message)}`, request.url))

    const eventResult = await (supabase.from('events' as any) as any).upsert(standardEvents.map((event) => ({ ...event, meet_id: ids.meet, course: 'SCY', heat_count: 1 })))
    if (eventResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(eventResult.error.message)}`, request.url))
    await (supabase.from('meets' as any) as any).update({ current_event_id: standardEvents[1].id }).eq('id', ids.meet)

    return NextResponse.redirect(new URL(`/dashboard/meets/${ids.meet}`, request.url))
}
