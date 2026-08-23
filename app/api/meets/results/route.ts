import { NextResponse } from 'next/server'
import { saveEventResults, type ScoreInput } from '@/lib/actions/score-event'

export async function POST(request: Request) {
    try {
        const { eventId, inputs } = await request.json() as { eventId?: string; inputs?: ScoreInput[] }
        if (!eventId || !Array.isArray(inputs)) {
            return NextResponse.json({ message: 'An event ID and result inputs are required.' }, { status: 400 })
        }

        const result = await saveEventResults(eventId, inputs)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to save event results.' }, { status: 500 })
    }
}