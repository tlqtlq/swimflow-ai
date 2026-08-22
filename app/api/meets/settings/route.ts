import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase'

const isValidHexColor = (value?: string) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim())

export async function POST(request: Request) {
    const body = await request.json() as {
        meetId?: string
        courseType?: 'SCY' | 'LCM' | 'SCM'
        locationId?: string
        locationName?: string
        address?: string
        meetName?: string
        title?: string
        meetDate?: string
        meetLocation?: string
        accentColor?: string
        primaryColor?: string
    }

    if (!body.meetId) {
        return NextResponse.json({ message: 'meetId is required.' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    if (!supabase) {
        return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    }

    let locationId = body.locationId || null
    if (!locationId && body.locationName?.trim()) {
        const locationResult = await (supabase.from('locations' as any) as any).insert({
            name: body.locationName.trim(),
            address: body.address?.trim() || null,
            course_type_default: body.courseType || 'SCY',
        }).select('id').single()

        if (locationResult.error) {
            return NextResponse.json({ message: locationResult.error.message }, { status: 500 })
        }

        locationId = locationResult.data.id
    }

    const update: Record<string, string | null> = { location_id: locationId }
    if (body.courseType) update.course_type = body.courseType

    const nextTitle = (body.meetName ?? body.title ?? '').trim()
    if (nextTitle) update.name = nextTitle

    if (body.meetDate) update.meet_date = body.meetDate
    if (body.meetLocation !== undefined) update.location = body.meetLocation.trim() || null

    const updateMeet = (values: Record<string, string | null>) => (supabase.from('meets' as any) as any).update(values).eq('id', body.meetId)
    const accentColor = body.accentColor ?? body.primaryColor
    const colorValue = accentColor?.trim()
    const baseResult = await updateMeet(update)

    if (baseResult.error) {
        return NextResponse.json({ message: baseResult.error.message }, { status: 500 })
    }

    if (colorValue && isValidHexColor(colorValue)) {
        const accentResult = await updateMeet({ accent_color: colorValue })
        if (accentResult.error) {
            const message = accentResult.error.message.toLowerCase()
            const isSchemaCacheIssue = message.includes('schema cache') || message.includes('column') && message.includes('does not exist')
            if (!isSchemaCacheIssue) {
                return NextResponse.json({ message: accentResult.error.message }, { status: 500 })
            }

            const primaryResult = await updateMeet({ primary_color: colorValue })
            if (primaryResult.error) {
                return NextResponse.json({ message: primaryResult.error.message }, { status: 500 })
            }
        }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/meets/${body.meetId}`)
    revalidatePath(`/meets/${body.meetId}`)
    revalidatePath(`/portal/${body.meetId}`)

    const savedMeetResult = await (supabase.from('meets' as any) as any).select('*').eq('id', body.meetId).maybeSingle()
    if (savedMeetResult.error || !savedMeetResult.data) {
        return NextResponse.json({ message: savedMeetResult.error?.message ?? 'Meet settings were saved but could not be reloaded.' }, { status: 500 })
    }

    return NextResponse.json({
        saved: true,
        locationId,
        meet: {
            name: savedMeetResult.data.name,
            location: savedMeetResult.data.location,
            meetDate: savedMeetResult.data.meet_date,
            accentColor: savedMeetResult.data.accent_color ?? savedMeetResult.data.primary_color ?? colorValue,
        },
    })
}
