'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import HeatAlertControls from '@/components/HeatAlertControls'

type EventRow = { id: string; name: string; course?: string | null }
type Entry = { id: string; event_id: string; lane_number?: number | null; lane?: number | null; swimmer_name?: string | null; team_code?: string | null; heat_number?: number | null; heat?: number | null; seed_time?: string | null; result_time?: string | null; place?: number | null }
type RosterEntry = { id: string; event_name: string; swimmer_name: string; team_code?: string | null; seed_time?: string | null }

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }> }

const getSupabaseBrowserClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
}

export default function LiveSpectatorPortal({ meetId, meetName, meetLocation, meetDate, accentColor, bannerUrl, locationAddress, events, initialEntries, initialRosterEntries, currentEventId, currentHeat, courseType }: { meetId: string; meetName: string; meetLocation: string; meetDate?: string | null; accentColor?: string | null; bannerUrl?: string | null; locationAddress?: string | null; events: EventRow[]; initialEntries: Entry[]; initialRosterEntries?: RosterEntry[]; currentEventId?: string | null; currentHeat: number; courseType: string }) {
    const router = useRouter()
    const [entries, setEntries] = useState(initialEntries)
    const [rosterEntries, setRosterEntries] = useState(initialRosterEntries ?? [])
    const [displayName, setDisplayName] = useState(meetName)
    const [displayLocation, setDisplayLocation] = useState(meetLocation)
    const [displayDate, setDisplayDate] = useState(meetDate ?? '')
    const [displayAccentColor, setDisplayAccentColor] = useState(accentColor ?? '#003296')
    const [displayBannerUrl, setDisplayBannerUrl] = useState(bannerUrl ?? null)
    const [activeEventId, setActiveEventId] = useState(currentEventId ?? (events[0]?.id ?? ''))
    const [activeHeat, setActiveHeat] = useState(currentHeat)
    const [course, setCourse] = useState(courseType)
    const latestHeat = useRef(currentHeat)
    const latestDeckEventId = useRef(currentEventId ?? (events[0]?.id ?? ''))

    useEffect(() => {
        setEntries(initialEntries)
    }, [initialEntries])

    useEffect(() => {
        setRosterEntries(initialRosterEntries ?? [])
    }, [initialRosterEntries])

    useEffect(() => {
        setDisplayName(meetName)
        setDisplayLocation(meetLocation)
        setDisplayDate(meetDate ?? '')
        setDisplayAccentColor(accentColor ?? '#003296')
        setDisplayBannerUrl(bannerUrl ?? null)
    }, [meetName, meetLocation, meetDate, accentColor, bannerUrl])

    useEffect(() => {
        if (typeof window === 'undefined') return
        latestHeat.current = currentHeat
        latestDeckEventId.current = currentEventId ?? latestDeckEventId.current
    }, [currentEventId, currentHeat])

    const fetchEntries = useCallback(async () => {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return

        const { data } = await supabase
            .from('entries')
            .select('id, event_name, swimmer_name, team_code, seed_time')
            .eq('meet_id', meetId)
            .order('event_name')
            .order('swimmer_name')

        if (data) setRosterEntries(data as RosterEntry[])
    }, [meetId])

    useEffect(() => {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return

        const channel = supabase.channel(`meet-${meetId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meets', filter: `id=eq.${meetId}` }, (payload) => {
                const updatedMeet = payload.new as { current_event_id?: string | null; current_heat_number?: number; current_heat?: number; course_type?: string; name?: string; location?: string | null; meet_date?: string | null; accent_color?: string | null; primary_color?: string | null; banner_url?: string | null }
                const nextEventId = updatedMeet.current_event_id ?? latestDeckEventId.current
                const nextHeat = updatedMeet.current_heat ?? updatedMeet.current_heat_number
                if (updatedMeet.current_event_id) {
                    latestDeckEventId.current = updatedMeet.current_event_id
                    setActiveEventId(updatedMeet.current_event_id)
                }
                if (typeof nextHeat === 'number') {
                    latestHeat.current = nextHeat
                    setActiveHeat(nextHeat)
                }
                if (updatedMeet.course_type) setCourse(updatedMeet.course_type)
                if (updatedMeet.name) setDisplayName(updatedMeet.name)
                if (updatedMeet.location !== undefined) setDisplayLocation(updatedMeet.location || 'Venue to be announced')
                if (updatedMeet.meet_date !== undefined) setDisplayDate(updatedMeet.meet_date || '')
                if (updatedMeet.accent_color || updatedMeet.primary_color) setDisplayAccentColor(updatedMeet.accent_color ?? updatedMeet.primary_color ?? '#003296')
                if (updatedMeet.banner_url !== undefined) setDisplayBannerUrl(updatedMeet.banner_url || null)
                router.refresh()
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `meet_id=eq.${meetId}` }, () => {
                void fetchEntries()
                router.refresh()
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') console.warn('Meet Realtime subscription failed:', status)
            })

        return () => { void supabase.removeChannel(channel) }
    }, [meetId, router, fetchEntries])

    const eventFilter = events.map((event) => event.id).join(',')
    useEffect(() => {
        if (!eventFilter) return
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return
        const channel = supabase.channel(`meet-entry-changes-${meetId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meet_entries', filter: `event_id=in.(${eventFilter})` }, (payload) => {
                if (payload.eventType === 'DELETE') setEntries((current) => current.filter((entry) => entry.id !== payload.old.id))
                else setEntries((current) => current.some((entry) => entry.id === payload.new.id) ? current.map((entry) => entry.id === payload.new.id ? payload.new as Entry : entry) : [...current, payload.new as Entry])
                router.refresh()
            })
            .subscribe()
        return () => { void supabase.removeChannel(channel) }
    }, [eventFilter, meetId, router])

    const activeEventIndex = events.findIndex((event) => event.id === activeEventId)
    const activeEvent = activeEventIndex >= 0 ? events[activeEventIndex] : null
    const eventTitle = activeEvent?.name ?? 'No event on deck'
    const activeHeatEntries = entries
        .filter((entry) => entry.event_id === activeEventId && (entry.heat_number ?? entry.heat ?? 1) === activeHeat)
        .sort((firstEntry, secondEntry) => (firstEntry.lane_number ?? firstEntry.lane ?? Number.MAX_SAFE_INTEGER) - (secondEntry.lane_number ?? secondEntry.lane ?? Number.MAX_SAFE_INTEGER))
    const lanes = Array.from({ length: 8 }, (_, index) => index + 1)
    const entryByLane = useMemo(() => new Map(activeHeatEntries.map((entry) => [entry.lane_number ?? entry.lane, entry])), [activeHeatEntries])
    const heatLabel = activeEvent ? `Heat ${activeHeat} of ${Math.max(1, activeEvent.name ? 8 : 1)}` : `Heat ${activeHeat}`

    return (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
            <div className="relative">
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/70 to-transparent" />
                {displayBannerUrl ? (
                    <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                        <Image src={displayBannerUrl} alt={`${displayName} banner`} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-900/20" />
                    </div>
                ) : (
                    <div className="relative h-40 w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_40%),linear-gradient(135deg,#0f172a,#111827_35%,#020617)]" />
                )}
                <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3 text-white">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-sky-200">Live results</p>
                        <h1 className="mt-1 truncate text-lg font-black leading-none">{displayName}</h1>
                        <p className="mt-1 text-xs text-slate-200">{displayLocation}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/80 bg-red-500/20 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-100"><span aria-hidden="true">🔴</span> LIVE</span>
                </div>
            </div>

            <div className="bg-slate-100 px-4 pb-4 pt-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Current event</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">{eventTitle}</h2>
                        </div>
                        <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">{activeEvent?.course ?? course}</div>
                    </div>
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <span className="font-bold text-slate-950">Heat {activeHeat}</span> · {heatLabel.replace(`Heat ${activeHeat}`, '').trim() || 'On deck'}
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    {lanes.map((lane) => {
                        const entry = entryByLane.get(lane)
                        return (
                            <div key={lane} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${entry ? 'border-slate-200 bg-white shadow-sm' : 'border-dashed border-slate-300 bg-slate-50'}`}>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-base font-black text-white">{lane}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Lane {lane}</p>
                                        {entry?.seed_time ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{entry.seed_time}</span> : null}
                                    </div>
                                    <p className="mt-1 truncate text-base font-bold text-slate-900">{entry?.team_code ?? entry?.swimmer_name ?? 'Awaiting assignment'}</p>
                                    {entry?.team_code && entry.swimmer_name ? <p className="truncate text-sm text-slate-500">{entry.swimmer_name}</p> : null}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <HeatAlertControls meetId={meetId} tone="light" className="w-full" onInstallRequired={() => undefined} />
                </div>
            </div>
        </div>
    )
}
