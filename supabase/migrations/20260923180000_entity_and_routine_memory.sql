create table if not exists public.entity_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('person','project','location')),
  person_id uuid references public.people(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  canonical_name text not null,
  alias_text text not null,
  alias_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  confidence real not null default 0.72 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 1 check (evidence_count >= 1),
  active boolean not null default true,
  source text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_alias_target_check check (
    (entity_type = 'person' and person_id is not null and project_id is null)
    or (entity_type = 'project' and project_id is not null and person_id is null)
    or (entity_type = 'location' and person_id is null and project_id is null)
  ),
  unique(user_id, entity_type, alias_key)
);

create index if not exists entity_aliases_person_idx
  on public.entity_aliases(user_id, person_id)
  where entity_type = 'person' and active;
create index if not exists entity_aliases_project_idx
  on public.entity_aliases(user_id, project_id)
  where entity_type = 'project' and active;
create index if not exists entity_aliases_rank_idx
  on public.entity_aliases(user_id, entity_type, active, confidence desc, evidence_count desc, updated_at desc);

alter table public.entity_aliases enable row level security;

drop policy if exists "select_own_entity_aliases" on public.entity_aliases;
create policy "select_own_entity_aliases"
on public.entity_aliases for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_entity_aliases" on public.entity_aliases;
create policy "insert_own_entity_aliases"
on public.entity_aliases for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_entity_aliases" on public.entity_aliases;
create policy "update_own_entity_aliases"
on public.entity_aliases for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_entity_aliases" on public.entity_aliases;
create policy "delete_own_entity_aliases"
on public.entity_aliases for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.entity_aliases to authenticated;

create table if not exists public.user_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_type text not null check (routine_type in ('action','schedule','location','workflow','reminder')),
  routine_key text not null,
  title text not null,
  learned_value jsonb not null default '{}'::jsonb,
  example_text text,
  source_item_id uuid,
  confidence real not null default 0.55 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 1 check (evidence_count >= 1),
  active boolean not null default true,
  last_observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, routine_key)
);

create index if not exists user_routines_active_rank_idx
  on public.user_routines(user_id, active, evidence_count desc, confidence desc, updated_at desc);

alter table public.user_routines enable row level security;

drop policy if exists "select_own_routines" on public.user_routines;
create policy "select_own_routines"
on public.user_routines for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_routines" on public.user_routines;
create policy "insert_own_routines"
on public.user_routines for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_routines" on public.user_routines;
create policy "update_own_routines"
on public.user_routines for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_routines" on public.user_routines;
create policy "delete_own_routines"
on public.user_routines for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_routines to authenticated;

create or replace function public.record_entity_alias(
  p_entity_type text,
  p_entity_id uuid,
  p_canonical_name text,
  p_alias_text text,
  p_metadata jsonb default '{}'::jsonb,
  p_confidence real default 0.78,
  p_source text default null
)
returns public.entity_aliases
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.entity_aliases;
  v_canonical text;
  v_key text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_entity_type not in ('person','project','location') then raise exception 'Unsupported entity type'; end if;

  if p_entity_type = 'person' then
    select name into v_canonical from public.people where id = p_entity_id and user_id = v_user;
    if not found then raise exception 'Person not found'; end if;
  elsif p_entity_type = 'project' then
    select name into v_canonical from public.projects where id = p_entity_id and user_id = v_user;
    if not found then raise exception 'Project not found'; end if;
  else
    if p_entity_id is not null then raise exception 'Locations do not use entity_id'; end if;
    v_canonical := nullif(trim(p_canonical_name), '');
    if v_canonical is null then raise exception 'Canonical location name is required'; end if;
  end if;

  v_key := left(lower(regexp_replace(trim(p_alias_text), '\s+', ' ', 'g')), 500);
  if v_key = '' then raise exception 'Alias is required'; end if;

  insert into public.entity_aliases (
    user_id, entity_type, person_id, project_id, canonical_name,
    alias_text, alias_key, metadata, confidence, evidence_count, active,
    source, last_seen_at, updated_at
  )
  values (
    v_user, p_entity_type,
    case when p_entity_type = 'person' then p_entity_id else null end,
    case when p_entity_type = 'project' then p_entity_id else null end,
    v_canonical, left(trim(p_alias_text), 1000), v_key,
    coalesce(p_metadata, '{}'::jsonb), greatest(0, least(1, p_confidence)),
    1, true, nullif(left(trim(coalesce(p_source, '')), 200), ''), now(), now()
  )
  on conflict (user_id, entity_type, alias_key)
  do update set
    person_id = excluded.person_id,
    project_id = excluded.project_id,
    canonical_name = excluded.canonical_name,
    alias_text = excluded.alias_text,
    metadata = excluded.metadata,
    evidence_count = public.entity_aliases.evidence_count + 1,
    confidence = least(
      0.99,
      greatest(public.entity_aliases.confidence, excluded.confidence)
      + case when public.entity_aliases.canonical_name = excluded.canonical_name then 0.04 else 0.01 end
    ),
    active = true,
    source = coalesce(excluded.source, public.entity_aliases.source),
    last_seen_at = now(),
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.record_entity_alias(text,uuid,text,text,jsonb,real,text) from public;
grant execute on function public.record_entity_alias(text,uuid,text,text,jsonb,real,text) to authenticated;

