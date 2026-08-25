import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendTrackedSwimmerResultPushes } from '@/lib/web-push'

export const runtime = 'nodejs'

type FileWatchResult = {
    swimmerName?: string
    name?: string
    place?: number
    finalTime?: string
    resultTime?: string
    teamCode?: string | null
    age?: number | null
    gender?: string | null
}

type FileWatchPayload = {
    meetId?: string
    eventName?: string
    heatNumber?: number
    results?: FileWatchResult[]
}

const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ')

const findExistingEntry = async (supabase: any, meetId: string, eventName: string, swimmerName: string) => {
    const { data } = await (supabase.from('entries' as any) as any)
        .select('id')
        .eq('meet_id', meetId)
        .eq('event_name', eventName)
        .eq('swimmer_name', swimmerName)
        .limit(1)
    return data?.[0] ?? null
}

export async function POST(request: Request) {
    try {
        const payload = await request.json() as FileWatchPayload
        const meetId = String(payload.meetId ?? '').trim()
        const eventName = String(payload.eventName ?? '').trim()
        const heatNumber = Number(payload.heatNumber ?? 1)
        const results = Array.isArray(payload.results) ? payload.results : []

        if (!meetId || !eventName || !results.length) {
            return NextResponse.json({ success: false, message: 'meetId, eventName, and results are required.' }, { status: 400 })
        }

        const supabase = createSupabaseAdminClient()
        if (!supabase) {
            return NextResponse.json({ success: false, message: 'Supabase is not configured.' }, { status: 500 })
        }

        await (supabase.from('meets' as any) as any)
            .update({ current_heat_number: Number.isFinite(heatNumber) ? heatNumber : 1, current_heat: Number.isFinite(heatNumber) ? heatNumber : 1 })
            .eq('id', meetId)

        const sentNotifications: Array<{ swimmerName: string; place: number; eventName: string; time: string }> = []
        for (const result of results) {
            const swimmerName = normalizeName(String(result.swimmerName ?? result.name ?? '').trim())
            if (!swimmerName) continue

            const finalTime = String(result.finalTime ?? result.resultTime ?? '').trim()
            const place = Number(result.place ?? 0)
            const row = {
                meet_id: meetId,
                event_name: eventName,
                swimmer_name: swimmerName,
                seed_time: finalTime || null,
                team_code: result.teamCode ?? null,
                age: result.age ?? null,
                gender: result.gender ?? null,
            }

            const existing = await findExistingEntry(supabase, meetId, eventName, swimmerName)
            if (existing) {
                await (supabase.from('entries' as any) as any).update(row).eq('id', existing.id)
            } else {
                await (supabase.from('entries' as any) as any).insert(row)
            }

            if (place > 0 && finalTime) {
                sentNotifications.push({ swimmerName, place, eventName, time: finalTime })
            }
        }

        const recipientsResult = await (supabase.from('subscribers' as any) as any)
            .select('id, push_subscription')
            .eq('meet_id', meetId)
            .not('push_subscription', 'is', null)

        if (!recipientsResult.error && recipientsResult.data?.length) {
            for (const notification of sentNotifications) {
                await sendTrackedSwimmerResultPushes(
                    recipientsResult.data,
                    meetId,
                    notification.swimmerName,
                    notification.eventName,
                    notification.place,
                    notification.time,
                )
            }
        }

        return NextResponse.json({ success: true, meetId, eventName, heatNumber, processed: results.length, notifications: sentNotifications.length })
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unable to ingest file-watch results.' }, { status: 500 })
    }
}
