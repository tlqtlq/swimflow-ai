import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.formData()
        const meetId = String(body.get('meetId') ?? '').trim()
        const phoneNumber = String(body.get('phoneNumber') ?? '').trim()

        if (!meetId || !phoneNumber) {
            return NextResponse.json({ success: false, message: 'meetId and phoneNumber are required.' }, { status: 400 })
        }

        const normalizedPhone = phoneNumber.replace(/[^\d+]/g, '')
        if (!normalizedPhone || normalizedPhone.length < 10) {
            return NextResponse.json({ success: false, message: 'Please provide a valid phone number.' }, { status: 400 })
        }

        const supabase = createSupabaseAdminClient()
        if (!supabase) {
            return NextResponse.json({ success: false, message: 'Supabase is not configured.' }, { status: 500 })
        }

        const { error } = await (supabase.from('subscribers' as any) as any).upsert(
            [{
                meet_id: meetId,
                phone_number: normalizedPhone,
            }],
            {
                onConflict: 'meet_id,phone_number',
            },
        )

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 500 })
        }

        return NextResponse.redirect(new URL(`/portal/${meetId}?subscribed=1`, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Unable to subscribe.', error: String(error) }, { status: 500 })
    }
}