create or replace function public.record_user_routine(
  p_routine_type text,
  p_routine_key text,
  p_title text,
  p_learned_value jsonb default '{}'::jsonb,
  p_example_text text default null,
  p_source_item_id uuid default null,
  p_confidence real default 0.55
)
returns public.user_routines
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_routines;
  v_key text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_routine_type not in ('action','schedule','location','workflow','reminder') then
    raise exception 'Unsupported routine type';
  end if;

  v_key := left(lower(regexp_replace(trim(p_routine_key), '\s+', ' ', 'g')), 500);
  if v_key = '' then raise exception 'Routine key is required'; end if;

  insert into public.user_routines (
    user_id, routine_type, routine_key, title, learned_value, example_text,
    source_item_id, confidence, evidence_count, active, last_observed_at, updated_at
  )
  values (
    v_user, p_routine_type, v_key, left(trim(p_title), 500),
    coalesce(p_learned_value, '{}'::jsonb),
    nullif(left(trim(coalesce(p_example_text, '')), 3000), ''),
    p_source_item_id, greatest(0, least(1, p_confidence)), 1, true, now(), now()
  )
  on conflict (user_id, routine_key)
  do update set
    title = excluded.title,
    learned_value = excluded.learned_value,
    example_text = coalesce(excluded.example_text, public.user_routines.example_text),
    source_item_id = coalesce(excluded.source_item_id, public.user_routines.source_item_id),
    evidence_count = public.user_routines.evidence_count + 1,
    confidence = least(
      0.97,
      greatest(public.user_routines.confidence, excluded.confidence)
      + case when public.user_routines.learned_value = excluded.learned_value then 0.06 else 0.02 end
    ),
    active = true,
    last_observed_at = now(),
    updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.record_user_routine(text,text,text,jsonb,text,uuid,real) from public;
grant execute on function public.record_user_routine(text,text,text,jsonb,text,uuid,real) to authenticated;

