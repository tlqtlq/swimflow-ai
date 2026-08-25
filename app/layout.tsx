import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import Header from '../components/Header'
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration'

export const metadata: Metadata = {
    title: 'SwimFlow.ai | Optimize The Meet',
    description: 'Meet automation for swim teams',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'SwimFlow',
    },
    icons: {
        apple: '/logo.png',
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <ServiceWorkerRegistration />
                <Header />
                <main><div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">{children}</div></main>
            </body>
        </html>
    )
}
