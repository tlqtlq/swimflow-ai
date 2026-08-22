'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type LocationOption = { id: string; name: string; address: string | null; course_type_default: 'SCY' | 'LCM' | 'SCM' }
type AddressSuggestion = { place_id: number; name?: string; display_name: string }

export default function MeetSettings({ meetId, courseType, locationId, locations }: { meetId: string; courseType: 'SCY' | 'LCM' | 'SCM'; locationId?: string | null; locations: LocationOption[] }) {
    const router = useRouter()
    const [course, setCourse] = useState(courseType)
    const [selectedLocation, setSelectedLocation] = useState(locationId ?? '')
    const [locationName, setLocationName] = useState('')
    const [address, setAddress] = useState('')
    const [addressQuery, setAddressQuery] = useState('')
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
    const [message, setMessage] = useState('')
    const selectedAddressRef = useRef('')

    useEffect(() => {
        setCourse(courseType)
        setSelectedLocation(locationId ?? '')
    }, [courseType, locationId])

    useEffect(() => {
        if (addressQuery.trim().length < 3) {
            setSuggestions([])
            return
        }
        if (selectedAddressRef.current === addressQuery.trim()) {
            selectedAddressRef.current = ''
            setSuggestions([])
            return
        }

        const controller = new AbortController()
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(addressQuery.trim())}`, {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                })
                if (response.ok) setSuggestions(((await response.json()) as AddressSuggestion[]).slice(0, 3))
            } catch (error) {
                if ((error as Error).name !== 'AbortError') setSuggestions([])
            }
        }, 300)

        return () => {
            controller.abort()
            window.clearTimeout(timer)
        }
    }, [addressQuery])

    const save = async (nextLocationName = locationName, nextAddress = address, nextLocationId = selectedLocation) => {
        const response = await fetch('/api/meets/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                meetId,
                courseType: course,
                locationId: nextLocationId || undefined,
                locationName: nextLocationName,
                address: nextAddress,
            }),
        })

        const result = await response.json()
        setMessage(response.ok ? 'Meet settings saved.' : result.message ?? 'Unable to save settings.')
        if (result.locationId) setSelectedLocation(result.locationId)
        if (response.ok) router.refresh()
    }

    const selectSuggestion = (suggestion: AddressSuggestion) => {
        const nextName = suggestion.name?.trim() || suggestion.display_name.split(',')[0].trim()
        setLocationName(nextName)
        setAddress(suggestion.display_name)
        selectedAddressRef.current = suggestion.display_name
        setAddressQuery(suggestion.display_name)
        setSuggestions([])
        void save(nextName, suggestion.display_name, '')
    }

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-900 p-6 text-white">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">Meet setup</p>
                    <h2 className="mt-1 text-xl font-semibold">Course & venue</h2>
                </div>
                <button type="button" onClick={() => void save()} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">Save settings</button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                    Course type
                    <select value={course} onChange={(event) => setCourse(event.target.value as 'SCY' | 'LCM' | 'SCM')} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <option value="SCY">SCY - Short Course Yards</option>
                        <option value="LCM">LCM - Long Course Meters</option>
                        <option value="SCM">SCM - Short Course Meters</option>
                    </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                    Saved location
                    <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <option value="">Type a new location</option>
                        {locations.slice(0, 3).map((location) => (
                            <option key={location.id} value={location.id}>{location.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="relative px-6">
                <label className="text-sm font-medium text-slate-700">
                    Search address
                    <input value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} placeholder="Search a pool, venue, or street address" autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                </label>
                {suggestions.length > 0 ? (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                        {suggestions.map((suggestion) => (
                            <button key={suggestion.place_id} type="button" onClick={() => selectSuggestion(suggestion)} className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 last:border-b-0">
                                {suggestion.name ?? suggestion.display_name.split(',')[0]}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                    Location name
                    <input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Pool name or venue" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Full address
                    <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street address or venue address" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
                </label>
            </div>

            {message ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        </section>
    )
}
