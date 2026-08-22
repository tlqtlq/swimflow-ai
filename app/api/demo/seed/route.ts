import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

const ids = {
    organization: '11111111-1111-1111-1111-111111111111',
    meet: '22222222-2222-2222-2222-222222222222',
    event: '44444444-4444-4444-4444-444444444441',
    ava: '33333333-3333-3333-3333-333333333331',
    liam: '33333333-3333-3333-3333-333333333332',
    avaEntry: '55555555-5555-5555-5555-555555555551',
    liamEntry: '55555555-5555-5555-5555-555555555552',
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

    const swimmersResult = await (supabase.from('swimmers' as any) as any).upsert([
        { id: ids.ava, organization_id: ids.organization, first_name: 'Ava', last_name: 'Morgan', age: 14 },
        { id: ids.liam, organization_id: ids.organization, first_name: 'Liam', last_name: 'Chen', age: 15 },
    ])
    if (swimmersResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(swimmersResult.error.message)}`, request.url))

    const eventResult = await (supabase.from('events' as any) as any).upsert(standardEvents.map((event) => ({ ...event, meet_id: ids.meet, course: 'SCY', heat_count: 1 })))
    if (eventResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(eventResult.error.message)}`, request.url))
    await (supabase.from('meets' as any) as any).update({ current_event_id: standardEvents[1].id }).eq('id', ids.meet)

    const entryRows = [
        { id: ids.avaEntry, event_id: ids.event, swimmer_id: ids.ava, swimmer_name: 'Ava Morgan', seed_time: '58.40', seed_time_seconds: 58.4, heat_number: 1, lane_number: 3 },
        { id: ids.liamEntry, event_id: ids.event, swimmer_id: ids.liam, swimmer_name: 'Liam Chen', seed_time: '56.90', seed_time_seconds: 56.9, heat_number: 1, lane_number: 4 },
    ]
    const heatResult = await (supabase.from('heat_entries' as any) as any).upsert(entryRows)
    const meetEntriesResult = await (supabase.from('meet_entries' as any) as any).upsert(entryRows)
    if (heatResult.error || meetEntriesResult.error) return NextResponse.redirect(new URL(`/setup?error=${encodeURIComponent(heatResult.error?.message || meetEntriesResult.error?.message || 'Unable to create entries')}`, request.url))

    return NextResponse.redirect(new URL(`/dashboard/meets/${ids.meet}`, request.url))
}
