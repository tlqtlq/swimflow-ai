import RosterUploader from '@/components/RosterUploader'
import TestCheckoutButton from '@/components/TestCheckoutButton'
import MeetSettings from '@/components/MeetSettings'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function UploadMeetPage({ params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient()
    const [meetResult, locationsResult] = supabase ? await Promise.all([
        (supabase.from('meets' as any) as any).select('*').eq('id', params.id).single(),
        (supabase.from('locations' as any) as any).select('*').order('name'),
    ]) : [{ data: null }, { data: [] }]
    const meet = meetResult.data as { course_type?: 'SCY' | 'LCM' | 'SCM'; location_id?: string | null } | null
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <header className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-slate-500">Manage meet</p>
                <h1 className="text-3xl font-semibold text-slate-900">Upload roster for meet #{params.id}</h1>
            </header>

            <RosterUploader meetId={params.id} />
            <MeetSettings meetId={params.id} courseType={meet?.course_type ?? 'SCY'} locationId={meet?.location_id} locations={(locationsResult.data ?? []) as Array<{ id: string; name: string; address: string | null; course_type_default: 'SCY' | 'LCM' | 'SCM' }>} />
            <TestCheckoutButton meetId={params.id} />
        </div>
    )
}
