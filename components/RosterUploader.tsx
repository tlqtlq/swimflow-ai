'use client'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

type ParsedRoster = {
    swimmers: Array<{
        swimmerName: string
        firstName?: string | null
        lastName?: string | null
        age?: number | null
        teamCode?: string | null
        gender?: string | null
        events: Array<{ name: string; seedTime?: string | null; course?: 'SCY' | 'LCM' | null }>
    }>
}

type RosterImportResult = ParsedRoster & {
    importSummary: { attemptedRows: number; importedRows: number; failedRows: number }
}

const parseCsvRow = (line: string) => {
    const fields: string[] = []
    let field = ''
    let quoted = false

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                field += '"'
                index += 1
            } else {
                quoted = !quoted
            }
        } else if (character === ',' && !quoted) {
            fields.push(field.trim())
            field = ''
        } else {
            field += character
        }
    }

    fields.push(field.trim())
    return fields
}

const parseRosterFile = (content: string): ParsedRoster => {
    const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (lines.length < 2) return { swimmers: [] }

    const aliases: Record<string, string[]> = {
        swimmerName: ['swimmername', 'name', 'athlete'],
        firstName: ['firstname'],
        lastName: ['lastname'],
        teamCode: ['teamcode', 'team'],
        age: ['age'],
        gender: ['gender'],
        eventName: ['eventname', 'event'],
        seedTime: ['seedtime'],
        course: ['course'],
    }
    const headers = parseCsvRow(lines[0]).map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const valueAt = (fields: string[], field: keyof typeof aliases, fallback: number) => {
        const index = headers.findIndex((header) => aliases[field].includes(header))
        return fields[index >= 0 ? index : fallback]?.trim() ?? ''
    }

    return {
        swimmers: lines.slice(1).flatMap((line) => {
            const fields = parseCsvRow(line)
            if (fields.length < 2) return []

            const swimmerName = valueAt(fields, 'swimmerName', 0)
            const [firstFromName = '', ...lastFromName] = swimmerName.split(/\s+/).filter(Boolean)
            const firstName = valueAt(fields, 'firstName', 0) || firstFromName
            const lastName = valueAt(fields, 'lastName', 1) || lastFromName.join(' ')
            const eventName = valueAt(fields, 'eventName', 2)
            const seedTime = valueAt(fields, 'seedTime', 3)
            const course = valueAt(fields, 'course', 4).toUpperCase()
            const ageValue = Number(valueAt(fields, 'age', 6))

            if (!swimmerName.trim() && !firstName && !lastName) return []
            return [{
                swimmerName: swimmerName.trim() || `${firstName} ${lastName}`.trim(),
                firstName: firstName || null,
                lastName: lastName || null,
                age: Number.isFinite(ageValue) ? ageValue : null,
                teamCode: valueAt(fields, 'teamCode', -1) || null,
                gender: valueAt(fields, 'gender', -1) || null,
                events: [{
                    name: eventName || 'Unknown Event',
                    seedTime: seedTime || null,
                    course: course === 'SCY' || course === 'LCM' ? course : null,
                }],
            }]
        }),
    }
}

export default function RosterUploader({ meetId }: { meetId: string }) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [result, setResult] = useState<RosterImportResult | null>(null)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [summary, setSummary] = useState<{ swimmers: number; heats: Record<string, number>; rows: number } | null>(null)

    const handleFileSelection = (file: File | null) => {
        setSelectedFile(file)
        setError('')
        setSuccessMessage('')
        setResult(null)
        setSummary(null)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const file = selectedFile ?? inputRef.current?.files?.[0] ?? null

        if (!(file instanceof File) || !file.name) {
            setError('Please choose a CSV or PDF roster file before uploading.')
            setResult(null)
            return
        }

        setIsSubmitting(true)
        setError('')
        setSuccessMessage('')

        try {
            const parsedRoster = parseRosterFile(await file.text())
            if (parsedRoster.swimmers.length === 0) {
                setError('No roster rows were detected in this file.')
                return
            }

            const response = await fetch('/api/meets/roster', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ meetId, roster: parsedRoster }),
            })
            const payload = await response.json() as RosterImportResult | { message?: string }
            if (!response.ok || !('importSummary' in payload)) {
                throw new Error('message' in payload ? payload.message : 'Unable to import roster.')
            }

            const parsed = payload
            const rowCount = parsed.importSummary.attemptedRows

            setResult(parsed)
            const heatCounts = new Map<string, number>()
            for (const swimmer of parsed.swimmers) {
                for (const event of swimmer.events ?? []) {
                    const eventName = event.name || 'Unknown Event'
                    heatCounts.set(eventName, (heatCounts.get(eventName) ?? 0) + 1)
                }
            }

            setSummary({
                swimmers: parsed.swimmers.length,
                rows: parsed.importSummary.importedRows,
                heats: Object.fromEntries(heatCounts.entries()),
            })

            if (parsed.importSummary.importedRows > 0 && parsed.importSummary.failedRows === 0) {
                setSuccessMessage(`Successfully imported ${parsed.importSummary.importedRows} roster rows for ${parsed.swimmers.length} swimmer${parsed.swimmers.length === 1 ? '' : 's'}.`)
            } else if (parsed.importSummary.importedRows > 0) {
                setSuccessMessage(`Imported ${parsed.importSummary.importedRows} roster rows. ${parsed.importSummary.failedRows} row${parsed.importSummary.failedRows === 1 ? '' : 's'} could not be saved.`)
            } else {
                setError(rowCount > 0 ? 'The roster was parsed, but none of its rows could be saved.' : 'No roster rows were detected in this file.')
            }
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Unable to parse roster.')
            setResult(null)
            setSummary(null)
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
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault()
                        setIsDragging(false)
                        const droppedFile = event.dataTransfer.files?.[0] ?? null
                        handleFileSelection(droppedFile)
                        if (droppedFile && inputRef.current) {
                            const dataTransfer = new DataTransfer()
                            dataTransfer.items.add(droppedFile)
                            inputRef.current.files = dataTransfer.files
                        }
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        name="file"
                        accept=".csv,.hy3,.txt,text/csv,text/plain"
                        className="hidden"
                        onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                    />
                    <div className="mb-3 rounded-full bg-white p-3 shadow-sm">
                        <span className="text-lg">📁</span>
                    </div>
                    <p className="text-base font-medium text-slate-800">{selectedFile ? selectedFile.name : 'Drag and drop a roster here'}</p>
                    <p className="mt-1 text-sm text-slate-500">{selectedFile ? 'Click to choose a different file' : 'or click to select a CSV, HY3, or text file'}</p>
                </label>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#003296] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#002878] disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {isSubmitting ? 'Uploading roster…' : 'Upload roster'}
                </button>
            </form>

            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {successMessage ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</p> : null}

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

            {summary ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-600 p-4 font-bold text-white shadow-xl">
                    <p>{summary.rows} rows imported across {summary.swimmers} swimmers</p>
                    <p className="mt-1 text-sm">Heat distribution: {Object.entries(summary.heats).map(([event, count]) => `${event}: ${count}`).join(' · ') || 'No events detected'}</p>
                </div>
            ) : null}
        </div>
    )
}
