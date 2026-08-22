import React from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'

export default function MeetCard({ meet }: { meet: { id: string; name: string; date: string | null; location: string | null; is_published?: boolean; payment_status?: string; paid_until?: string | null } }) {
    const paid = meet.payment_status === 'paid' && !!meet.paid_until && new Date(meet.paid_until) > new Date()
    return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{meet.name}</h3>
                    <p className="text-sm text-slate-600">{meet.location ?? 'No location'}</p>
                </div>
                <div className="text-right text-sm text-slate-500">{meet.date ?? 'No date'}{meet.is_published || meet.payment_status === 'paid' ? <div className="mt-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Published</div> : null}</div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <a href={`/portal/${meet.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200 hover:text-slate-900"><ExternalLink size={14} />Live Portal</a>
                {!paid ? <a href={`/meets/${meet.id}/checkout`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100">Checkout</a> : null}
                <a href={`/meets/${meet.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-transparent bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-600">Manage Meet <ArrowRight size={14} /></a>
            </div>
        </div>
    )
}
