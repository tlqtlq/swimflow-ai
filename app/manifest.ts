import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SwimFlow Live',
        short_name: 'SwimFlow',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/logo.png', sizes: 'any', type: 'image/png' }],
    }
}