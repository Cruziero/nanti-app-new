-- Resolve people/projects discovered by NANTI into stable reusable memory entities.
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
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'Name is required';
  end if;

  select *
  into v_row
  from public.people
  where user_id = v_user
    and lower(trim(name)) = lower(trim(p_name))
  limit 1;

  if found then
    if nullif(trim(coalesce(p_company, '')), '') is not null
       and nullif(trim(coalesce(v_row.company, '')), '') is null then
      update public.people
      set company = trim(p_company), updated_at = now()
      where id = v_row.id
      returning * into v_row;
    end if;
    return v_row;
  end if;

  begin
    insert into public.people(user_id, name, company, last_conversation_at)
    values (v_user, trim(p_name), nullif(trim(p_company), ''), now())
    returning * into v_row;
  exception when unique_violation then
    select *
    into v_row
    from public.people
    where user_id = v_user
      and lower(trim(name)) = lower(trim(p_name))
    limit 1;
  end;

  return v_row;
end;
$$;

revoke all on function public.resolve_person_memory(text,text) from public;
grant execute on function public.resolve_person_memory(text,text) to authenticated;

create or replace function public.resolve_project_memory(
  p_name text
)
returns public.projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.projects;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(p_name), '') is null then
    raise exception 'Project name is required';
  end if;

  select *
  into v_row
  from public.projects
  where user_id = v_user
    and lower(trim(name)) = lower(trim(p_name))
  limit 1;

  if found then
    return v_row;
  end if;

  begin
    insert into public.projects(user_id, name, description)
    values (v_user, trim(p_name), '')
    returning * into v_row;
  exception when unique_violation then
    select *
    into v_row
    from public.projects
    where user_id = v_user
      and lower(trim(name)) = lower(trim(p_name))
    limit 1;
  end;

  return v_row;
end;
$$;

revoke all on function public.resolve_project_memory(text) from public;
grant execute on function public.resolve_project_memory(text) to authenticated;
