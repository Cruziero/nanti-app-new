-- Daily briefings and relationship activity memory.
create table if not exists public.person_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  event_type text not null
    check (event_type in ('captured','completed','followed_up','received','conversation','note')),
  item_id uuid,
  conversation_id uuid references public.conversations(id) on delete set null,
  summary text not null,
  source text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists person_activity_user_dedupe_unique_idx
  on public.person_activity(user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists person_activity_person_occurred_idx
  on public.person_activity(person_id, occurred_at desc);

alter table public.person_activity enable row level security;

drop policy if exists "select_own_person_activity" on public.person_activity;
create policy "select_own_person_activity"
on public.person_activity for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_person_activity" on public.person_activity;
create policy "insert_own_person_activity"
on public.person_activity for insert
to authenticated
with check ((select auth.uid()) = user_id);

grant select, insert on public.person_activity to authenticated;

create table if not exists public.daily_briefings (
  user_id uuid not null references auth.users(id) on delete cascade,
  brief_date date not null,
  greeting text not null,
  summary text not null,
  stats jsonb not null default '{}'::jsonb,
  priorities jsonb not null default '[]'::jsonb,
  waiting jsonb not null default '[]'::jsonb,
  inbox jsonb not null default '[]'::jsonb,
  fingerprint text,
  generated_at timestamptz not null default now(),
  primary key (user_id, brief_date)
);

alter table public.daily_briefings enable row level security;

drop policy if exists "select_own_daily_briefings" on public.daily_briefings;
create policy "select_own_daily_briefings"
on public.daily_briefings for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_daily_briefings" on public.daily_briefings;
create policy "insert_own_daily_briefings"
on public.daily_briefings for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_daily_briefings" on public.daily_briefings;
create policy "update_own_daily_briefings"
on public.daily_briefings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.daily_briefings to authenticated;
