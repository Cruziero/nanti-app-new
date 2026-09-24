create or replace function public.promote_inbox_item(
  p_id uuid,
  p_title text default null,
  p_person_name text default null,
  p_due_date timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inbox public.inbox_items%rowtype;
  v_task public.tasks%rowtype;
  v_waiting public.waiting_items%rowtype;
  v_person public.people%rowtype;
  v_project public.projects%rowtype;
  v_title text;
  v_person_name text;
  v_project_name text;
  v_due_date timestamptz;
  v_person_id uuid;
  v_project_id uuid;
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
  v_project_name := nullif(btrim(v_inbox.project_name), '');
  v_due_date := coalesce(p_due_date, v_inbox.due_date);

  if v_person_name is not null then
    select * into v_person
    from public.resolve_person_memory(v_person_name, null);
    v_person_id := v_person.id;
    v_person_name := v_person.name;
  end if;

  if v_project_name is not null then
    select * into v_project
    from public.resolve_project_memory(v_project_name);
    v_project_id := v_project.id;
    v_project_name := v_project.name;
  end if;

  if v_inbox.type = 'waiting' then
    insert into public.waiting_items (
      user_id, title, person_id, project_id, person_name, project_name,
      status, started_at, source, quote, confidence, source_type, semantic_context
    )
    values (
      v_user_id, v_title, v_person_id, v_project_id, v_person_name, v_project_name,
      'waiting', now(), coalesce(v_inbox.source, ''), coalesce(v_inbox.conversation_text, ''),
      0.8, v_inbox.source_type, coalesce(v_inbox.semantic_context, '{}'::jsonb)
    )
    returning * into v_waiting;

    update public.inbox_items
    set status = 'tracked', updated_at = now()
    where id = p_id and user_id = v_user_id;

    return jsonb_build_object('entity', 'waiting', 'item', to_jsonb(v_waiting));
  end if;

  insert into public.tasks (
    user_id, title, type, status, priority, due_date,
    person_id, project_id, person_name, project_name,
    source, quote, confidence, source_type, semantic_context
  )
  values (
    v_user_id, v_title, v_inbox.type, 'pending', 'medium', v_due_date,
    v_person_id, v_project_id, v_person_name, v_project_name,
    coalesce(v_inbox.source, ''), coalesce(v_inbox.conversation_text, ''),
    0.8, v_inbox.source_type, coalesce(v_inbox.semantic_context, '{}'::jsonb)
  )
  returning * into v_task;

  update public.inbox_items
  set status = 'tracked', task_id = v_task.id, updated_at = now()
  where id = p_id and user_id = v_user_id;

  return jsonb_build_object('entity', 'task', 'item', to_jsonb(v_task));
end;
$$;

revoke all on function public.promote_inbox_item(uuid,text,text,timestamptz) from public;
grant execute on function public.promote_inbox_item(uuid,text,text,timestamptz) to authenticated;
