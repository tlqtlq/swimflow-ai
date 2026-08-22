import { createSupabaseServerClient } from '@/lib/supabase'
import MeetBillingControls from '@/components/MeetBillingControls'
import MeetPortalQr from '@/components/MeetPortalQr'
import PaymentStatus from '@/components/PaymentStatus'
import DeckController from '@/components/DeckController'
import MeetSettings from '@/components/MeetSettings'
import { getPortalUrl } from '@/lib/app-url'
import RosterImportModal from '@/components/RosterImportModal'

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

    const meet = (meetResult.data ?? null) as { id?: string; name?: string; location?: string | null; location_id?: string | null; course_type?: 'SCY' | 'LCM' | 'SCM'; meet_date?: string | null; paid_until?: string | null; payment_status?: string; is_published?: boolean; current_event_id?: string | null; current_heat_number?: number; current_heat?: number } | null
    const events = ((eventsResult.data ?? []) as Array<{ id: string; name: string; course?: string }>)
    const locations = ((locationsResult.data ?? []) as Array<{ id: string; name: string; address: string | null; course_type_default: 'SCY' | 'LCM' | 'SCM' }>)
    const eventIds = events.map((event) => event.id)
    const eventEntries = (eventIds.length
        ? (await supabase.from('meet_entries').select('*').in('event_id', eventIds).order('heat_number', { ascending: true, nullsFirst: true }).order('lane_number', { ascending: true, nullsFirst: true })).data ?? []
        : []) as Array<{ id: string; event_id: string; swimmer_name?: string | null; heat_number?: number | null; heat?: number | null; lane_number?: number | null; lane?: number | null; result_time?: string | null }>

    return (
        <div className="mx-auto max-w-6xl space-y-8 py-8">
            <PaymentStatus status={searchParams?.payment} meetId={params.id} />
            {!(meet?.payment_status === 'paid' && meet.paid_until && new Date(meet.paid_until) > new Date()) ? <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><div><p className="font-semibold text-blue-950">This meet is currently an unpublished draft.</p><p className="text-sm text-blue-800">Complete payment to publish the live spectator portal.</p></div><a href={`/meets/${params.id}/checkout`} className="rounded-lg bg-[#003296] px-4 py-2 text-sm font-medium text-white hover:bg-[#002878]">Pay to Publish</a></section> : null}
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-600">Meet dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">{meet?.name ?? 'Meet Details'}</h1>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                    <p className="text-slate-600">{meet?.location ?? 'No location'} · {meet?.meet_date ?? 'No date'} · {meet?.course_type ?? 'SCY'}</p>
                    <MeetBillingControls meetId={params.id} paidUntil={meet?.paid_until} isPublished={meet?.is_published} />
                </div>
            </header>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
                <RosterImportModal meetId={params.id} />
                <a href={`/dashboard/meets/${params.id}/print`} className="rounded-lg border border-slate-300 bg-white px-3 py-2">Print heat sheet</a>
                <a href={`/dashboard/meets/${params.id}/print?view=results`} className="rounded-lg border border-slate-300 bg-white px-3 py-2">Print results</a>
                <a href={`/dashboard/meets/${params.id}/summary`} className="rounded-lg border border-slate-300 bg-white px-3 py-2">Generate summary</a>
                <a href={getPortalUrl(meet?.id ?? params.id)} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-300 bg-white px-3 py-2">Live Portal</a>
            </nav>

            <MeetPortalQr meetId={meet?.id ?? params.id} meetName={meet?.name ?? 'Swim meet'} />
            <MeetSettings meetId={params.id} courseType={meet?.course_type ?? 'SCY'} locationId={meet?.location_id} locations={locations} />
            <DeckController meetId={params.id} events={events.map((event) => ({ id: event.id, name: event.name, course: event.course }))} entries={eventEntries} currentEventId={meet?.current_event_id} currentHeat={meet?.current_heat ?? meet?.current_heat_number ?? 1} courseType={meet?.course_type ?? 'SCY'} />

            <section className="grid gap-5 md:grid-cols-2">
                {events.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-slate-500 md:col-span-2">
                        No events have been created for this meet yet.
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
        </div>
    )
}
