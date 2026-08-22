'use server'

import OpenAI from 'openai'
import { createSupabaseAdminClient } from '@/lib/supabase'

type ResultRow = {
    event_id: string
    swimmer_name: string | null
    swimmer_id: string
    result_time: string | null
    result_time_seconds: number | null
    seed_time_seconds: number | null
    place: number | null
    is_personal_record: boolean
}

const pointsForPlace = (place: number | null) => ({ 1: 9, 2: 4, 3: 3, 4: 2, 5: 1 }[place ?? 0] ?? 0)

export async function generateMeetSummary(meetId: string) {
    const supabase = createSupabaseAdminClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const [{ data: meet }, { data: events }] = await Promise.all([
        (supabase.from('meets' as any) as any).select('*').eq('id', meetId).single(),
        (supabase.from('events' as any) as any).select('*').eq('meet_id', meetId).order('name'),
    ])
    if (!meet) throw new Error('Meet not found.')

    const eventIds = (events ?? []).map((event: { id: string }) => event.id)
    const { data: resultRows } = eventIds.length
        ? await (supabase.from('meet_entries' as any) as any).select('*').in('event_id', eventIds).not('result_time_seconds', 'is', null)
        : { data: [] }
    const rows = (resultRows ?? []) as ResultRow[]
    const eventNames = new Map((events ?? []).map((event: { id: string; name: string }) => [event.id, event.name]))
    const prs = rows.filter((row) => row.is_personal_record)
    const teamScore = rows.reduce((total, row) => total + pointsForPlace(row.place), 0)
    const metrics = {
        swimmersScored: new Set(rows.map((row) => row.swimmer_id)).size,
        resultsRecorded: rows.length,
        personalRecords: prs.length,
        teamScore,
        winners: rows.filter((row) => row.place === 1).map((row) => `${row.swimmer_name ?? 'Swimmer'} - ${eventNames.get(row.event_id) ?? 'Event'} (${row.result_time ?? '-'})`),
        prs: prs.map((row) => `${row.swimmer_name ?? 'Swimmer'} - ${eventNames.get(row.event_id) ?? 'Event'} (${row.result_time ?? '-'})`),
    }

    const fallback = `${meet.name} wrapped with ${metrics.resultsRecorded} recorded results, ${metrics.personalRecords} personal records, and ${metrics.teamScore} team points. ${metrics.winners.length ? `Event winners included ${metrics.winners.slice(0, 3).join('; ')}.` : 'Results are ready for review.'}`
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your_actual_openai_api_key') return { metrics, pressRelease: fallback }

    const client = new OpenAI({ apiKey })
    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: `Write a concise AP-style local sports press release for this swim meet. Use only these facts. Include a headline and 2-4 short paragraphs. Do not invent team names, locations, quotes, or dates. Meet: ${meet.name}. Metrics: ${JSON.stringify(metrics)}. Winners: ${metrics.winners.join('; ')}. Personal records: ${metrics.prs.join('; ')}.`,
    })
    return { metrics, pressRelease: response.output_text || fallback }
}
