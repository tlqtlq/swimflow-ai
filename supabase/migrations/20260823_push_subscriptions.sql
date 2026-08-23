alter table public.subscribers add column if not exists push_endpoint text;
alter table public.subscribers add column if not exists push_subscription jsonb;
alter table public.subscribers alter column phone_number drop not null;

create unique index if not exists idx_subscribers_meet_push_endpoint
  on public.subscribers (meet_id, push_endpoint)
  where push_endpoint is not null;