-- Explicitly deny normal client access to service-only launch validation reports.
-- The service_role bypasses RLS and retains access.

alter table public.launch_validation_runs enable row level security;

revoke all on public.launch_validation_runs from anon, authenticated;

drop policy if exists "Clients cannot access launch validation runs"
  on public.launch_validation_runs;

create policy "Clients cannot access launch validation runs"
  on public.launch_validation_runs
  for all
  to anon, authenticated
  using (false)
  with check (false);
