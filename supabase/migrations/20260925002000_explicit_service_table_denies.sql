revoke all on public.assistant_eval_runs from anon, authenticated;
revoke all on public.automation_runtime from anon, authenticated;
revoke all on public.calendar_connections from anon, authenticated;
revoke all on public.calendar_oauth_states from anon, authenticated;

drop policy if exists "deny_client_access_assistant_eval_runs" on public.assistant_eval_runs;
create policy "deny_client_access_assistant_eval_runs"
on public.assistant_eval_runs
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny_client_access_automation_runtime" on public.automation_runtime;
create policy "deny_client_access_automation_runtime"
on public.automation_runtime
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny_client_access_calendar_connections" on public.calendar_connections;
create policy "deny_client_access_calendar_connections"
on public.calendar_connections
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny_client_access_calendar_oauth_states" on public.calendar_oauth_states;
create policy "deny_client_access_calendar_oauth_states"
on public.calendar_oauth_states
for all
to anon, authenticated
using (false)
with check (false);
