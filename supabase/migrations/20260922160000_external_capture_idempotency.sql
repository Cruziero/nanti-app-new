-- Idempotent external capture identifiers for WhatsApp and future channels.
alter table public.conversations add column if not exists source_external_id text;
alter table public.tasks add column if not exists source_external_id text;
alter table public.waiting_items add column if not exists source_external_id text;
alter table public.inbox_items add column if not exists source_external_id text;

create unique index if not exists conversations_user_external_unique_idx
  on public.conversations(user_id, source_external_id);
create unique index if not exists tasks_user_external_unique_idx
  on public.tasks(user_id, source_external_id);
create unique index if not exists waiting_items_user_external_unique_idx
  on public.waiting_items(user_id, source_external_id);
create unique index if not exists inbox_items_user_external_unique_idx
  on public.inbox_items(user_id, source_external_id);
