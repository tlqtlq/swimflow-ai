import { createSupabaseAdminClient } from '@/lib/supabase'

export type ParsedRoster = {
    swimmers: Array<{
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
    let importedRows = 0

    for (const swimmer of parsed.swimmers) {
        const firstName = swimmer.firstName?.trim() || null
        const lastName = swimmer.lastName?.trim() || null
        if (!firstName && !lastName) continue

        const swimmerResult = await (supabase.from('swimmers' as any) as any).insert({
            organization_id: meet.organization_id,
            first_name: firstName,
            last_name: lastName,
            age: swimmer.age ?? null,
            grade: swimmer.grade ?? null,
        }).select('id').single()
        if (swimmerResult.error || !swimmerResult.data) continue

        for (const eventEntry of swimmer.events) {
            attemptedRows += 1
            const eventName = eventEntry.name.trim() || 'Unknown Event'
            const course = eventEntry.course === 'LCM' ? 'LCM' : 'SCY'
            const eventResult = await (supabase.from('events' as any) as any).insert({ meet_id: meetId, name: eventName, course, heat_count: 1 }).select('id').single()
            if (eventResult.error || !eventResult.data) continue

            const seedTime = eventEntry.seedTime ?? null
            const eventRow = {
                event_id: eventResult.data.id,
                swimmer_id: swimmerResult.data.id,
                swimmer_name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Swimmer',
                team_code: swimmer.teamCode ?? null,
                gender: swimmer.gender ?? null,
                seed_time: seedTime,
                seed_time_seconds: parseSeedTimeSeconds(seedTime),
                seed_course: course,
                lane: null,
                heat: null,
                lane_number: null,
                heat_number: null,
            }

            const [heatResult, meetEntryResult, entryResult] = await Promise.all([
                (supabase.from('heat_entries' as any) as any).insert(eventRow),
                (supabase.from('meet_entries' as any) as any).insert(eventRow),
                (supabase.from('entries' as any) as any).insert({
                    meet_id: meetId,
                    swimmer_name: eventRow.swimmer_name,
                    team_code: eventRow.team_code,
                    age: swimmer.age ?? null,
                    gender: eventRow.gender,
                    event_name: eventName,
                    seed_time: seedTime,
                }),
            ])

            if (!heatResult.error && !meetEntryResult.error && !entryResult.error) importedRows += 1
        }
    }

    return { attemptedRows, importedRows, failedRows: attemptedRows - importedRows }
}