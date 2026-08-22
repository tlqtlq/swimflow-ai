export function getAppBaseUrl() {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.replace(/\/$/, '')
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')

    if (vercelUrl) return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
    if (configuredUrl) return configuredUrl
    return 'http://localhost:3000'
}

export function getPortalUrl(meetId: string) {
    return `${getAppBaseUrl()}/portal/${meetId}`
}

export function getClientPortalUrl(meetId: string) {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/portal/${meetId}`
    }
    return getPortalUrl(meetId)
}
