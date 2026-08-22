import { createSupabaseAdminClient } from '@/lib/supabase'

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

    const entryResult = await (supabase.from('entries' as any) as any).insert(entryRows).select('id')
    const importedRows = entryResult.error ? 0 : (entryResult.data?.length ?? entryRows.length)
    let seededRows = 0

    for (const swimmer of parsed.swimmers) {
        const fullName = swimmer.swimmerName?.trim() || ''
        const [derivedFirstName = '', ...derivedLastName] = fullName.split(/\s+/).filter(Boolean)
        const firstName = swimmer.firstName?.trim() || derivedFirstName || null
        const lastName = swimmer.lastName?.trim() || derivedLastName.join(' ') || null
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

            const [heatResult, meetEntryResult] = await Promise.all([
                (supabase.from('heat_entries' as any) as any).insert(eventRow),
                (supabase.from('meet_entries' as any) as any).insert(eventRow),
            ])

            if (!meetEntryResult.error) seededRows += 1
            void heatResult
        }
    }

    const savedRows = seededRows || importedRows
    if (!savedRows) throw new Error(entryResult.error?.message ?? 'Roster rows could not be seeded for this meet.')

    return { attemptedRows, importedRows: savedRows, failedRows: attemptedRows - savedRows }
}