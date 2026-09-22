-- Use Supabase Cron to trigger NANTI reminders more frequently than Vercel Hobby cron allows.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.dispatch_nanti_reminders()
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
  where key = 'reminder_dispatch';

  if nullif(trim(coalesce(v_endpoint, '')), '') is null
     or nullif(trim(coalesce(v_secret, '')), '') is null then
    return null;
  end if;

  select net.http_get(
    url := v_endpoint,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'User-Agent', 'NANTI-Supabase-Cron/1.0'
    ),
    timeout_milliseconds := 10000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_nanti_reminders() from public, anon, authenticated;

select cron.schedule(
  'nanti-reminder-dispatch',
  '*/5 * * * *',
  $$select private.dispatch_nanti_reminders();$$
);
