import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SwimFlow Live',
        short_name: 'SwimFlow',
        id: '/',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [{ src: '/APPICON.jpg', sizes: 'any', type: 'image/jpeg' }],
    }
}