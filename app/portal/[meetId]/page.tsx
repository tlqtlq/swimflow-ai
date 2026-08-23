import { createSupabaseServerClient } from '@/lib/supabase'
import LiveSpectatorPortal from '@/components/LiveSpectatorPortal'

export default async function MeetPortalPage({ params }: { params: { meetId: string } }) {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
        return <div className="container py-10 text-slate-600">Supabase is not configured.</div>
    }

    const meet = (await supabase.from('meets').select('*').eq('id', params.meetId).single()).data as { name?: string | null; location?: string | null; location_id?: string | null; meet_date?: string | null; accent_color?: string | null; course_type?: 'SCY' | 'LCM' | 'SCM'; status?: string; is_published?: boolean; current_event_id?: string | null; current_heat_number?: number; current_heat?: number } | null
    if (!meet || (!meet.is_published && !['published', 'live', 'completed'].includes(meet.status ?? ''))) {
        return <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">This meet portal is not published yet.</div>
    }
    const location = meet.location_id ? (await (supabase.from('locations' as any) as any).select('name,address').eq('id', meet.location_id).maybeSingle()).data as { name?: string; address?: string | null } | null : null
    const events = ((await supabase.from('events').select('*').eq('meet_id', params.meetId).order('name')).data ?? []) as Array<{ id: string; name: string; course?: string | null }>
    const rosterEntries = ((await (supabase.from('entries') as any).select('id, event_name, swimmer_name, team_code, seed_time').eq('meet_id', params.meetId).order('event_name').order('swimmer_name')).data ?? []) as Array<{ id: string; event_name: string; swimmer_name: string; team_code?: string | null; seed_time?: string | null }>
    const activeEventNames = new Set(rosterEntries.map((entry) => entry.event_name).filter(Boolean))
    const activeEvents = events.filter((event) => activeEventNames.has(event.name))
    const eventIds = activeEvents.map((event) => event.id)

    const entries = (eventIds.length
        ? (await supabase.from('meet_entries').select('*').in('event_id', eventIds).not('heat_number', 'is', null).order('heat_number', { ascending: true }).order('lane_number', { ascending: true })).data ?? []
        : []) as Array<{ id: string; event_id: string; lane_number?: number | null; lane?: number | null; swimmer_name?: string | null; heat_number?: number | null; heat?: number | null; seed_time?: string | null; result_time?: string | null; place?: number | null }>

    return <div className="mx-auto max-w-5xl space-y-4 py-8"><LiveSpectatorPortal meetId={params.meetId} meetName={meet.name ?? 'Meet'} meetLocation={location?.name ?? meet.location ?? 'Venue to be announced'} meetDate={meet.meet_date ?? null} accentColor={meet.accent_color ?? null} locationAddress={location?.address ?? null} events={activeEvents} initialEntries={entries} rosterEntries={rosterEntries} currentEventId={meet.current_event_id} currentHeat={meet.current_heat ?? meet.current_heat_number ?? 1} courseType={meet.course_type ?? 'SCY'} /></div>
}
