'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseRosterAction, type ParsedRoster } from '@/lib/actions/parse-roster'

export default function RosterUploader({ meetId }: { meetId: string }) {
    const [isDragging, setIsDragging] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<ParsedRoster | null>(null)
    const [error, setError] = useState('')

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        const formData = new FormData(form)
        const file = formData.get('file')

        if (!(file instanceof File) || !file.name) {
            setError('Please choose a CSV or PDF roster file.')
            setResult(null)
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            const parsed = await parseRosterAction(formData, meetId)
            setResult(parsed)
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Unable to parse roster.')
            setResult(null)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-sky-600">Meet import</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Upload roster</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{meetId}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                        }`}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault()
                        setIsDragging(false)
                        const droppedFile = event.dataTransfer.files?.[0]
                        if (!droppedFile) return
                        const input = event.currentTarget.querySelector('input[name="file"]') as HTMLInputElement | null
                        if (!input) return
                        const dataTransfer = new DataTransfer()
                        dataTransfer.items.add(droppedFile)
                        input.files = dataTransfer.files
                    }}
                >
                    <input type="file" name="file" accept=".csv,.pdf,.txt" className="hidden" />
                    <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                        <span className="text-lg">📁</span>
                    </div>
                    <p className="text-base font-medium text-slate-800">Drag and drop a roster here</p>
                    <p className="mt-1 text-sm text-slate-500">or click to select CSV/PDF files</p>
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#003296] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#002878] disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {isSubmitting ? 'Parsing roster…' : 'Parse roster'}
                </button>
            </form>

            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            {result ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-700">Detected swimmers</p>
                    <div className="mt-3 space-y-2">
                        {result.swimmers.slice(0, 6).map((swimmer, index) => (
                            <div key={`${swimmer.firstName ?? 'swimmer'}-${swimmer.lastName ?? 'unknown'}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                                <span>
                                    {swimmer.firstName ?? 'Unknown'} {swimmer.lastName ?? ''}
                                </span>
                                <span className="text-slate-500">
                                    {swimmer.events?.[0]?.name ?? 'No event'}
                                    {swimmer.events?.[0]?.seedTime ? ` · ${swimmer.events[0].seedTime}` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                    {result.swimmers.length > 6 ? <p className="mt-2 text-xs text-slate-500">+{result.swimmers.length - 6} more swimmers found</p> : null}
                </div>
            ) : null}
        </div>
    )
}
