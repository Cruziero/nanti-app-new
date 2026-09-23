create table if not exists public.user_language_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null
    check (memory_type in ('phrase_alias','entity_alias','reminder_preference','correction_example','style_preference')),
  pattern_key text not null,
  pattern_text text not null,
  learned_value jsonb not null default '{}'::jsonb,
  example_text text,
  source_item_id uuid,
  confidence real not null default 0.7 check (confidence >= 0 and confidence <= 1),
  evidence_count integer not null default 1 check (evidence_count >= 1),
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, memory_type, pattern_key)
);

create index if not exists user_language_memory_active_rank_idx
  on public.user_language_memory(user_id, active, confidence desc, evidence_count desc, updated_at desc);

alter table public.user_language_memory enable row level security;

drop policy if exists "select_own_language_memory" on public.user_language_memory;
create policy "select_own_language_memory"
on public.user_language_memory for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert_own_language_memory" on public.user_language_memory;
create policy "insert_own_language_memory"
on public.user_language_memory for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update_own_language_memory" on public.user_language_memory;
create policy "update_own_language_memory"
on public.user_language_memory for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete_own_language_memory" on public.user_language_memory;
create policy "delete_own_language_memory"
on public.user_language_memory for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_language_memory to authenticated;

create or replace function public.record_language_memory(
  p_memory_type text,
  p_pattern_key text,
  p_pattern_text text,
  p_learned_value jsonb default '{}'::jsonb,
  p_example_text text default null,
  p_source_item_id uuid default null,
  p_confidence real default 0.72
)
returns public.user_language_memory
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_language_memory;
  v_key text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_memory_type not in ('phrase_alias','entity_alias','reminder_preference','correction_example','style_preference') then
    raise exception 'Unsupported memory type';
  end if;
  v_key := left(lower(regexp_replace(trim(p_pattern_key), '\s+', ' ', 'g')), 500);
  if v_key = '' then raise exception 'Pattern key is required'; end if;

  insert into public.user_language_memory (
    user_id, memory_type, pattern_key, pattern_text, learned_value, example_text,
    source_item_id, confidence, evidence_count, active, updated_at
  )
  values (
    v_user, p_memory_type, v_key, left(trim(p_pattern_text), 1000),
    coalesce(p_learned_value, '{}'::jsonb),
    nullif(left(trim(coalesce(p_example_text, '')), 3000), ''),
    p_source_item_id, greatest(0, least(1, p_confidence)), 1, true, now()
  )
  on conflict (user_id, memory_type, pattern_key)
  do update set
    pattern_text = excluded.pattern_text,
    learned_value = excluded.learned_value,
    example_text = coalesce(excluded.example_text, public.user_language_memory.example_text),
    source_item_id = coalesce(excluded.source_item_id, public.user_language_memory.source_item_id),
    evidence_count = public.user_language_memory.evidence_count + 1,
    confidence = least(
      0.98,
      greatest(public.user_language_memory.confidence, excluded.confidence)
        + case when public.user_language_memory.learned_value = excluded.learned_value then 0.04 else 0.01 end
    ),
    active = true,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_language_memory(text,text,text,jsonb,text,uuid,real) from public;
grant execute on function public.record_language_memory(text,text,text,jsonb,text,uuid,real) to authenticated;
