-- Run the production AI smoke check from the same proven Supabase scheduler
-- used for reminders. Reuses the existing server-only runtime credential without
-- exposing it to clients or source control.

insert into public.automation_runtime(key, endpoint_url, secret)
select
  'assistant_eval',
  regexp_replace(endpoint_url, '/api/cron/check-reminders/?$', '/api/cron/assistant-eval'),
  secret
from public.automation_runtime
where key = 'reminder_dispatch'
on conflict (key) do update
set endpoint_url = excluded.endpoint_url,
    secret = excluded.secret;

create or replace function private.dispatch_nanti_assistant_eval()
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
  where key = 'assistant_eval';

  if nullif(trim(coalesce(v_endpoint, '')), '') is null
     or nullif(trim(coalesce(v_secret, '')), '') is null then
    return null;
  end if;

  select net.http_get(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'User-Agent', 'NANTI-Supabase-AI-Eval/1.0'
    ),
    timeout_milliseconds := 120000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_nanti_assistant_eval() from public, anon, authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'nanti-assistant-eval'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end;
$$;

select cron.schedule(
  'nanti-assistant-eval',
  '15 23 * * *',
  $$select private.dispatch_nanti_assistant_eval();$$
);
