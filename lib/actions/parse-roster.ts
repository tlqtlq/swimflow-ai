'use server'

import OpenAI from 'openai'
import { PDFParse } from 'pdf-parse'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const parsedRosterSchema = z.object({
    swimmers: z.array(
        z.object({
            firstName: z.string().nullable().optional(),
            lastName: z.string().nullable().optional(),
            age: z.number().nullable().optional(),
            grade: z.string().nullable().optional(),
            teamCode: z.string().nullable().optional(),
            gender: z.string().nullable().optional(),
            events: z.array(
                z.object({
                    name: z.string(),
                    seedTime: z.string().nullable().optional(),
                    course: z.enum(['SCY', 'LCM']).nullable().optional(),
                }),
            ),
        }),
    ),
})

export type ParsedRoster = z.infer<typeof parsedRosterSchema>

const FALLBACK_CSV_SCHEMA = {
    delimiter: ',',
}

const normalizeCsvRow = (raw: string) => {
    const row = raw.trim()
    if (!row) return null

    const values = row.split(FALLBACK_CSV_SCHEMA.delimiter).map((part) => part.trim())
    return values
}

const parseCsvFallback = (content: string): ParsedRoster => {
    const rows = content
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean)

    if (rows.length === 0) {
        return { swimmers: [] }
    }

    const swimmers: ParsedRoster['swimmers'] = []
    const headers = rows[0].split(',').map((header) => header.trim().toLowerCase())
    const column = (fields: string[], name: string, fallback: number) => {
        const index = headers.indexOf(name)
        return fields[index >= 0 ? index : fallback]?.trim() ?? ''
    }

    rows.slice(1).forEach((row) => {
        const fields = normalizeCsvRow(row)
        if (!fields || fields.length < 4) return

        const swimmerName = column(fields, 'swimmer_name', 0)
        const nameParts = swimmerName.split(/\s+/).filter(Boolean)
        const firstName = column(fields, 'first_name', 0) || nameParts.shift() || ''
        const lastName = column(fields, 'last_name', 1) || nameParts.join(' ')
        const eventName = column(fields, 'event_name', 2)
        const seedTime = column(fields, 'seed_time', 3)
        const teamCode = column(fields, 'team_code', 1)
        const gender = column(fields, 'gender', 3)
        const maybeCourse = column(fields, 'course', 4)
        const maybeAge = column(fields, 'age', 6)
        const maybeGrade = column(fields, 'grade', 7)
        const normalizedFirstName = firstName || null
        const normalizedLastName = lastName || null
        const normalizedAge = maybeAge ? Number(maybeAge) : null

        swimmers.push({
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            age: Number.isFinite(normalizedAge) ? normalizedAge : null,
            grade: maybeGrade || null,
            teamCode: teamCode || null,
            gender: gender || null,
            events: [
                {
                    name: eventName || 'Unknown Event',
                    seedTime: seedTime || null,
                    course: maybeCourse && ['SCY', 'LCM'].includes(maybeCourse.toUpperCase()) ? (maybeCourse.toUpperCase() as 'SCY' | 'LCM') : null,
                },
            ],
        })
    })

    return { swimmers }
}

const parseTextToRoster = async (content: string, filename = 'roster.csv'): Promise<ParsedRoster> => {
    const normalizedContent = content.trim()
    if (!normalizedContent) {
        return { swimmers: [] }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return parseCsvFallback(normalizedContent)
    }

    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: {
            type: 'json_schema',
            json_schema: {
                name: 'swim_roster_output',
                schema: {
                    type: 'object',
                    properties: {
                        swimmers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    firstName: { type: ['string', 'null'] },
                                    lastName: { type: ['string', 'null'] },
                                    age: { type: ['integer', 'null'] },
                                    grade: { type: ['string', 'null'] },
                                    events: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                seedTime: { type: ['string', 'null'] },
                                                course: { type: ['string', 'null'], enum: ['SCY', 'LCM', null] },
                                            },
                                            required: ['name'],
                                            additionalProperties: false,
                                        },
                                    },
                                },
                                required: ['events'],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ['swimmers'],
                    additionalProperties: false,
                },
            },
        },
        messages: [
            {
                role: 'system',
                content:
                    'You are parsing a swim meet roster. Extract swimmer first name, last name, age or grade, and event entries with seed times. Identify course as SCY or LCM when present. Return valid JSON only.',
            },
            {
                role: 'user',
                content: `File name: ${filename}\nRoster content:\n${content}`,
            },
        ],
    })

    const payload = completion.choices[0]?.message?.content
    if (!payload) {
        return { swimmers: [] }
    }

    const parsed = JSON.parse(payload) as unknown
    const result = parsedRosterSchema.parse(parsed)
    return result
}

