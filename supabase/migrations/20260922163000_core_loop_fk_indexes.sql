-- Cover foreign keys used by NANTI's memory, promotion, and follow-up paths.
create index if not exists inbox_items_task_id_idx on public.inbox_items(task_id);
create index if not exists tasks_conversation_id_idx on public.tasks(conversation_id);
create index if not exists waiting_items_conversation_id_idx on public.waiting_items(conversation_id);
create index if not exists waiting_items_person_id_idx on public.waiting_items(person_id);
create index if not exists waiting_items_project_id_idx on public.waiting_items(project_id);
create index if not exists whatsapp_user_links_pending_inbox_id_idx
  on public.whatsapp_user_links(pending_inbox_id);
