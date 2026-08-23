import PaymentStatus from '@/components/PaymentStatus'
import MeetCard from '@/components/MeetCard'
import { createSupabaseServerClient } from '@/lib/supabase'
import { CalendarPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage({ searchParams }: { searchParams?: { payment?: string; meetId?: string; debug?: string } }) {
    const supabase = createSupabaseServerClient()
    const debugEnabled = searchParams?.debug === '1'
    let meets: Array<{ id: string; name: string; meet_date: string | null; location: string | null; is_published?: boolean; payment_status?: string; paid_until?: string | null }> = []
    let queryError: string | null = null
    if (supabase) {
        try {
            const result = await supabase.from('meets').select('*').eq('payment_status', 'paid').order('meet_date', { ascending: true })
            if (result.error) {
                queryError = result.error.message
                console.error('Unable to load paid meets:', result.error.message)
            }
            meets = (result.data ?? []) as typeof meets
        } catch (error) {
            queryError = error instanceof Error ? error.message : 'Unknown dashboard query error.'
            console.error('Unable to load paid meets:', error)
            meets = []
        }
    }
    const supabaseHost = (() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
        try {
            return url ? new URL(url).host : null
        } catch {
            return 'Invalid Supabase URL'
        }
    })()
    return <div className="space-y-8"><PaymentStatus status={searchParams?.payment} meetId={searchParams?.meetId} /><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-600">SwimFlow.ai</p><h1 className="mt-1 text-3xl font-semibold text-slate-900">Meet dashboard</h1><p className="mt-2 text-slate-600">Manage live decks, results, and spectator portals.</p></div><a href="/api/demo/seed" className="rounded-lg bg-[#003296] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#002878]">Create Meet</a></header>{debugEnabled ? <details open className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800"><summary className="cursor-pointer font-semibold">Dashboard data diagnostics</summary><dl className="mt-3 grid gap-2 sm:grid-cols-2"><div><dt className="text-slate-500">Supabase configured</dt><dd>{supabase ? 'Yes' : 'No'}</dd></div><div><dt className="text-slate-500">Supabase host</dt><dd>{supabaseHost ?? 'Not configured'}</dd></div><div><dt className="text-slate-500">Paid meet count</dt><dd>{meets.length}</dd></div><div><dt className="text-slate-500">Query error</dt><dd>{queryError ?? 'None'}</dd></div></dl><pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-xs">{JSON.stringify(meets.map((meet) => ({ id: meet.id, name: meet.name, paymentStatus: meet.payment_status, published: meet.is_published })), null, 2)}</pre></details> : null}<section id="active-meets"><h2 className="mb-3 text-lg font-semibold text-slate-900">Active meets</h2>{meets.length ? <div className="grid gap-4 md:grid-cols-2">{meets.map((meet) => <MeetCard key={meet.id} meet={{ id: meet.id, name: meet.name, date: meet.meet_date, location: meet.location, is_published: meet.is_published, payment_status: meet.payment_status, paid_until: meet.paid_until }} />)}</div> : <div className="rounded-xl border border-slate-200 bg-white py-12 text-center"><CalendarPlus className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" /><p className="mb-4 mt-3 text-slate-500">No active meets found.</p><a href="/api/demo/seed" className="inline-flex items-center gap-2 rounded-lg bg-[#003296] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#002878]"><CalendarPlus size={16} aria-hidden="true" />Create Your First Meet</a></div>}</section></div>
}