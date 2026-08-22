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

create index if not exists idx_entries_meet_id on entries (meet_id);

alter table entries enable row level security;

create policy "entries_authenticated_read_write" on entries
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);