import PaymentStatus from '@/components/PaymentStatus'
import MeetCard from '@/components/MeetCard'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function DashboardPage({ searchParams }: { searchParams?: { payment?: string; meetId?: string } }) {
    const supabase = createSupabaseServerClient()
    let meets: Array<{ id: string; name: string; meet_date: string | null; location: string | null; is_published?: boolean; payment_status?: string; paid_until?: string | null }> = []
    if (supabase) {
        try {
            const result = await supabase.from('meets').select('*').eq('payment_status', 'paid').order('meet_date', { ascending: true })
            meets = (result.data ?? []) as typeof meets
        } catch {
            meets = []
        }
    }
    return <div className="space-y-8"><PaymentStatus status={searchParams?.payment} meetId={searchParams?.meetId} /><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">SwimFlow.ai</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">Meet dashboard</h1><p className="mt-2 text-slate-600">Manage live decks, results, and spectator portals.</p></div><a href="/api/demo/seed" className="rounded-lg bg-[#003296] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#002878]">Create demo meet</a></header><section><h2 className="mb-3 text-lg font-semibold text-slate-900">Active meets</h2>{meets.length ? <div className="grid gap-4 md:grid-cols-2">{meets.map((meet) => <MeetCard key={meet.id} meet={{ id: meet.id, name: meet.name, date: meet.meet_date, location: meet.location, is_published: meet.is_published, payment_status: meet.payment_status, paid_until: meet.paid_until }} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">No meets yet. Create the demo meet to start testing.</div>}</section></div>
}