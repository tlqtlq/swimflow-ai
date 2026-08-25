import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const meetId = searchParams.get('meetId')
    if (!meetId) {
        return NextResponse.json({ message: 'Meet ID is required.' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
        return NextResponse.json({ message: 'A banner image file is required.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
        return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    }

    const fileName = `${meetId}-${Date.now()}.jpg`
    const normalizedMimeType = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'

    const uploadResult = await supabase.storage.from('meet-banners').upload(fileName, file, {
        cacheControl: '3600',
        contentType: normalizedMimeType,
        upsert: true,
    })

    if (uploadResult.error) {
        return NextResponse.json({ message: uploadResult.error.message }, { status: 500 })
    }

    const publicUrl = supabase.storage.from('meet-banners').getPublicUrl(fileName).data.publicUrl
    return NextResponse.json({ url: publicUrl })
}
