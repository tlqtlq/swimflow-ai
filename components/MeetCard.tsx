import React from 'react'

export default function MeetCard({ meet }: { meet: { id: string; name: string; date: string | null; location: string | null; is_published?: boolean; payment_status?: string } }) {
    return (
        <div className="p-4 bg-white rounded shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{meet.name}</h3>
                    <p className="text-sm text-slate-600">{meet.location ?? 'No location'}</p>
                </div>
                <div className="text-right text-sm text-slate-500">{meet.date ?? 'No date'}{meet.is_published || meet.payment_status === 'paid' ? <div className="mt-2 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Published</div> : null}</div>
            </div>
            <div className="mt-3 flex gap-2">
                <a href={`/portal/${meet.id}`} className="text-sm text-sky-600 hover:underline">
                    Live Portal
                </a>
                <a href={`/meets/${meet.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white">Manage Meet</a>
            </div>
        </div>
    )
}
