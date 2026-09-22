-- Durable reminder notifications and secure database-owned scheduler configuration.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid,
  notification_type text not null
    check (notification_type in ('task_due','task_overdue','waiting_followup','briefing')),
  title text not null,
  body text not null,
  status text not null default 'unread'
    check (status in ('unread','read','dismissed')),
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique(user_id, dedupe_key)
);

create index if not exists notifications_user_status_created_idx
  on public.notifications(user_id, status, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "select_own_notifications" on public.notifications;
create policy "select_own_notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "update_own_notifications" on public.notifications;
create policy "update_own_notifications"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, update on public.notifications to authenticated;

create table if not exists public.automation_runtime (
  key text primary key,
  secret text not null default encode(gen_random_bytes(32), 'hex'),
  endpoint_url text,
  updated_at timestamptz not null default now()
);

alter table public.automation_runtime enable row level security;
revoke all on public.automation_runtime from anon, authenticated;

insert into public.automation_runtime(key)
values ('reminder_dispatch')
on conflict (key) do nothing;
