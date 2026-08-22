create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  course_type_default text not null default 'SCY' check (course_type_default in ('SCY', 'LCM', 'SCM')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.meets add column if not exists location_id uuid;
alter table public.meets add column if not exists course_type text not null default 'SCY';
alter table public.meets add column if not exists current_event_id uuid;
alter table public.meets add column if not exists current_heat integer not null default 1;
alter table public.meets add column if not exists current_heat_number integer not null default 1;

create index if not exists idx_meets_location_id on public.meets(location_id);

alter table public.locations enable row level security;
do $$
begin
  create policy "locations_public_select" on public.locations for select using (true);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.meets;
exception when duplicate_object then null;
end $$;
