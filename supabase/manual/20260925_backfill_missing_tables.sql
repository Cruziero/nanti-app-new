-- NANTI manual backfill: the two migrations that never ran on this project.
-- Generated 2026-09-25 from supabase/migrations/. Safe to run repeatedly.
-- Diff vs original: CREATE INDEX -> IF NOT EXISTS, CREATE POLICY preceded by DROP POLICY IF EXISTS.
-- Everything else is byte-identical to the committed migration.

-- ============================================================
-- 20260822000000_add_reminders_invoices_calendar_whatsapp.sql
-- ============================================================
-- Migration: NANTI v2 - Reminders, Notifications, Preferences, Invoices, Calendar, WhatsApp
-- Adds new tables for the full NANTI product specification

-- 1. User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferred_name TEXT NOT NULL DEFAULT 'User',
  language TEXT NOT NULL DEFAULT 'indonesian' CHECK (language IN ('indonesian', 'english', 'mix')),
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('formal', 'professional', 'casual', 'friendly', 'warm', 'loving', 'direct', 'custom')),
  focus_area TEXT NOT NULL DEFAULT 'everything' CHECK (focus_area IN ('work', 'business', 'personal', 'everything')),
  emoji_preference BOOLEAN NOT NULL DEFAULT true,
  verbosity TEXT NOT NULL DEFAULT 'normal' CHECK (verbosity IN ('concise', 'normal', 'detailed')),
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '07:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Reminder preferences
CREATE TABLE IF NOT EXISTS reminder_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  calendar_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  default_intensity TEXT NOT NULL DEFAULT 'normal' CHECK (default_intensity IN ('gentle', 'normal', 'persistent')),
  default_reminder_time TEXT NOT NULL DEFAULT '09:00',
  daily_briefing_time TEXT NOT NULL DEFAULT '08:00',
  end_of_day_time TEXT NOT NULL DEFAULT '17:30',
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('preparation', 'due', 'checkin', 'overdue')),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push', 'calendar', 'in_app')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
  provider_message_id TEXT,
  error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_reminders_user_status ON reminders(user_id, status);
create index if not exists idx_reminders_scheduled ON reminders(scheduled_at) WHERE status = 'scheduled';
create index if not exists idx_reminders_item ON reminders(item_id);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('due_soon', 'due_today', 'overdue', 'waiting_too_long', 'potentially_forgotten', 'ai_clarification', 'followup_suggestion', 'daily_briefing', 'invoice_due')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'push', 'calendar', 'in_app')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
  item_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_notifications_user ON notifications(user_id, status);
create index if not exists idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'scheduled';

-- 5. Notification devices (push)
CREATE TABLE IF NOT EXISTS notification_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_notification_devices_user ON notification_devices(user_id, enabled);

