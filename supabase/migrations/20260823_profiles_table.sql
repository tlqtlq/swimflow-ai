create table if not exists public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('meet_host', 'coach', 'spectator')) DEFAULT 'meet_host',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles table
alter table public.profiles enable row level security;

-- Create policies for profiles table
create policy "Profiles are viewable by owners" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are insertable by users" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are updatable by owners" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- RLS policies for meets table - only meet_host or coach can modify
create policy "Meets are viewable by authenticated users" on public.meets
  for select using (auth.uid() is not null);

create policy "Meets are insertable by meet_host or coach" on public.meets
  for insert with check (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

create policy "Meets are updatable by meet_host or coach" on public.meets
  for update using (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  ) with check (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

create policy "Meets are deletable by meet_host or coach" on public.meets
  for delete using (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

-- RLS policies for entries table - only meet_host or coach can modify
create policy "Entries are viewable by authenticated users" on public.entries
  for select using (auth.uid() is not null);

create policy "Entries are insertable by meet_host or coach" on public.entries
  for insert with check (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

create policy "Entries are updatable by meet_host or coach" on public.entries
  for update using (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  ) with check (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

create policy "Entries are deletable by meet_host or coach" on public.entries
  for delete using (
    auth.uid() IN (
      SELECT p.id FROM public.profiles p WHERE p.role IN ('meet_host', 'coach')
    )
  );

-- Public (unauthenticated) read-only access to published meets, entries and live portal states
create policy "Published meets are viewable by public" on public.meets
  for select using (is_published = true);

create policy "Entries are viewable by public" on public.entries
  for select using (true);