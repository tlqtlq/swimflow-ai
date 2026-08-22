export type CourseType = 'SCY' | 'LCM'

export type Organization = {
    id: string
    name: string
    slug: string | null
    created_at: string
}

export type Location = {
    id: string
    name: string
    address: string | null
    course_type_default: CourseType | 'SCM'
    notes: string | null
    created_at: string
}

export type Meet = {
    id: string
    organization_id: string
    location_id: string | null
    name: string
    location: string | null
    course_type: CourseType | 'SCM'
    meet_date: string | null
    status: 'draft' | 'published' | 'live' | 'completed'
    is_published: boolean
    payment_status: 'unpaid' | 'pending' | 'paid'
    current_event_id: string | null
    current_heat_number: number
    current_heat: number
    stripe_customer_id: string | null
    stripe_checkout_session_id: string | null
    paid_until: string | null
    created_at: string
}

export type Swimmer = {
    id: string
    organization_id: string
    first_name: string | null
    last_name: string | null
    age: number | null
    grade: string | null
    created_at: string
}

export type EventRow = {
    id: string
    meet_id: string
    name: string
    stroke: string | null
    distance: number | null
    course: CourseType | null
    heat_count: number | null
    created_at: string
}

export type HeatEntry = {
    id: string
    event_id: string
    swimmer_id: string
    swimmer_name: string | null
    seed_time: string | null
    seed_time_seconds: number | null
    seed_course: CourseType | null
    lane: number | null
    heat: number | null
    lane_number: number | null
    heat_number: number | null
    result_time: string | null
    result_time_seconds: number | null
    place: number | null
    is_personal_record: boolean
    scored_at: string | null
    created_at: string
}

export type MeetEntry = HeatEntry

export type Subscriber = {
    id: string
    meet_id: string
    phone_number: string
    created_at: string
}

export type Database = {
    public: {
        Tables: {
            locations: {
                Row: Location
                Insert: Omit<Location, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Location>
            }
            organizations: {
                Row: Organization
                Insert: Omit<Organization, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Organization>
            }
            meets: {
                Row: Meet
                Insert: Omit<Meet, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Meet>
            }
            swimmers: {
                Row: Swimmer
                Insert: Omit<Swimmer, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Swimmer>
            }
            events: {
                Row: EventRow
                Insert: Omit<EventRow, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<EventRow>
            }
            heat_entries: {
                Row: HeatEntry
                Insert: Omit<HeatEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<HeatEntry>
            }
            meet_entries: {
                Row: MeetEntry
                Insert: Omit<MeetEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<MeetEntry>
            }
            subscribers: {
                Row: Subscriber
                Insert: Omit<Subscriber, 'id' | 'created_at'> & { id?: string; created_at?: string }
                Update: Partial<Subscriber>
            }
        }
    }
}
