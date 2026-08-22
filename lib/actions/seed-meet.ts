'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { seedHeatEntries } from '@/lib/seeding'

export type SeedMeetResult = {
    heatCount: number
    seededEntries: Array<{
        swimmerId: string
        heatNumber: number
        laneNumber: number
    }>
}

export async function seedMeetForEvent(meetId: string, eventId: string): Promise<SeedMeetResult> {
    const supabase = createSupabaseAdminClient()

    if (!supabase) {
        throw new Error('Supabase is not configured.')
    }

    const { data: eventData, error: eventError } = (await (supabase.from('events' as any) as any)
        .select('*')
        .eq('id', eventId)
        .single()) as {
            data: { id: string; name?: string | null; course?: string | null } | null
            error: { message: string } | null
        }

    if (eventError || !eventData) {
        throw new Error(eventError?.message || 'Event not found.')
    }

    const { data: entries, error: entriesError } = (await (supabase.from('heat_entries' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('seed_time_seconds', { ascending: true, nullsFirst: false })) as {
            data: Array<{
                swimmer_id: string
                swimmer_name: string | null
                seed_time: string | null
                seed_time_seconds: number | null
            }> | null
            error: { message: string } | null
        }

    if (entriesError) {
        throw new Error(entriesError.message)
    }

    const swimmers = (entries ?? []).map((entry) => ({
        id: entry.swimmer_id,
        name: entry.swimmer_name ?? 'Swimmer',
        firstName: entry.swimmer_name?.split(' ')[0] ?? null,
        lastName: entry.swimmer_name?.split(' ').slice(1).join(' ') ?? null,
        seedTime: entry.seed_time,
        seedTimeSeconds: entry.seed_time_seconds,
    }))

    const seededHeats = seedHeatEntries(swimmers, 6)
    const assignments = new Map<string, { heatNumber: number; laneNumber: number }>()

    for (const heat of seededHeats) {
        for (const entry of heat.entries) {
            assignments.set(String(entry.swimmer.id), {
                heatNumber: heat.heatNumber,
                laneNumber: entry.lane,
            })
        }
    }

    const updates = Array.from(assignments.entries()).map(async ([swimmerId, assignment]) => {
        const { error } = await (supabase.from('heat_entries' as any) as any)
            .update({
                heat_number: assignment.heatNumber,
                lane_number: assignment.laneNumber,
                heat: assignment.heatNumber,
                lane: assignment.laneNumber,
            })
            .eq('event_id', eventId)
            .eq('swimmer_id', swimmerId)

        if (error) {
            throw new Error(error.message)
        }

        const { error: meetEntryError } = await (supabase.from('meet_entries' as any) as any)
            .update({
                heat_number: assignment.heatNumber,
                lane_number: assignment.laneNumber,
                heat: assignment.heatNumber,
                lane: assignment.laneNumber,
            })
            .eq('event_id', eventId)
            .eq('swimmer_id', swimmerId)

        if (meetEntryError) {
            throw new Error(meetEntryError.message)
        }
    })

    await Promise.all(updates)

    const seededEntries = Array.from(assignments.entries()).map(([swimmerId, assignment]) => ({
        swimmerId,
        heatNumber: assignment.heatNumber,
        laneNumber: assignment.laneNumber,
    }))

    return {
        heatCount: seededHeats.length,
        seededEntries,
    }
}
