import './globals.css'
import React from 'react'
import Header from '../components/Header'

export const metadata = {
    title: 'SwimFlow.ai | Optimize The Meet',
    description: 'Meet automation for swim teams'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main className="container py-8">{children}</main>
            </body>
        </html>
    )
}
