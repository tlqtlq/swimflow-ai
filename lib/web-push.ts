import webpush from 'web-push'

type StoredPushSubscription = {
    endpoint?: string
    keys?: Record<string, string>
}

type PushRecipient = {
    id: string
    push_subscription: StoredPushSubscription | null
}

const vapidSubject = process.env.VAPID_SUBJECT
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

export async function sendHeatAlertPushes(recipients: PushRecipient[], meetId: string, heatNumber: number) {
    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) return []

    try {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
        const payload = JSON.stringify({
            title: 'SwimFlow Heat Alert',
            body: `Heat ${heatNumber} is now ON DECK!`,
            icon: '/logo.png',
            url: `/portal/${meetId}`,
        })
        const results = await Promise.allSettled(recipients.map(async (recipient) => {
            if (!recipient.push_subscription?.endpoint) return { id: recipient.id, statusCode: 0 }
            await webpush.sendNotification(recipient.push_subscription as Parameters<typeof webpush.sendNotification>[0], payload)
            return { id: recipient.id, statusCode: 0 }
        }))

        return results.flatMap((result, index) => {
            if (result.status === 'fulfilled') return []
            const statusCode = (result.reason as { statusCode?: number }).statusCode
            return statusCode === 404 || statusCode === 410 ? [recipients[index].id] : []
        })
    } catch (error) {
        console.warn('Unable to deliver SwimFlow Push notifications:', error)
        return []
    }
}