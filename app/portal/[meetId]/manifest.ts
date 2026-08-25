import type { MetadataRoute } from 'next'

export default function manifest({ params }: { params: { meetId: string } }): MetadataRoute.Manifest {
    const meetRoute = `/portal/${params.meetId}`

    return {
        name: 'SwimFlow Live',
        short_name: 'SwimFlow',
        id: meetRoute,
        display: 'standalone',
        start_url: meetRoute,
        scope: meetRoute,
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [{ src: '/logo.png', sizes: 'any', type: 'image/png' }],
    }
}
