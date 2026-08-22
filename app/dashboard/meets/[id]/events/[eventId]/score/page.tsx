import Scorekeeper from '@/components/Scorekeeper'
import { createSupabaseServerClient } from '@/lib/supabase'

type Entry = {
    id: string
    swimmer_name: string | null
    lane_number: number | null
    lane: number | null
    heat_number: number | null
    heat: number | null
    result_time: string | null
    place: number | null
}

export default async function ScorePage({ params }: { params: { id: string; eventId: string } }) {
    const supabase = createSupabaseServerClient()
    if (!supabase) return <div className="py-10 text-slate-600">Supabase is not configured.</div>

    const [{ data: event }, { data: heatEntryRows }, { data: meetEntryRows }] = await Promise.all([
        (supabase.from('events' as any) as any).select('*').eq('id', params.eventId).single(),
        (supabase.from('heat_entries' as any) as any).select('*').eq('event_id', params.eventId).order('heat_number').order('lane_number'),
        (supabase.from('meet_entries' as any) as any).select('*').eq('event_id', params.eventId).order('heat_number').order('lane_number'),
    ])
    const entryRows = (heatEntryRows?.length ? heatEntryRows : meetEntryRows) ?? []

    return <Scorekeeper eventId={params.eventId} eventName={event?.name ?? 'Event'} entries={entryRows as Entry[]} />
}
