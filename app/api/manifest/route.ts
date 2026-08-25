import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const meetId = request.nextUrl.searchParams.get('meetId')
    const startUrl = meetId ? `/portal/${meetId}` : '/'

    return NextResponse.json({
        name: 'SwimFlow Live',
        short_name: 'SwimFlow',
        id: startUrl,
        display: 'standalone',
        start_url: startUrl,
        scope: startUrl,
        background_color: '#ffffff',
        theme_color: '#0f172a',
        icons: [{ src: '/logo.png', sizes: 'any', type: 'image/png' }],
    })
}
