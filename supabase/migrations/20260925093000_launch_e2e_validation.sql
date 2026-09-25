create table if not exists public.launch_validation_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  environment text not null default 'production',
  git_sha text,
  passed boolean not null,
  checks jsonb not null default '[]'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists launch_validation_runs_created_idx
  on public.launch_validation_runs(created_at desc);

alter table public.launch_validation_runs enable row level security;
revoke all on public.launch_validation_runs from anon, authenticated;
grant all on public.launch_validation_runs to service_role;

insert into public.automation_runtime(key, endpoint_url, secret)
select
  'launch_e2e',
  regexp_replace(endpoint_url, '/api/cron/check-reminders/?$', '/api/cron/launch-e2e'),
  secret
from public.automation_runtime
where key = 'reminder_dispatch'
on conflict (key) do update
set endpoint_url = excluded.endpoint_url,
    secret = excluded.secret;

create or replace function private.dispatch_nanti_launch_e2e()
returns bigint
language plpgsql
security definer
set search_path = public, private, extensions, net
as $$
declare
  v_endpoint text;
  v_secret text;
  v_request_id bigint;
begin
  select endpoint_url, secret
  into v_endpoint, v_secret
  from public.automation_runtime
  where key = 'launch_e2e';

  if nullif(trim(coalesce(v_endpoint, '')), '') is null
     or nullif(trim(coalesce(v_secret, '')), '') is null then
    return null;
  end if;

  select net.http_get(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'User-Agent', 'NANTI-Launch-E2E/1.0'
    ),
    timeout_milliseconds := 120000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_nanti_launch_e2e()
from public, anon, authenticated;
