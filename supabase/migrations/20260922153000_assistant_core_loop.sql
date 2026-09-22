-- NANTI assistant core loop: clarification, waiting automation, WhatsApp capture, and product analytics.

alter table public.waiting_items
  add column if not exists follow_up_at timestamptz,
  add column if not exists last_followed_up_at timestamptz,
  add column if not exists follow_up_count integer not null default 0,
  add column if not exists auto_follow_up_enabled boolean not null default true;

update public.waiting_items
set follow_up_at = coalesce(follow_up_at, started_at + interval '2 days')
where status = 'waiting';

create index if not exists waiting_items_follow_up_idx
  on public.waiting_items(user_id, follow_up_at)
  where status = 'waiting' and auto_follow_up_enabled = true;

alter table public.inbox_items
  add column if not exists clarification_type text,
  add column if not exists clarification_question text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.inbox_items'::regclass
      and conname='inbox_items_clarification_type_check'
  ) then
    alter table public.inbox_items
      add constraint inbox_items_clarification_type_check
      check (
        clarification_type is null
        or clarification_type in ('date','time','person','confirmation')
      );
  end if;
end $$;

alter table public.people add column if not exists phone text;

create table if not exists public.whatsapp_user_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  phone_number text unique,
  link_code text unique,
  link_expires_at timestamptz,
  verified_at timestamptz,
  pending_inbox_id uuid references public.inbox_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_user_links_phone_idx
  on public.whatsapp_user_links(phone_number)
  where verified_at is not null;

alter table public.whatsapp_user_links enable row level security;

drop policy if exists "select_own_whatsapp_link" on public.whatsapp_user_links;
create policy "select_own_whatsapp_link"
on public.whatsapp_user_links for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_whatsapp_link" on public.whatsapp_user_links;
create policy "insert_own_whatsapp_link"
on public.whatsapp_user_links for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_whatsapp_link" on public.whatsapp_user_links;
create policy "update_own_whatsapp_link"
on public.whatsapp_user_links for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_whatsapp_link" on public.whatsapp_user_links;
create policy "delete_own_whatsapp_link"
on public.whatsapp_user_links for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_message_id text not null unique,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text' check (message_type in ('text','image','document','template','unknown')),
  content text not null default '',
  from_number text,
  to_number text,
  status text not null default 'received' check (status in ('received','processing','processed','sent','delivered','read','failed','ignored')),
  raw_payload jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_user_created_idx
  on public.whatsapp_messages(user_id, created_at desc);

alter table public.whatsapp_messages enable row level security;

drop policy if exists "select_own_whatsapp_messages" on public.whatsapp_messages;
create policy "select_own_whatsapp_messages"
on public.whatsapp_messages for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  item_id uuid,
  source text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_user_created_idx
  on public.product_events(user_id, created_at desc);
create index if not exists product_events_name_created_idx
  on public.product_events(event_name, created_at desc);

alter table public.product_events enable row level security;

drop policy if exists "select_own_product_events" on public.product_events;
create policy "select_own_product_events"
on public.product_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_product_events" on public.product_events;
create policy "insert_own_product_events"
on public.product_events for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Let authenticated users access the new exposed tables through the Data API.
grant select, insert, update, delete on public.whatsapp_user_links to authenticated;
grant select on public.whatsapp_messages to authenticated;
grant select, insert on public.product_events to authenticated;
