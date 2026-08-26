import webpush from 'web-push'

type StoredPushSubscription = {
    endpoint?: string
    keys?: Record<string, string>
    trackedSwimmers?: string[] | null
    heatEnabled?: boolean
    resultEnabled?: boolean
}

type PushRecipient = {
    id: string
    push_subscription: StoredPushSubscription | null
}

type PushNotificationRequest = {
    title: string
    body: string
    url: string
    icon?: string
}

const vapidSubject = process.env.VAPID_SUBJECT
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const recipientHasTrackedSwimmer = (recipient: PushRecipient, swimmerName?: string) => {
    const tracked = Array.isArray(recipient.push_subscription?.trackedSwimmers)
        ? recipient.push_subscription?.trackedSwimmers ?? []
        : []
    const target = normalizeName(swimmerName ?? '')
    if (!target) return false
    return tracked.some((name) => {
        const candidate = normalizeName(name)
        return candidate === target || candidate.includes(target) || target.includes(candidate)
    })
}

export async function sendPushNotifications(recipients: PushRecipient[], payload: PushNotificationRequest) {
    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) return []

    try {
        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
        const encodedPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon ?? '/logom.png',
            url: payload.url,
        })

        const results = await Promise.allSettled(recipients.map(async (recipient) => {
            if (!recipient.push_subscription?.endpoint) return { id: recipient.id, statusCode: 0 }
            await webpush.sendNotification(recipient.push_subscription as Parameters<typeof webpush.sendNotification>[0], encodedPayload)
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

export async function sendHeatAlertPushes(recipients: PushRecipient[], meetId: string, heatNumber: number) {
    const activeRecipients = recipients.filter((recipient) => {
        const subscription = recipient.push_subscription
        return subscription && subscription.heatEnabled !== false
    })
    return sendPushNotifications(activeRecipients, {
        title: 'Heat Alert',
        body: `Heat ${heatNumber} is now ON DECK!`,
        url: `/portal/${meetId}`,
        icon: '/logom.png',
    })
}

export async function sendTrackedSwimmerResultPushes(
    recipients: PushRecipient[],
    meetId: string,
    swimmerName: string,
    eventName: string,
    place: number,
    finalTime: string,
) {
    const firstName = swimmerName.split(/\s+/)[0] || swimmerName
    const matchingRecipients = recipients.filter((recipient) => {
        const subscription = recipient.push_subscription
        if (!subscription || subscription.resultEnabled === false) return false
        return recipientHasTrackedSwimmer(recipient, swimmerName)
    })
    return sendPushNotifications(matchingRecipients, {
        title: `${firstName} got #${place} in the ${eventName}`,
        body: `Final time: ${finalTime}`,
        url: `/portal/${meetId}`,
        icon: '/logom.png',
    })
}