create or replace function public.resolve_person_memory(
  p_name text,
  p_company text default null
)
returns public.people
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.people;
  v_key text;
  v_stripped text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Name is required'; end if;
  v_key := lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'));
  v_stripped := regexp_replace(v_key, '^(pak|bapak|bu|ibu|mas|mbak)\s+', '');

  select p.* into v_row
  from public.entity_aliases a
  join public.people p on p.id = a.person_id and p.user_id = v_user
  where a.user_id = v_user and a.entity_type = 'person' and a.active and a.alias_key = v_key
  order by a.confidence desc, a.evidence_count desc, a.updated_at desc
  limit 1;

  if not found then
    select * into v_row
    from public.people
    where user_id = v_user and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = v_key
    limit 1;
  end if;

  if not found and length(v_stripped) >= 3 then
    select * into v_row
    from public.people
    where user_id = v_user
      and regexp_replace(lower(regexp_replace(trim(name), '\s+', ' ', 'g')), '^(pak|bapak|bu|ibu|mas|mbak)\s+', '') = v_stripped
    order by updated_at desc nulls last
    limit 1;
  end if;

  if found then
    if v_key <> lower(regexp_replace(trim(v_row.name), '\s+', ' ', 'g')) then
      insert into public.entity_aliases (
        user_id, entity_type, person_id, canonical_name, alias_text, alias_key,
        metadata, confidence, evidence_count, active, source, last_seen_at, updated_at
      )
      values (
        v_user, 'person', v_row.id, v_row.name, trim(p_name), v_key,
        jsonb_build_object('auto', true), 0.82, 1, true, 'resolver', now(), now()
      )
      on conflict (user_id, entity_type, alias_key)
      do update set
        person_id = excluded.person_id,
        canonical_name = excluded.canonical_name,
        evidence_count = public.entity_aliases.evidence_count + 1,
        confidence = least(0.98, greatest(public.entity_aliases.confidence, excluded.confidence) + 0.03),
        active = true,
        last_seen_at = now(),
        updated_at = now();
    end if;

    if nullif(trim(coalesce(p_company, '')), '') is not null
       and nullif(trim(coalesce(v_row.company, '')), '') is null then
      update public.people
      set company = trim(p_company), updated_at = now()
      where id = v_row.id and user_id = v_user
      returning * into v_row;
    end if;
    return v_row;
  end if;

  begin
    insert into public.people(user_id, name, company, last_conversation_at)
    values (v_user, trim(p_name), nullif(trim(p_company), ''), now())
    returning * into v_row;
  exception when unique_violation then
    select * into v_row from public.people
    where user_id = v_user and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = v_key
    limit 1;
  end;
  return v_row;
end;
$$;

create or replace function public.resolve_project_memory(p_name text)
returns public.projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.projects;
  v_key text;
  v_stripped text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Project name is required'; end if;
  v_key := lower(regexp_replace(trim(p_name), '\s+', ' ', 'g'));
  v_stripped := regexp_replace(v_key, '^(project|proyek)\s+', '');

  select p.* into v_row
  from public.entity_aliases a
  join public.projects p on p.id = a.project_id and p.user_id = v_user
  where a.user_id = v_user and a.entity_type = 'project' and a.active and a.alias_key = v_key
  order by a.confidence desc, a.evidence_count desc, a.updated_at desc
  limit 1;

  if not found then
    select * into v_row from public.projects
    where user_id = v_user and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = v_key
    limit 1;
  end if;

  if not found and length(v_stripped) >= 2 then
    select * into v_row
    from public.projects
    where user_id = v_user
      and regexp_replace(lower(regexp_replace(trim(name), '\s+', ' ', 'g')), '^(project|proyek)\s+', '') = v_stripped
    order by updated_at desc nulls last
    limit 1;
  end if;

  if found then
    if v_key <> lower(regexp_replace(trim(v_row.name), '\s+', ' ', 'g')) then
      insert into public.entity_aliases (
        user_id, entity_type, project_id, canonical_name, alias_text, alias_key,
        metadata, confidence, evidence_count, active, source, last_seen_at, updated_at
      )
      values (
        v_user, 'project', v_row.id, v_row.name, trim(p_name), v_key,
        jsonb_build_object('auto', true), 0.82, 1, true, 'resolver', now(), now()
      )
      on conflict (user_id, entity_type, alias_key)
      do update set
        project_id = excluded.project_id,
        canonical_name = excluded.canonical_name,
        evidence_count = public.entity_aliases.evidence_count + 1,
        confidence = least(0.98, greatest(public.entity_aliases.confidence, excluded.confidence) + 0.03),
        active = true,
        last_seen_at = now(),
        updated_at = now();
    end if;
    return v_row;
  end if;

  begin
    insert into public.projects(user_id, name, description)
    values (v_user, trim(p_name), '')
    returning * into v_row;
  exception when unique_violation then
    select * into v_row from public.projects
    where user_id = v_user and lower(regexp_replace(trim(name), '\s+', ' ', 'g')) = v_key
    limit 1;
  end;
  return v_row;
end;
$$;