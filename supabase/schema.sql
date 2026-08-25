create extension if not exists "pgcrypto";

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  course_type_default text not null default 'SCY' check (course_type_default in ('SCY', 'LCM', 'SCM')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  created_at timestamptz not null default now()
);

create table if not exists meets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  name text not null,
  location text,
  course_type text not null default 'SCY' check (course_type in ('SCY', 'LCM', 'SCM')),
  meet_date date,
  accent_color text not null default '#003296',
  banner_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'live', 'completed')),
  is_published boolean not null default false,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  current_event_id uuid,
  current_heat_number integer not null default 1,
  current_heat integer not null default 1,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  paid_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists swimmers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text,
  last_name text,
  age integer,
  grade text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  meet_id uuid not null references meets(id) on delete cascade,
  name text not null,
  stroke text,
  distance integer,
  course text check (course in ('SCY', 'LCM')),
  heat_count integer default 1,
  created_at timestamptz not null default now()
);

create table if not exists heat_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  swimmer_id uuid not null references swimmers(id) on delete cascade,
  swimmer_name text,
  team_code text,
  gender text,
  seed_time text,
  seed_time_seconds double precision,
  seed_course text check (seed_course in ('SCY', 'LCM')),
  lane integer,
  heat integer,
  lane_number integer,
  heat_number integer,
  result_time text,
  result_time_seconds double precision,
  place integer,
  is_personal_record boolean not null default false,
  scored_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists meet_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  swimmer_id uuid not null references swimmers(id) on delete cascade,
  swimmer_name text,
  team_code text,
  gender text,
  seed_time text,
  seed_time_seconds double precision,
  seed_course text check (seed_course in ('SCY', 'LCM')),
  lane integer,
  heat integer,
  lane_number integer,
  heat_number integer,
  result_time text,
  result_time_seconds double precision,
  place integer,
  is_personal_record boolean not null default false,
  scored_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  meet_id uuid not null references meets(id) on delete cascade,
  swimmer_name text not null,
  team_code text,
  age integer,
  gender text,
  event_name text not null,
  seed_time text,
  created_at timestamptz not null default now()
);

alter table meets add column if not exists stripe_customer_id text;
alter table meets add column if not exists stripe_checkout_session_id text;
alter table meets add column if not exists paid_until timestamptz;
alter table meets add column if not exists is_published boolean not null default false;
alter table meets add column if not exists payment_status text not null default 'unpaid';
alter table meets add column if not exists current_event_id uuid;
alter table meets add column if not exists current_heat_number integer not null default 1;
alter table meets add column if not exists current_heat integer not null default 1;
alter table meets add column if not exists location_id uuid;
alter table meets add column if not exists course_type text not null default 'SCY';
alter table meets add column if not exists accent_color text not null default '#003296';
alter table meets add column if not exists banner_url text;
do $$
begin
  begin
    alter table meets add constraint meets_current_event_id_fkey foreign key (current_event_id) references events(id) on delete set null;
  exception when duplicate_object then null;
  end;
end $$;
alter table heat_entries add column if not exists result_time text;
alter table heat_entries add column if not exists result_time_seconds double precision;
alter table heat_entries add column if not exists place integer;
alter table heat_entries add column if not exists is_personal_record boolean not null default false;
alter table heat_entries add column if not exists scored_at timestamptz;
alter table meet_entries add column if not exists result_time text;
alter table heat_entries add column if not exists team_code text;
alter table heat_entries add column if not exists gender text;
alter table meet_entries add column if not exists team_code text;
alter table meet_entries add column if not exists gender text;
alter table meet_entries add column if not exists result_time_seconds double precision;
alter table meet_entries add column if not exists place integer;
alter table meet_entries add column if not exists is_personal_record boolean not null default false;
alter table meet_entries add column if not exists scored_at timestamptz;

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  meet_id uuid not null references meets(id) on delete cascade,
  phone_number text,
  push_endpoint text,
  push_subscription jsonb,
  created_at timestamptz not null default now(),
  unique (meet_id, phone_number)
);

alter table subscribers add column if not exists push_endpoint text;
alter table subscribers add column if not exists push_subscription jsonb;
alter table subscribers alter column phone_number drop not null;

create table if not exists heat_announcements (
  id uuid primary key default gen_random_uuid(),
  meet_id uuid not null references meets(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  heat_number integer not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_meets_organization_id on meets (organization_id);
create index if not exists idx_meets_location_id on meets (location_id);
create index if not exists idx_swimmers_organization_id on swimmers (organization_id);
create index if not exists idx_events_meet_id on events (meet_id);
create index if not exists idx_heat_entries_event_id on heat_entries (event_id);
create index if not exists idx_heat_entries_swimmer_id on heat_entries (swimmer_id);
create index if not exists idx_meet_entries_event_id on meet_entries (event_id);
create index if not exists idx_entries_meet_id on entries (meet_id);
create index if not exists idx_subscribers_meet_id on subscribers (meet_id);
create unique index if not exists idx_subscribers_meet_push_endpoint on subscribers (meet_id, push_endpoint) where push_endpoint is not null;
create index if not exists idx_heat_announcements_meet_id on heat_announcements (meet_id, created_at desc);

alter table organizations enable row level security;
alter table locations enable row level security;
alter table meets enable row level security;
alter table swimmers enable row level security;
alter table events enable row level security;
alter table heat_entries enable row level security;
alter table entries enable row level security;
alter table heat_announcements enable row level security;

create policy "organizations_authenticated_read_write" on organizations
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "locations_authenticated_read_write" on locations
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "entries_authenticated_read_write" on entries
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "locations_public_select" on locations
  for select using (true);

create policy "meets_authenticated_read_write" on meets
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "swimmers_authenticated_read_write" on swimmers
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "events_authenticated_read_write" on events
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "heat_entries_authenticated_read_write" on heat_entries
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "meet_entries_authenticated_read_write" on meet_entries
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "subscribers_authenticated_read_write" on subscribers
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "organizations_public_select" on organizations
  for select
  using (true);

create policy "meets_public_select" on meets
  for select
  using (true);

create policy "swimmers_public_select" on swimmers
  for select
  using (true);

create policy "events_public_select" on events
  for select
  using (true);

create policy "heat_entries_public_select" on heat_entries
  for select
  using (true);

create policy "meet_entries_public_select" on meet_entries
  for select
  using (true);

create policy "subscribers_public_select" on subscribers
  for select
  using (true);

create policy "heat_announcements_public_select" on heat_announcements
  for select
  using (true);

-- Required for Supabase Realtime subscriptions used by the spectator portal.
do $$
begin
  begin
    alter publication supabase_realtime add table meets;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table meet_entries;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table heat_announcements;
  exception when duplicate_object then null;
  end;
end $$;
