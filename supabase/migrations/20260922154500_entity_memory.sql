-- Reusable entity memory for people and projects discovered from conversation.
create unique index if not exists people_user_name_unique_idx
  on public.people(user_id, lower(trim(name)));

create unique index if not exists projects_user_name_unique_idx
  on public.projects(user_id, lower(trim(name)));