-- 6. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_id UUID REFERENCES people(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL DEFAULT '',
  business_address TEXT,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 11,
  total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'due_soon', 'due_today', 'overdue', 'paid', 'cancelled')),
  notes TEXT,
  payment_details TEXT,
  bank_details TEXT,
  logo_url TEXT,
  npwp TEXT,
  po_number TEXT,
  template TEXT NOT NULL DEFAULT 'modern' CHECK (template IN ('minimal', 'modern', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_invoices_user ON invoices(user_id, status);
create index if not exists idx_invoices_number ON invoices(user_id, invoice_number);
create index if not exists idx_invoices_due ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');

-- 7. Calendar connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  calendar_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('not_connected', 'connected', 'pending', 'failed')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 8. Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE NOT NULL,
  google_event_id TEXT,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  item_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'google' CHECK (source IN ('google', 'nanti')),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_calendar_events_user ON calendar_events(user_id);
create index if not exists idx_calendar_events_item ON calendar_events(item_id) WHERE item_id IS NOT NULL;

-- 9. WhatsApp connections
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  opt_in BOOLEAN NOT NULL DEFAULT false,
  opted_in_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,
  messaging_status TEXT NOT NULL DEFAULT 'inactive' CHECK (messaging_status IN ('active', 'inactive', 'template_required')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 10. WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES whatsapp_connections(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'document', 'template')),
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_whatsapp_messages_user ON whatsapp_messages(user_id, direction);
create index if not exists idx_whatsapp_messages_connection ON whatsapp_messages(connection_id);

-- 11. AI clarifications log
CREATE TABLE IF NOT EXISTS ai_clarifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  question TEXT NOT NULL,
  response TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_ai_clarifications_user ON ai_clarifications(user_id, resolved);

-- 12. Daily briefings cache
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL,
  briefing JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 13. Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

create index if not exists idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Add columns to existing tasks table for reminders
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_channels TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_intensity TEXT CHECK (reminder_intensity IN ('gentle', 'normal', 'persistent'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS quote TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_note TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS confidence NUMERIC(3, 2) DEFAULT 0.8;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('paste', 'screenshot', 'demo', 'manual', 'whatsapp', 'calendar'));

-- Add time column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time TEXT;

-- RLS policies for new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_clarifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User preferences RLS
drop policy if exists "Users can view own preferences" on user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own preferences" on user_preferences;
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own preferences" on user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reminder preferences RLS
drop policy if exists "Users can view own reminder prefs" on reminder_preferences;
CREATE POLICY "Users can view own reminder prefs" ON reminder_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own reminder prefs" on reminder_preferences;
CREATE POLICY "Users can insert own reminder prefs" ON reminder_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own reminder prefs" on reminder_preferences;
CREATE POLICY "Users can update own reminder prefs" ON reminder_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reminders RLS
drop policy if exists "Users can view own reminders" on reminders;
CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own reminders" on reminders;
CREATE POLICY "Users can insert own reminders" ON reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own reminders" on reminders;
CREATE POLICY "Users can update own reminders" ON reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own reminders" on reminders;
CREATE POLICY "Users can delete own reminders" ON reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications RLS
drop policy if exists "Users can view own notifications" on notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own notifications" on notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own notifications" on notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own notifications" on notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification devices RLS
drop policy if exists "Users can view own devices" on notification_devices;
CREATE POLICY "Users can view own devices" ON notification_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own devices" on notification_devices;
CREATE POLICY "Users can insert own devices" ON notification_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own devices" on notification_devices;
CREATE POLICY "Users can update own devices" ON notification_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own devices" on notification_devices;
CREATE POLICY "Users can delete own devices" ON notification_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Invoices RLS
drop policy if exists "Users can view own invoices" on invoices;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own invoices" on invoices;
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own invoices" on invoices;
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own invoices" on invoices;
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Calendar connections RLS
drop policy if exists "Users can view own calendar connections" on calendar_connections;
CREATE POLICY "Users can view own calendar connections" ON calendar_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own calendar connections" on calendar_connections;
CREATE POLICY "Users can insert own calendar connections" ON calendar_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own calendar connections" on calendar_connections;
CREATE POLICY "Users can update own calendar connections" ON calendar_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own calendar connections" on calendar_connections;
CREATE POLICY "Users can delete own calendar connections" ON calendar_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Calendar events RLS
drop policy if exists "Users can view own calendar events" on calendar_events;
CREATE POLICY "Users can view own calendar events" ON calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own calendar events" on calendar_events;
CREATE POLICY "Users can insert own calendar events" ON calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own calendar events" on calendar_events;
CREATE POLICY "Users can update own calendar events" ON calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can delete own calendar events" on calendar_events;
CREATE POLICY "Users can delete own calendar events" ON calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp connections RLS
drop policy if exists "Users can view own whatsapp connections" on whatsapp_connections;
CREATE POLICY "Users can view own whatsapp connections" ON whatsapp_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own whatsapp connections" on whatsapp_connections;
CREATE POLICY "Users can insert own whatsapp connections" ON whatsapp_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own whatsapp connections" on whatsapp_connections;
CREATE POLICY "Users can update own whatsapp connections" ON whatsapp_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp messages RLS
drop policy if exists "Users can view own whatsapp messages" on whatsapp_messages;
CREATE POLICY "Users can view own whatsapp messages" ON whatsapp_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own whatsapp messages" on whatsapp_messages;
CREATE POLICY "Users can insert own whatsapp messages" ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI clarifications RLS
drop policy if exists "Users can view own ai clarifications" on ai_clarifications;
CREATE POLICY "Users can view own ai clarifications" ON ai_clarifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own ai clarifications" on ai_clarifications;
CREATE POLICY "Users can insert own ai clarifications" ON ai_clarifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own ai clarifications" on ai_clarifications;
CREATE POLICY "Users can update own ai clarifications" ON ai_clarifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily briefings RLS
drop policy if exists "Users can view own briefings" on daily_briefings;
CREATE POLICY "Users can view own briefings" ON daily_briefings FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own briefings" on daily_briefings;
CREATE POLICY "Users can insert own briefings" ON daily_briefings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
drop policy if exists "Users can update own briefings" on daily_briefings;
CREATE POLICY "Users can update own briefings" ON daily_briefings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Audit log RLS
drop policy if exists "Users can view own audit log" on audit_log;
CREATE POLICY "Users can view own audit log" ON audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
drop policy if exists "Users can insert own audit log" on audit_log;
CREATE POLICY "Users can insert own audit log" ON audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 20260907_create_blog_articles.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  read_time TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT TRUE,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

create index if not exists idx_blog_articles_slug ON blog_articles(slug);
create index if not exists idx_blog_articles_published ON blog_articles(published);
create index if not exists idx_blog_articles_date ON blog_articles(date DESC);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

drop policy if exists "Public can read published articles" on blog_articles;
CREATE POLICY "Public can read published articles" ON blog_articles
  FOR SELECT USING (published = TRUE);

drop policy if exists "Service role can do everything" on blog_articles;
CREATE POLICY "Service role can do everything" ON blog_articles
  FOR ALL USING (TRUE);


-- ============================================================
-- 20260907_seed_blog_articles.sql
-- ============================================================
INSERT INTO blog_articles (slug, title, excerpt, content, category, date, read_time, ai_generated) VALUES
(
  'never-lose-commitment-whatsapp',
  'How to Never Lose a Commitment in WhatsApp Again',
  'Every day, important promises get buried in chat threads. Here''s how to extract and track them automatically.',
  '## The Problem

You open WhatsApp. There are 47 unread messages. Somewhere in those conversations, a client promised to send payment, your supplier confirmed delivery for Thursday, and your partner asked you to pick up groceries.

By the end of the day, you''ll forget at least half of them.

## Why It Happens

WhatsApp is where work and life happen. But it''s not designed to track commitments. Messages scroll away. Conversations get buried. And the promises you made, or the ones others made to you, disappear into the noise.

## The Solution

Instead of trying to remember everything, let NANTI do it for you:

1. **Forward the conversation** to NANTI
2. **AI extracts** the commitments, people, and deadlines
3. **Get reminded** when the time comes

Forward a conversation and NANTI keeps track of what was promised.

## See It in Practice

NANTI is free to start. Forward your first conversation and see what it catches.',
  'Product',
  '2026-08-28',
  '4 min',
  FALSE
),
(
  'whatsapp-business-productivity',
  '5 WhatsApp Productivity Tips for Small Businesses',
  'Your business runs on WhatsApp. These tips help you stay on top of every client promise and supplier follow-up.',
  '## 1. Create a Dedicated Thread for Each Client

Keep conversations organized. When you know which thread belongs to which client, tracking commitments becomes easier.

## 2. Use Voice Messages for Quick Follow-Ups

Sometimes typing takes too long. Voice messages capture context faster, and NANTI can extract commitments from them too.

## 3. Forward Key Conversations to Your Memory Tool

Don''t rely on WhatsApp''s search. Forward important conversations to a tool like NANTI that extracts and tracks the commitments automatically.

## 4. Set Reminders for Follow-Ups

Every time someone promises something, set a reminder. Better yet, let NANTI do it for you.

## 5. Review Your Commitments Weekly

At the end of each week, review what you promised and what''s still pending. This prevents things from falling through the cracks.

## Why It Matters

WhatsApp is powerful, but it is not a task manager. Bridge the gap by extracting commitments and setting reminders.',
  'Business',
  '2026-08-25',
  '5 min',
  FALSE
),
(
  'ai-memory-daily-life',
  'Remembering What Matters in Daily Life',
  'From birthdays to dinner plans, AI can help you remember the small promises that keep relationships strong.',
  '## Promises Outside Work

We make promises every day to our partners, kids, friends, and family. "I''ll pick up the kids." "Let''s have dinner this weekend." "I''ll call you tomorrow."

These small commitments matter. They keep relationships strong.

## The Problem

When life gets busy, these promises slip through the cracks. You forget to call. You miss the dinner plan. You show up late.

## How AI Helps

Tools like NANTI can extract commitments from your WhatsApp conversations and remind you when the time comes:

- Birthday mentions → reminder before the date
- Dinner plans → reminder on the day
- Promises to call → reminder at the right time

## Start Small

Forward one conversation to NANTI. See what it catches. You might be surprised how many commitments are hiding in your chats.',
  'Personal',
  '2026-08-22',
  '3 min',
  FALSE
),
(
  'getting-started-nanti',
  'Getting Started with NANTI: A Step-by-Step Guide',
  'Set up NANTI in 2 minutes. Here''s how to start tracking commitments from your WhatsApp conversations.',
  '## Step 1: Sign Up

Create your free account. No credit card required.

## Step 2: Connect WhatsApp

Forward a conversation to NANTI. You can:
- Forward a WhatsApp chat directly
- Paste a conversation
- Upload a screenshot

## Step 3: Review Extracted Items

NANTI will extract:
- **Who** is involved
- **What** was promised
- **When** it''s due

Review and confirm each item.

## Step 4: Get Reminders

When the deadline arrives, NANTI will remind you. You can also:
- Check your daily briefing
- View all tracked items
- Ask the AI assistant about your commitments

## Start Here

You''re now tracking commitments without any extra work. Just forward conversations and let NANTI do the rest.',
  'Tutorial',
  '2026-08-19',
  '4 min',
  FALSE
),
(
  'anonymize-whatsapp-import',
  'How NANTI Anonymizes Your WhatsApp Imports',
  'Privacy matters. Here''s how NANTI protects your data while extracting commitments from your conversations.',
  '## Your Data, Your Control

When you forward a conversation to NANTI, privacy is built in from the start.

## What NANTI Extracts

NANTI turns a conversation into structured items:
- Names (who''s involved)
- Commitments (what was promised)
- Deadlines (when it''s due)
- Context (why it matters)

## What Happens to the Conversation

Conversations you share are retained while your account is active so you can review what NANTI found. You can delete any of it at any time.

## How It Works

1. You forward a conversation
2. NANTI extracts the commitments in real time
3. The result is saved as a structured item
4. You can edit or delete it at any time

## You''re in Control

- Delete your data anytime
- No data is sold or shared
- Encrypted in transit and at rest
- Used only to extract commitments

## See It in Practice

Forward a conversation and watch how NANTI protects your privacy while helping you remember what matters.',
  'Privacy',
  '2026-08-16',
  '3 min',
  FALSE
)
ON CONFLICT (slug) DO NOTHING;

