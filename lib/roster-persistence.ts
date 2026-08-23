import { createSupabaseAdminClient } from '@/lib/supabase'
import { seedHeatEntries } from '@/lib/seeding'

export type ParsedRoster = {
    swimmers: Array<{
        swimmerName?: string | null
        firstName?: string | null
        lastName?: string | null
        age?: number | null
        grade?: string | null
        teamCode?: string | null
        gender?: string | null
        events: Array<{ name: string; seedTime?: string | null; course?: 'SCY' | 'LCM' | null }>
    }>
}

const parseSeedTimeSeconds = (seedTime: string | null | undefined) => {
    if (!seedTime?.trim()) return null
    const normalized = seedTime.replace(/\s+/g, '')
    if (!normalized.includes(':')) {
        const value = Number(normalized)
        return Number.isFinite(value) ? value : null
    }

    const [minutes, seconds] = normalized.split(':').map(Number)
    return Number.isFinite(minutes) && Number.isFinite(seconds) ? minutes * 60 + seconds : null
}

export async function persistParsedRosterToMeet(parsed: ParsedRoster, meetId: string) {
    const supabase = createSupabaseAdminClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data: meet, error: meetError } = await (supabase.from('meets' as any) as any).select('id, organization_id').eq('id', meetId).single()
    if (meetError || !meet) throw new Error(meetError?.message ?? 'Meet not found.')

    let attemptedRows = 0
    const entryRows: Array<{ meet_id: string; swimmer_name: string; team_code: string | null; age: number | null; gender: string | null; event_name: string; seed_time: string | null }> = []

    for (const swimmer of parsed.swimmers) {
        const swimmerName = swimmer.swimmerName?.trim() || `${swimmer.firstName ?? ''} ${swimmer.lastName ?? ''}`.trim()
        if (!swimmerName) continue
        for (const eventEntry of swimmer.events) {
            attemptedRows += 1
            entryRows.push({
                meet_id: meetId,
                swimmer_name: swimmerName,
                team_code: swimmer.teamCode ?? null,
                age: swimmer.age ?? null,
                gender: swimmer.gender ?? null,
                event_name: eventEntry.name.trim() || 'Unknown Event',
                seed_time: eventEntry.seedTime ?? null,
            })
        }
    }

    if (!entryRows.length) return { attemptedRows: 0, importedRows: 0, failedRows: 0 }

    const uniqueEntryRows = Array.from(new Map(entryRows.map((entry) => [
        `${entry.swimmer_name.toLocaleLowerCase()}-${entry.event_name.toLocaleLowerCase()}`,
        entry,
    ])).values())
    const eventNames = new Set(uniqueEntryRows.map((entry) => entry.event_name))

    const { error: deleteEntriesError } = await (supabase.from('entries' as any) as any).delete().eq('meet_id', meetId)
    if (deleteEntriesError) throw new Error(deleteEntriesError.message)

    const { data: existingEvents, error: existingEventsError } = await (supabase.from('events' as any) as any).select('id').eq('meet_id', meetId)
    if (existingEventsError) throw new Error(existingEventsError.message)
    const existingEventIds = (existingEvents ?? []).map((event: { id: string }) => event.id)
    if (existingEventIds.length) {
        const { error: deleteMeetEntriesError } = await (supabase.from('meet_entries' as any) as any).delete().in('event_id', existingEventIds)
        if (deleteMeetEntriesError) throw new Error(deleteMeetEntriesError.message)
        const { error: deleteHeatEntriesError } = await (supabase.from('heat_entries' as any) as any).delete().in('event_id', existingEventIds)
        if (deleteHeatEntriesError) throw new Error(deleteHeatEntriesError.message)
    }
    const { error: deleteEventsError } = await (supabase.from('events' as any) as any).delete().eq('meet_id', meetId)
    if (deleteEventsError) throw new Error(deleteEventsError.message)

    const entryResult = await (supabase.from('entries' as any) as any).insert(uniqueEntryRows).select('id')
    if (entryResult.error) throw new Error(entryResult.error.message)

    const rosterByEvent = new Map<string, Array<typeof uniqueEntryRows[number]>>()
    for (const entry of uniqueEntryRows) {
        rosterByEvent.set(entry.event_name, [...(rosterByEvent.get(entry.event_name) ?? []), entry])
    }

    let seededRows = 0
    let firstEventId: string | null = null
    for (const [eventName, eventRoster] of rosterByEvent) {
        const sourceRoster = parsed.swimmers.flatMap((swimmer) => swimmer.events
            .filter((event) => (event.name.trim() || 'Unknown Event') === eventName)
            .map((event) => ({ swimmer, event })))
        const course = sourceRoster[0]?.event.course === 'LCM' ? 'LCM' : 'SCY'
        const eventResult = await (supabase.from('events' as any) as any).insert({ meet_id: meetId, name: eventName, course, heat_count: Math.ceil(eventRoster.length / 8) }).select('id').single()
        if (eventResult.error || !eventResult.data?.id) throw new Error(eventResult.error?.message ?? 'Unable to create event.')
        const eventId = eventResult.data.id as string
        firstEventId ??= eventId

        const seededHeats = seedHeatEntries(eventRoster.map((entry) => ({
            id: entry.swimmer_name,
            name: entry.swimmer_name,
            seedTime: entry.seed_time,
            seedTimeSeconds: parseSeedTimeSeconds(entry.seed_time),
        })), 8)
        const seededRowsForEvent = seededHeats.flatMap((heat) => heat.entries.map((assignment) => {
            const rosterEntry = eventRoster.find((entry) => entry.swimmer_name === assignment.swimmer.id)
            return {
                rosterEntry,
                heatNumber: heat.heatNumber,
                laneNumber: assignment.lane,
            }
        }))

        for (const seeded of seededRowsForEvent) {
            if (!seeded.rosterEntry) continue
            const [firstName = '', ...lastName] = seeded.rosterEntry.swimmer_name.split(/\s+/).filter(Boolean)
            const swimmerResult = await (supabase.from('swimmers' as any) as any).insert({
                organization_id: meet.organization_id,
                first_name: firstName || null,
                last_name: lastName.join(' ') || null,
                age: seeded.rosterEntry.age,
            }).select('id').single()
            if (swimmerResult.error || !swimmerResult.data?.id) throw new Error(swimmerResult.error?.message ?? 'Unable to create swimmer.')

            const eventRow = {
                event_id: eventId,
                swimmer_id: swimmerResult.data.id,
                swimmer_name: seeded.rosterEntry.swimmer_name,
                team_code: seeded.rosterEntry.team_code,
                gender: seeded.rosterEntry.gender,
                seed_time: seeded.rosterEntry.seed_time,
                seed_time_seconds: parseSeedTimeSeconds(seeded.rosterEntry.seed_time),
                seed_course: course,
                lane: seeded.laneNumber,
                heat: seeded.heatNumber,
                lane_number: seeded.laneNumber,
                heat_number: seeded.heatNumber,
            }
            const [heatResult, meetEntryResult] = await Promise.all([
                (supabase.from('heat_entries' as any) as any).insert(eventRow),
                (supabase.from('meet_entries' as any) as any).insert(eventRow),
            ])
            if (heatResult.error || meetEntryResult.error) throw new Error(heatResult.error?.message ?? meetEntryResult.error?.message ?? 'Unable to seed heat entries.')
            seededRows += 1
        }
    }

    if (firstEventId) {
        const { error: meetUpdateError } = await (supabase.from('meets' as any) as any).update({ current_event_id: firstEventId, current_heat: 1, current_heat_number: 1 }).eq('id', meetId)
        if (meetUpdateError) throw new Error(meetUpdateError.message)
    }

    if (!seededRows) throw new Error('Roster rows could not be seeded for this meet.')
    return { attemptedRows: uniqueEntryRows.length, importedRows: seededRows, failedRows: uniqueEntryRows.length - seededRows }
}