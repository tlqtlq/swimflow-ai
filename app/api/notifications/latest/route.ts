import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
    const meetId = new URL(request.url).searchParams.get('meetId')
    if (!meetId) return NextResponse.json({ message: 'meetId is required.' }, { status: 400 })
    const supabase = createSupabaseServerClient()
    if (!supabase) return NextResponse.json({ message: 'Supabase is not configured.' }, { status: 500 })
    const { data, error } = await (supabase.from('heat_announcements' as any) as any)
        .select('id, message, created_at')
        .eq('meet_id', meetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
    return NextResponse.json(data ?? {})
}
