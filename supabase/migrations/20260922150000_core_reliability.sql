-- Core reliability: align production schema with current NANTI task, reminder, chat and inbox flows.

-- Task metadata already used by the app.
alter table public.tasks add column if not exists quote text not null default '';
alter table public.tasks add column if not exists ai_note text not null default '';
alter table public.tasks add column if not exists confidence numeric(3,2) not null default 0.8;
alter table public.tasks add column if not exists source_type text;
alter table public.tasks add column if not exists time text;
alter table public.tasks add column if not exists person_name text;
alter table public.tasks add column if not exists project_name text;
alter table public.tasks add column if not exists reminder_enabled boolean not null default false;
alter table public.tasks add column if not exists reminder_time timestamptz;
alter table public.tasks add column if not exists reminder_channels text[] not null default '{}';
alter table public.tasks add column if not exists reminder_intensity text;
alter table public.tasks add column if not exists last_reminded_at timestamptz;
alter table public.tasks add column if not exists reminder_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_confidence_range'
  ) then
    alter table public.tasks
      add constraint tasks_confidence_range check (confidence >= 0 and confidence <= 1);
  end if;
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_source_type_check'
  ) then
    alter table public.tasks drop constraint tasks_source_type_check;
  end if;
  alter table public.tasks
    add constraint tasks_source_type_check
    check (source_type is null or source_type in ('paste','screenshot','chat','demo','manual','whatsapp','calendar'));
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_reminder_intensity_check'
  ) then
    alter table public.tasks
      add constraint tasks_reminder_intensity_check
      check (reminder_intensity is null or reminder_intensity in ('gentle','normal','persistent'));
  end if;
end $$;

-- Preserve context for waiting items too.
alter table public.waiting_items add column if not exists person_name text;
alter table public.waiting_items add column if not exists project_name text;
alter table public.waiting_items add column if not exists source text not null default '';
alter table public.waiting_items add column if not exists quote text not null default '';
alter table public.waiting_items add column if not exists ai_note text not null default '';
alter table public.waiting_items add column if not exists confidence numeric(3,2) not null default 0.8;
alter table public.waiting_items add column if not exists source_type text;
alter table public.waiting_items add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.waiting_items'::regclass
      and conname = 'waiting_items_confidence_range'
  ) then
    alter table public.waiting_items
      add constraint waiting_items_confidence_range check (confidence >= 0 and confidence <= 1);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.waiting_items'::regclass
      and conname = 'waiting_items_source_type_check'
  ) then
    alter table public.waiting_items
      add constraint waiting_items_source_type_check
      check (source_type is null or source_type in ('paste','screenshot','chat','demo','manual','whatsapp','calendar'));
  end if;
end $$;

-- Inbox rows retain their source so promotion remains traceable.
alter table public.inbox_items add column if not exists source text not null default '';
alter table public.inbox_items add column if not exists source_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.inbox_items'::regclass
      and conname = 'inbox_items_source_type_check'
  ) then
    alter table public.inbox_items
      add constraint inbox_items_source_type_check
      check (source_type is null or source_type in ('paste','screenshot','chat','demo','manual','whatsapp','calendar'));
  end if;
end $$;

-- Browser push subscriptions used by the existing reminder endpoint.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "select_own_push_subscriptions" on public.push_subscriptions;
create policy "select_own_push_subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_push_subscriptions" on public.push_subscriptions;
create policy "insert_own_push_subscriptions"
  on public.push_subscriptions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_push_subscriptions" on public.push_subscriptions;
create policy "update_own_push_subscriptions"
  on public.push_subscriptions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_push_subscriptions" on public.push_subscriptions;
create policy "delete_own_push_subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Atomically turn a pending Inbox row into a durable task or waiting item.
create or replace function public.promote_inbox_item(
  p_id uuid,
  p_title text default null,
  p_person_name text default null,
  p_due_date timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_inbox public.inbox_items%rowtype;
  v_task public.tasks%rowtype;
  v_waiting public.waiting_items%rowtype;
  v_title text;
  v_person_name text;
  v_due_date timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into v_inbox
    from public.inbox_items
   where id = p_id
     and user_id = v_user_id
     and status = 'pending'
   for update;

  if not found then
    raise exception 'Inbox item not found or already handled';
  end if;

  v_title := coalesce(nullif(btrim(p_title), ''), v_inbox.title);
  v_person_name := coalesce(nullif(btrim(p_person_name), ''), v_inbox.person_name);
  v_due_date := coalesce(p_due_date, v_inbox.due_date);

  if v_inbox.type = 'waiting' then
    insert into public.waiting_items (
      user_id, title, person_name, project_name, status, started_at,
      source, quote, confidence, source_type
    )
    values (
      v_user_id, v_title, v_person_name, v_inbox.project_name, 'waiting', now(),
      coalesce(v_inbox.source, ''), coalesce(v_inbox.conversation_text, ''), 0.8,
      v_inbox.source_type
    )
    returning * into v_waiting;

    update public.inbox_items
       set status = 'tracked', updated_at = now()
     where id = p_id and user_id = v_user_id;

    return jsonb_build_object('entity', 'waiting', 'item', to_jsonb(v_waiting));
  end if;

  insert into public.tasks (
    user_id, title, type, status, priority, due_date,
    person_name, project_name, source, quote, confidence, source_type
  )
  values (
    v_user_id, v_title, v_inbox.type, 'pending', 'medium', v_due_date,
    v_person_name, v_inbox.project_name, coalesce(v_inbox.source, ''),
    coalesce(v_inbox.conversation_text, ''), 0.8, v_inbox.source_type
  )
  returning * into v_task;

  update public.inbox_items
     set status = 'tracked', task_id = v_task.id, updated_at = now()
   where id = p_id and user_id = v_user_id;

  return jsonb_build_object('entity', 'task', 'item', to_jsonb(v_task));
end;
$$;

revoke execute on function public.promote_inbox_item(uuid, text, text, timestamptz) from public;
revoke execute on function public.promote_inbox_item(uuid, text, text, timestamptz) from anon;
grant execute on function public.promote_inbox_item(uuid, text, text, timestamptz) to authenticated;
