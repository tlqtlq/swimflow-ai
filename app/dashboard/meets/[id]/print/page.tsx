import { createSupabaseServerClient } from '@/lib/supabase'
import PrintButton from '@/components/PrintButton'

export default async function PrintMeetPage({ params, searchParams }: { params: { id: string }; searchParams?: { view?: string } }) {
    const supabase = createSupabaseServerClient()
    if (!supabase) return <div className="py-10 text-slate-600">Supabase is not configured.</div>

    const { data: meet } = await (supabase.from('meets' as any) as any).select('*').eq('id', params.id).single()
    const { data: events } = await (supabase.from('events' as any) as any).select('*').eq('meet_id', params.id).order('name')
    const eventIds = (events ?? []).map((event: { id: string }) => event.id)
    const { data: entries } = eventIds.length
        ? await (supabase.from('meet_entries' as any) as any).select('*').in('event_id', eventIds).not('heat_number', 'is', null).order('heat_number').order('lane_number')
        : { data: [] }
    const resultView = searchParams?.view === 'results'

    return (
        <div className="print-sheet mx-auto max-w-5xl space-y-8 py-8 text-slate-900">
            <div className="no-print flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-600">Print center</p>
                    <h1 className="mt-1 text-3xl font-semibold">{resultView ? 'Official results' : 'Heat sheet'}</h1>
                </div>
                <div className="flex gap-2">
                    <a href={`/dashboard/meets/${params.id}/print?view=${resultView ? 'heats' : 'results'}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{resultView ? 'Heat sheet' : 'Results'}</a>
                    <PrintButton />
                </div>
            </div>
            <header className="border-b-2 border-slate-900 pb-4">
                <h2 className="text-2xl font-bold">{meet?.name ?? 'Swim meet'}</h2>
                <p className="mt-1 text-sm">{meet?.location ?? ''} {meet?.meet_date ? `| ${meet.meet_date}` : ''}</p>
            </header>
            <main className="space-y-8">
                {(events ?? []).map((event: { id: string; name: string; course?: string | null }) => {
                    const eventEntries = (entries ?? []).filter((entry: { event_id: string }) => entry.event_id === event.id)
                    const heatNumbers = eventEntries.map((entry: { heat_number?: number | null; heat?: number | null }) => entry.heat_number ?? entry.heat ?? 1) as number[]
                    const heats = Array.from(new Set(heatNumbers)).sort((a, b) => a - b)
                    return heats.map((heat) => (
                        <section key={`${event.id}-${heat}`} className="break-inside-avoid">
                            <div className="flex items-baseline justify-between border-b border-slate-400 pb-2">
                                <h3 className="text-lg font-bold">{event.name} {event.course ? `(${event.course})` : ''}</h3>
                                <span className="text-sm font-semibold">Heat {heat}</span>
                            </div>
                            <table className="mt-2 w-full border-collapse text-sm">
                                <thead><tr className="border-b border-slate-300 text-left"><th className="w-16 py-2">Lane</th><th className="py-2">Swimmer</th><th className="w-28 py-2">{resultView ? 'Place' : 'Seed time'}</th><th className="w-28 py-2">{resultView ? 'Result' : 'Team'}</th></tr></thead>
                                <tbody>{eventEntries.filter((entry: { heat_number?: number | null; heat?: number | null }) => (entry.heat_number ?? entry.heat ?? 1) === heat).map((entry: { id: string; lane_number?: number | null; lane?: number | null; swimmer_name?: string | null; seed_time?: string | null; result_time?: string | null; place?: number | null }) => <tr key={entry.id} className="border-b border-slate-100"><td className="py-2">{entry.lane_number ?? entry.lane ?? '-'}</td><td className="py-2 font-medium">{entry.swimmer_name ?? 'Swimmer'}</td><td className="py-2">{resultView ? entry.place ?? '-' : entry.seed_time ?? '-'}</td><td className="py-2">{resultView ? entry.result_time ?? '-' : ''}</td></tr>)}</tbody>
                            </table>
                        </section>
                    ))
                })}
            </main>
            <style>{`@media print { @page { size: letter; margin: .55in; } body { background: white !important; } .no-print { display: none !important; } .print-sheet { max-width: none !important; padding: 0 !important; } }`}</style>
        </div>
    )
}
