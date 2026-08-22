'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'

export type ScoreInput = {
    entryId: string
    resultTime: string
}

const parseTimeSeconds = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, '')
    if (!normalized) return null
    const parts = normalized.split(':')
    const seconds = parts.length === 1 ? Number(parts[0]) : Number(parts[0]) * 60 + Number(parts[1])
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}

export async function saveEventResults(eventId: string, inputs: ScoreInput[]) {
    const supabase = createSupabaseAdminClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const heatResult = await (supabase.from('heat_entries' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('heat_number', { ascending: true, nullsFirst: true })
        .order('lane_number', { ascending: true, nullsFirst: true })
    const rows = ((heatResult.data?.length ? heatResult.data : (await (supabase.from('meet_entries' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('heat_number', { ascending: true, nullsFirst: true })
        .order('lane_number', { ascending: true, nullsFirst: true })).data ?? [])) as Array<{
            id: string
            swimmer_id: string
            heat_number: number | null
            heat: number | null
            seed_time_seconds: number | null
        }>

    const submitted = new Map(inputs.map((input) => [input.entryId, parseTimeSeconds(input.resultTime)]))
    const scoredRows = rows
        .map((row) => ({ ...row, resultTimeSeconds: submitted.get(row.id) ?? null }))
        .filter((row) => row.resultTimeSeconds !== null)

    const ranked = [...scoredRows].sort((a, b) => a.resultTimeSeconds! - b.resultTimeSeconds!)
    for (const [index, row] of ranked.entries()) {
        const resultTimeSeconds = row.resultTimeSeconds!
        const resultTime = inputs.find((input) => input.entryId === row.id)?.resultTime.trim() ?? String(resultTimeSeconds)
        const isPersonalRecord = row.seed_time_seconds !== null && resultTimeSeconds < row.seed_time_seconds
        const update = {
            result_time: resultTime,
            result_time_seconds: resultTimeSeconds,
            place: index + 1,
            is_personal_record: isPersonalRecord,
            scored_at: new Date().toISOString(),
        }

        const { error: heatError } = await (supabase.from('heat_entries' as any) as any).update(update).eq('id', row.id)
        if (heatError) throw new Error(heatError.message)

        const { error: meetError } = await (supabase.from('meet_entries' as any) as any)
            .update(update)
            .eq('event_id', eventId)
            .eq('swimmer_id', row.swimmer_id)
        if (meetError) throw new Error(meetError.message)
    }

    return { saved: scoredRows.length }
}
