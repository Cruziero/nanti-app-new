create table public.email_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('personal','business')),
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create unique index email_workspaces_one_personal on public.email_workspaces(user_id) where kind = 'personal';
create index email_workspaces_owner on public.email_workspaces(user_id);

create table public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  email text not null,
  status text not null default 'connected' check (status in ('connected','reconnect_required')),
  refresh_token_encrypted text not null,
  connected_at timestamptz not null default now(),
  foreign key (workspace_id, user_id) references public.email_workspaces(id, user_id) on delete cascade,
  unique (workspace_id, email)
);
create index gmail_connections_owner on public.gmail_connections(user_id, workspace_id);

create table public.gmail_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  expires_at timestamptz not null,
  foreign key (workspace_id, user_id) references public.email_workspaces(id, user_id) on delete cascade
);
create index gmail_oauth_states_owner on public.gmail_oauth_states(user_id, workspace_id);
create index gmail_oauth_states_expiry on public.gmail_oauth_states(expires_at);

create table public.email_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null,
  title text not null check (char_length(title) between 1 and 500),
  description text not null default '',
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  status text not null default 'open' check (status in ('open','done')),
  due_at timestamptz,
  email_subject text not null,
  email_from text not null,
  email_url text not null,
  message_id text not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, user_id) references public.email_workspaces(id, user_id) on delete cascade,
  unique (workspace_id, dedupe_key)
);
create index email_tasks_owner on public.email_tasks(user_id, workspace_id, created_at desc);

alter table public.email_workspaces enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.gmail_oauth_states enable row level security;
alter table public.email_tasks enable row level security;

revoke all on public.gmail_connections, public.gmail_oauth_states from public, anon, authenticated;
grant all on public.email_workspaces, public.gmail_connections, public.gmail_oauth_states, public.email_tasks to service_role;
revoke all on public.email_workspaces, public.email_tasks from public, anon, authenticated;
grant select on public.email_workspaces, public.email_tasks to authenticated;

create policy email_workspaces_owner_read on public.email_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
create policy email_tasks_owner_read on public.email_tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy gmail_connections_server_only on public.gmail_connections for all to authenticated using (false) with check (false);
create policy gmail_oauth_states_server_only on public.gmail_oauth_states for all to authenticated using (false) with check (false);
