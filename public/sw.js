const CACHE_NAME = 'swimflow-shell-v6'
const APP_SHELL = ['/', '/logom.png', '/APPICON.jpg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})

self.addEventListener('fetch', (event) => {
    const { request } = event
    if (request.method !== 'GET') return

    const url = new URL(request.url)
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).then((response) => {
                const cachedResponse = response.clone()
                void caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse))
                return response
            }).catch(() => caches.match(request).then((response) => response || caches.match('/'))),
        )
        return
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => cachedResponse || fetch(request).then((response) => {
            if (response.ok && response.type === 'basic') {
                const responseToCache = response.clone()
                void caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
            }
            return response
        })),
    )
})

self.addEventListener('push', (event) => {
    let payload = { title: 'Heat Alert', body: 'A heat is now on deck.', icon: '/logom.png', url: '/' }
    try {
        payload = { ...payload, ...event.data?.json() }
    } catch {
        if (event.data?.text()) payload.body = event.data.text()
    }

    event.waitUntil(self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: '/logom.png',
        tag: 'swimflow-heat-alert',
        renotify: true,
        data: { url: payload.url },
    }))
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const targetUrl = event.notification.data?.url || '/'
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const existingClient = clients.find((client) => client.url.includes(targetUrl) && 'focus' in client)
            return existingClient ? existingClient.focus() : self.clients.openWindow(targetUrl)
        }),
    )
})