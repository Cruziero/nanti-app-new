-- Surgical idempotent backfill for production schema drift discovered 2026-09-25.
-- Safe on fresh environments where historical migrations already created these objects.

create table if not exists public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  preferred_name text not null default 'User',
  language text not null default 'indonesian' check (language in ('indonesian','english','mix')),
  tone text not null default 'professional' check (tone in ('formal','professional','casual','friendly','warm','loving','direct','custom')),
  focus_area text not null default 'everything' check (focus_area in ('work','business','personal','everything')),
  emoji_preference boolean not null default true,
  verbosity text not null default 'normal' check (verbosity in ('concise','normal','detailed')),
  quiet_hours_start text default '22:00',
  quiet_hours_end text default '07:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.reminder_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  whatsapp_enabled boolean not null default false,
  push_enabled boolean not null default true,
  calendar_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  default_intensity text not null default 'normal' check (default_intensity in ('gentle','normal','persistent')),
  default_reminder_time text not null default '09:00',
  daily_briefing_time text not null default '08:00',
  end_of_day_time text not null default '17:30',
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '07:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references public.tasks(id) on delete cascade not null,
  stage text not null check (stage in ('preparation','due','checkin','overdue')),
  channel text not null check (channel in ('whatsapp','push','calendar','in_app')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','sent','delivered','read','failed','cancelled')),
  provider_message_id text,
  error text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_reminders_user_status on public.reminders(user_id,status);
create index if not exists idx_reminders_scheduled on public.reminders(scheduled_at) where status='scheduled';
create index if not exists idx_reminders_item on public.reminders(item_id);

create table if not exists public.notification_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null,
  platform text not null check (platform in ('ios','android','web')),
  enabled boolean not null default true,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notification_devices_user on public.notification_devices(user_id,enabled);

create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  invoice_number text not null,
  client_name text not null,
  client_address text,
  client_id uuid references public.people(id) on delete set null,
  business_name text not null default '',
  business_address text,
  date text not null,
  due_date text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(15,2) not null default 0,
  discount numeric(15,2) not null default 0,
  tax numeric(15,2) not null default 0,
  tax_rate numeric(5,2) not null default 11,
  total numeric(15,2) not null default 0,
  currency text not null default 'IDR',
  status text not null default 'draft' check (status in ('draft','sent','viewed','due_soon','due_today','overdue','paid','cancelled')),
  notes text,
  payment_details text,
  bank_details text,
  logo_url text,
  npwp text,
  po_number text,
  template text not null default 'modern' check (template in ('minimal','modern','premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_user on public.invoices(user_id,status);
create index if not exists idx_invoices_number on public.invoices(user_id,invoice_number);
create index if not exists idx_invoices_due on public.invoices(due_date) where status not in ('paid','cancelled');
create index if not exists invoices_client_id_idx on public.invoices(client_id);

create table if not exists public.whatsapp_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  phone_number text not null,
  phone_verified boolean not null default false,
  opt_in boolean not null default false,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  messaging_status text not null default 'inactive' check (messaging_status in ('active','inactive','template_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.ai_clarifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_id uuid references public.tasks(id) on delete set null,
  original_text text not null,
  question text not null,
  response text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_clarifications_user on public.ai_clarifications(user_id,resolved);
create index if not exists ai_clarifications_item_id_idx on public.ai_clarifications(item_id);

create table if not exists public.audit_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_log_user on public.audit_log(user_id,created_at desc);

create table if not exists public.blog_articles (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  date text not null,
  read_time text not null,
  ai_generated boolean default true,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_blog_articles_slug on public.blog_articles(slug);
create index if not exists idx_blog_articles_published on public.blog_articles(published);
create index if not exists idx_blog_articles_date on public.blog_articles(date desc);

alter table public.user_preferences enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.reminders enable row level security;
alter table public.notification_devices enable row level security;
alter table public.invoices enable row level security;
alter table public.whatsapp_connections enable row level security;
alter table public.ai_clarifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.blog_articles enable row level security;

revoke all on public.user_preferences, public.reminder_preferences, public.reminders,
  public.notification_devices, public.invoices, public.whatsapp_connections,
  public.ai_clarifications, public.audit_log, public.blog_articles from anon;
revoke all on public.blog_articles from authenticated;

grant select,insert,update on public.user_preferences to authenticated;
grant select,insert,update on public.reminder_preferences to authenticated;
grant select,insert,update,delete on public.reminders to authenticated;
grant select,insert,update,delete on public.notification_devices to authenticated;
grant select,insert,update,delete on public.invoices to authenticated;
grant select,insert,update on public.whatsapp_connections to authenticated;
grant select,insert,update on public.ai_clarifications to authenticated;
grant select,insert on public.audit_log to authenticated;
grant select on public.blog_articles to anon,authenticated;

drop policy if exists "Users can view own preferences" on public.user_preferences;
create policy "Users can view own preferences" on public.user_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences" on public.user_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences" on public.user_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "Users can view own reminder prefs" on public.reminder_preferences;
create policy "Users can view own reminder prefs" on public.reminder_preferences for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own reminder prefs" on public.reminder_preferences;
create policy "Users can insert own reminder prefs" on public.reminder_preferences for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own reminder prefs" on public.reminder_preferences;
create policy "Users can update own reminder prefs" on public.reminder_preferences for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "Users can view own reminders" on public.reminders;
create policy "Users can view own reminders" on public.reminders for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own reminders" on public.reminders;
create policy "Users can insert own reminders" on public.reminders for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own reminders" on public.reminders;
create policy "Users can update own reminders" on public.reminders for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users can delete own reminders" on public.reminders;
create policy "Users can delete own reminders" on public.reminders for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users can view own devices" on public.notification_devices;
create policy "Users can view own devices" on public.notification_devices for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own devices" on public.notification_devices;
create policy "Users can insert own devices" on public.notification_devices for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own devices" on public.notification_devices;
create policy "Users can update own devices" on public.notification_devices for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users can delete own devices" on public.notification_devices;
create policy "Users can delete own devices" on public.notification_devices for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices" on public.invoices for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own invoices" on public.invoices;
create policy "Users can insert own invoices" on public.invoices for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own invoices" on public.invoices;
create policy "Users can update own invoices" on public.invoices for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "Users can delete own invoices" on public.invoices;
create policy "Users can delete own invoices" on public.invoices for delete to authenticated using ((select auth.uid())=user_id);

drop policy if exists "Users can view own whatsapp connections" on public.whatsapp_connections;
create policy "Users can view own whatsapp connections" on public.whatsapp_connections for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own whatsapp connections" on public.whatsapp_connections;
create policy "Users can insert own whatsapp connections" on public.whatsapp_connections for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own whatsapp connections" on public.whatsapp_connections;
create policy "Users can update own whatsapp connections" on public.whatsapp_connections for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "Users can view own ai clarifications" on public.ai_clarifications;
create policy "Users can view own ai clarifications" on public.ai_clarifications for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own ai clarifications" on public.ai_clarifications;
create policy "Users can insert own ai clarifications" on public.ai_clarifications for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Users can update own ai clarifications" on public.ai_clarifications;
create policy "Users can update own ai clarifications" on public.ai_clarifications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

drop policy if exists "Users can view own audit log" on public.audit_log;
create policy "Users can view own audit log" on public.audit_log for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Users can insert own audit log" on public.audit_log;
create policy "Users can insert own audit log" on public.audit_log for insert to authenticated with check ((select auth.uid())=user_id);

drop policy if exists "Public can read published articles" on public.blog_articles;
create policy "Public can read published articles" on public.blog_articles for select to anon,authenticated using (published=true);
