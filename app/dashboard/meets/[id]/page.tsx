import { createSupabaseServerClient } from '@/lib/supabase'
import MeetBillingControls from '@/components/MeetBillingControls'
import MeetPortalQr from '@/components/MeetPortalQr'
import PaymentStatus from '@/components/PaymentStatus'
import DeckController from '@/components/DeckController'
import MeetSettings from '@/components/MeetSettings'
import { getPortalUrl } from '@/lib/app-url'
import RosterImportModal from '@/components/RosterImportModal'
import MeetCustomization from '@/components/MeetCustomization'
import MeetDashboardHeader from '@/components/MeetDashboardHeader'
import { ClipboardList } from 'lucide-react'

export default async function MeetDashboardPage({ params, searchParams }: { params: { id: string }; searchParams?: { payment?: string } }) {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
        return <div className="container py-10 text-slate-600">Supabase is not configured.</div>
    }

    const [meetResult, eventsResult, locationsResult] = await Promise.all([
        supabase.from('meets').select('*').eq('id', params.id).single(),
        supabase.from('events').select('*').eq('meet_id', params.id).order('name'),
        (supabase.from('locations' as any) as any).select('*').order('name'),
    ])

    const meet = (meetResult.data ?? null) as { id?: string; name?: string; location?: string | null; location_id?: string | null; course_type?: 'SCY' | 'LCM' | 'SCM'; meet_date?: string | null; paid_until?: string | null; payment_status?: string; is_published?: boolean; status?: string; accent_color?: string | null; current_event_id?: string | null; current_heat_number?: number; current_heat?: number } | null
    const isLive = meet?.status === 'live' || Boolean(meet?.is_published)
    const events = ((eventsResult.data ?? []) as Array<{ id: string; name: string; course?: string }>)
    const locations = ((locationsResult.data ?? []) as Array<{ id: string; name: string; address: string | null; course_type_default: 'SCY' | 'LCM' | 'SCM' }>)
    const eventIds = events.map((event) => event.id)
    const eventEntries = (eventIds.length
        ? (await supabase.from('meet_entries').select('*').in('event_id', eventIds).order('heat_number', { ascending: true, nullsFirst: true }).order('lane_number', { ascending: true, nullsFirst: true })).data ?? []
        : []) as Array<{ id: string; event_id: string; swimmer_name?: string | null; heat_number?: number | null; heat?: number | null; lane_number?: number | null; lane?: number | null; result_time?: string | null }>
    const rosterEntries = ((await (supabase.from('entries') as any).select('id, event_name, swimmer_name, team_code, seed_time').eq('meet_id', params.id).order('event_name').order('swimmer_name')).data ?? []) as Array<{ id: string; event_name: string; swimmer_name: string; team_code?: string | null; seed_time?: string | null }>
    const rosterByEvent = rosterEntries.reduce<Record<string, typeof rosterEntries>>((groups, entry) => {
        const eventName = entry.event_name || 'Unassigned event'
        groups[eventName] = [...(groups[eventName] ?? []), entry]
        return groups
    }, {})

    return (
        <div className="mx-auto max-w-6xl space-y-8 py-8">
            <PaymentStatus status={searchParams?.payment} meetId={params.id} />
            {!(meet?.payment_status === 'paid' && meet.paid_until && new Date(meet.paid_until) > new Date()) ? <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><div><p className="font-semibold text-blue-950">This meet is currently an unpublished draft.</p><p className="text-sm text-blue-800">Complete payment to publish the live spectator portal.</p></div><a href={`/meets/${params.id}/checkout`} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-medium text-white hover:bg-[#002878]">Pay to Publish</a></section> : null}
            <div className="relative"><MeetDashboardHeader initialMeet={{ name: meet?.name ?? 'Meet Details', location: meet?.location ?? null, date: meet?.meet_date ?? null, accentColor: meet?.accent_color ?? null }} isLive={isLive} /><div className="absolute bottom-6 right-6"><MeetBillingControls meetId={params.id} paidUntil={meet?.paid_until} isPublished={meet?.is_published} /></div></div>

            <nav className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1.5 text-sm">
                <RosterImportModal meetId={params.id} className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200" />
                <a href={`/dashboard/meets/${params.id}/print`} className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200">Print Heat Sheet</a>
                <a href={`/dashboard/meets/${params.id}/print?view=results`} className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200">Print Results</a>
                <a href={getPortalUrl(meet?.id ?? params.id)} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-800 transition-all hover:bg-slate-200">Live Portal</a>
            </nav>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                    <MeetCustomization meetId={params.id} name={meet?.name ?? 'Swim meet'} location={meet?.location} date={meet?.meet_date} accentColor={meet?.accent_color} />
                    <MeetSettings meetId={params.id} courseType={meet?.course_type ?? 'SCY'} locationId={meet?.location_id} locations={locations} />
                </div>
                <div className="lg:col-span-5">
                    <MeetPortalQr meetId={meet?.id ?? params.id} meetName={meet?.name ?? 'Swim meet'} />
                </div>
            </section>
            <DeckController meetId={params.id} events={events.map((event) => ({ id: event.id, name: event.name, course: event.course }))} entries={eventEntries} currentEventId={meet?.current_event_id} currentHeat={meet?.current_heat ?? meet?.current_heat_number ?? 1} courseType={meet?.course_type ?? 'SCY'} />

            <section className="grid gap-5 md:grid-cols-2">
                {events.length === 0 ? (
                    <div className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm md:col-span-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ClipboardList size={22} aria-hidden="true" /></span>
                        <h2 className="mt-4 text-xl font-semibold text-slate-900">No Heats or Swimmers Loaded</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Upload a roster file (.csv or .hy3) in Director Settings above to automatically populate events and heat assignments.</p>
                        <div className="mt-6"><RosterImportModal meetId={params.id} /></div>
                    </div>
                ) : (
                    events.map((event) => {
                        const eventRows = eventEntries.filter((entry) => entry.event_id === event.id)
                        return (
                            <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-xl font-semibold text-slate-900"><a href={`/dashboard/meets/${params.id}/events/${event.id}/score`} className="hover:text-sky-600">{event.name}</a></h2>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{event.course ?? 'SCY'}</span>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {eventRows.length === 0 ? (
                                        <p className="text-sm text-slate-500">No swimmers seeded yet.</p>
                                    ) : (
                                        eventRows.map((row) => (
                                            <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                                <span className="font-medium text-slate-800">{row.swimmer_name ?? 'Swimmer'}</span>
                                                <span className="text-slate-500">Heat {row.heat_number ?? row.heat ?? 1} · Lane {row.lane_number ?? row.lane ?? 0}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </article>
                        )
                    })
                )}
            </section>
            {Object.keys(rosterByEvent).length > 0 ? <section className="space-y-3"><div><p className="text-sm font-medium uppercase tracking-[0.14em] text-sky-600">Imported roster</p><h2 className="mt-1 text-2xl font-semibold text-slate-900">Swimmers by event</h2></div>{Object.entries(rosterByEvent).map(([eventName, eventRoster]) => <details key={eventName} className="rounded-xl border border-slate-200 bg-white p-4" open><summary className="cursor-pointer font-semibold text-slate-900">{eventName} <span className="ml-2 text-sm font-normal text-slate-500">{eventRoster.length} swimmer{eventRoster.length === 1 ? '' : 's'}</span></summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{eventRoster.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-800">{entry.swimmer_name}</span><span className="text-right text-slate-500">{entry.team_code ?? ''}{entry.team_code && entry.seed_time ? ' · ' : ''}{entry.seed_time ?? ''}</span></div>)}</div></details>)}</section> : null}
        </div>
    )
}
