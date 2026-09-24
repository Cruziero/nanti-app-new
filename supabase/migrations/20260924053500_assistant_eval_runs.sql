create table if not exists public.assistant_eval_runs (
  id uuid primary key default gen_random_uuid(),
  suite text not null,
  environment text not null default 'production',
  model text,
  git_sha text,
  total integer not null check (total >= 0),
  passed integer not null check (passed >= 0),
  score real not null check (score >= 0 and score <= 1),
  critical_failures text[] not null default '{}',
  failures jsonb not null default '[]'::jsonb,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists assistant_eval_runs_created_idx
  on public.assistant_eval_runs(created_at desc);

alter table public.assistant_eval_runs enable row level security;

revoke all on public.assistant_eval_runs from anon, authenticated;
grant all on public.assistant_eval_runs to service_role;
