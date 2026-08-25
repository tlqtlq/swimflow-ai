import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { sendPushNotifications } from '@/lib/web-push'

export async function POST(request: Request) {
    try {
        const payload = await request.json() as {
            meetId?: string
            swimmerName?: string
            resultTime?: string
        }

        const { meetId, swimmerName, resultTime } = payload
        if (!meetId || !swimmerName || !resultTime) {
            return NextResponse.json({ success: false, message: 'meetId, swimmerName, and resultTime are required.', received: payload }, { status: 400 })
        }

        const supabase = createSupabaseAdminClient()
        if (!supabase) {
            return NextResponse.json({ success: false, message: 'Supabase is not configured.' }, { status: 500 })
        }

        const recipientsResult = await (supabase.from('subscribers' as any) as any)
            .select('id, push_subscription')
            .eq('meet_id', meetId)
            .not('push_subscription', 'is', null)

        const debug = {
            meetId,
            swimmerName,
            resultTime,
            vapidConfigured: Boolean(process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
            subscriberCount: recipientsResult.data?.length ?? 0,
            firstSubscriber: recipientsResult.data?.[0] ?? null,
        }

        if (recipientsResult.error) {
            return NextResponse.json({ success: false, message: recipientsResult.error.message, debug }, { status: 500 })
        }

        const invalidRecipients = await sendPushNotifications(recipientsResult.data ?? [], {
            title: 'SwimFlow Result',
            body: `${swimmerName} finished in ${resultTime}.`,
            url: `/portal/${meetId}`,
            icon: '/logo.png',
        })

        return NextResponse.json({
            success: true,
            sent: (recipientsResult.data?.length ?? 0) - invalidRecipients.length,
            invalid: invalidRecipients.length,
            debug,
        })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Unable to send test result notification.', error: String(error) }, { status: 500 })
    }
}
