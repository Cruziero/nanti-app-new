create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  access_token text not null,
  refresh_token text,
  token_expiry timestamptz not null,
  calendar_id text not null default 'primary',
  status text not null default 'connected'
    check (status in ('connected','failed','disconnected')),
  sync_enabled boolean not null default true,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.calendar_connections enable row level security;
revoke all on public.calendar_connections from anon, authenticated;
grant all on public.calendar_connections to service_role;

create table if not exists public.calendar_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists calendar_oauth_states_user_idx
  on public.calendar_oauth_states(user_id, expires_at);

alter table public.calendar_oauth_states enable row level security;
revoke all on public.calendar_oauth_states from anon, authenticated;
grant all on public.calendar_oauth_states to service_role;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  external_event_id text not null,
  title text not null,
  description text not null default '',
  start_date text not null,
  end_date text,
  location text not null default '',
  attendees text[] not null default '{}',
  raw_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, external_event_id)
);

create index if not exists calendar_events_user_start_idx
  on public.calendar_events(user_id, start_date);

alter table public.calendar_events enable row level security;

drop policy if exists "select_own_calendar_events" on public.calendar_events;
create policy "select_own_calendar_events"
on public.calendar_events for select
to authenticated
using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.calendar_events from authenticated, anon;
grant select on public.calendar_events to authenticated;
grant all on public.calendar_events to service_role;
