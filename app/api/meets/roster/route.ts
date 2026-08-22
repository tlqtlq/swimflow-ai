import { NextResponse } from 'next/server'
import { persistParsedRosterToMeet, type ParsedRoster } from '@/lib/roster-persistence'

export async function POST(request: Request) {
    try {
        const body = await request.json() as { meetId?: string; roster?: ParsedRoster }
        if (!body.meetId || !body.roster?.swimmers?.length) {
            return NextResponse.json({ message: 'A meet ID and at least one roster row are required.' }, { status: 400 })
        }

        const importSummary = await persistParsedRosterToMeet(body.roster, body.meetId)
        return NextResponse.json({ ...body.roster, importSummary })
    } catch (error) {
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Unable to import roster.' }, { status: 500 })
    }
}