const parseSeedTimeSeconds = (seedTime: string | number | null | undefined) => {
    if (seedTime === null || seedTime === undefined || seedTime === '') {
        return null
    }

    const raw = typeof seedTime === 'number' ? String(seedTime) : seedTime.trim()
    if (!raw) {
        return null
    }

    const normalized = raw.replace(/\s+/g, '')
    if (!normalized) {
        return null
    }

    if (!normalized.includes(':')) {
        const value = Number(normalized)
        return Number.isFinite(value) ? value : null
    }

    const [minutes, seconds] = normalized.split(':')
    const parsedMinutes = Number(minutes)
    const parsedSeconds = Number(seconds)
    if (Number.isNaN(parsedMinutes) || Number.isNaN(parsedSeconds)) {
        return null
    }

    return parsedMinutes * 60 + parsedSeconds
}

export async function persistParsedRosterToMeet(parsed: ParsedRoster, meetId: string): Promise<void> {
    const supabase = createSupabaseAdminClient()
    if (!supabase) {
        return
    }

    const { data: meet, error: meetError } = (await (supabase.from('meets' as any) as any)
        .select('id, organization_id')
        .eq('id', meetId)
        .single()) as {
            data: { id: string; organization_id: string } | null
            error: { message: string } | null
        }
    if (meetError || !meet) {
        return
    }

    for (const swimmer of parsed.swimmers) {
        const firstName = swimmer.firstName?.trim() || null
        const lastName = swimmer.lastName?.trim() || null
        if (!firstName && !lastName) {
            continue
        }

        const swimmerInsert = await (supabase.from('swimmers' as any) as any)
            .insert({
                organization_id: meet.organization_id,
                first_name: firstName,
                last_name: lastName,
                age: swimmer.age ?? null,
                grade: swimmer.grade ?? null,
            })
            .select()
            .single()

        if (swimmerInsert.error || !swimmerInsert.data) {
            continue
        }

        for (const eventEntry of swimmer.events ?? []) {
            const eventName = eventEntry.name?.trim() || 'Unknown Event'
            const course = eventEntry.course && ['SCY', 'LCM'].includes(eventEntry.course) ? eventEntry.course : 'SCY'

            const eventInsert = await (supabase.from('events' as any) as any)
                .insert({
                    meet_id: meetId,
                    name: eventName,
                    course,
                    heat_count: 1,
                })
                .select()
                .single()

            if (eventInsert.error || !eventInsert.data) {
                continue
            }

            const seedTime = eventEntry.seedTime ?? null
            const seedSeconds = parseSeedTimeSeconds(seedTime)
            const eventRow = {
                event_id: eventInsert.data.id,
                swimmer_id: swimmerInsert.data.id,
                swimmer_name: `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Swimmer',
                team_code: swimmer.teamCode ?? null,
                gender: swimmer.gender ?? null,
                seed_time: seedTime,
                seed_time_seconds: seedSeconds,
                seed_course: course,
                lane: null,
                heat: null,
                lane_number: null,
                heat_number: null,
            }

            await (supabase.from('heat_entries' as any) as any).insert(eventRow)
            await (supabase.from('meet_entries' as any) as any).insert(eventRow)
        }
    }
}

export async function parseRosterAction(formData: FormData, meetId?: string): Promise<ParsedRoster> {
    const file = formData.get('file')
    if (!(file instanceof File)) {
        return { swimmers: [] }
    }

    const fileName = file.name || 'roster.csv'
    const isPdf = fileName.toLowerCase().endsWith('.pdf')

    let content = ''
    if (isPdf) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const parser = new PDFParse({ data: buffer })
        const pdfData = await parser.getText()
        content = pdfData.text || ''
    } else {
        content = await file.text()
    }

    const parsed = fileName.toLowerCase().endsWith('.csv') ? parseCsvFallback(content) : await parseTextToRoster(content, fileName)
    if (meetId) {
        await persistParsedRosterToMeet(parsed, meetId)
    }
    return parsed
}

export async function parseRosterContent(rawContent: string, filename = 'roster.csv'): Promise<ParsedRoster> {
    return parseTextToRoster(rawContent, filename)
}
