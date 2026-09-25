-- Give the production smoke suite enough time to run sequentially with bounded
-- provider retries while keeping the scheduler credential server-only.
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
    timeout_milliseconds := 180000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function private.dispatch_nanti_assistant_eval()
from public, anon, authenticated;
