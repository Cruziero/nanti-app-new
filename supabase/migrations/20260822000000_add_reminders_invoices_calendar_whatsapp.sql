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

CREATE INDEX idx_reminders_user_status ON reminders(user_id, status);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_reminders_item ON reminders(item_id);

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

CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'scheduled';

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

CREATE INDEX idx_notification_devices_user ON notification_devices(user_id, enabled);

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

CREATE INDEX idx_invoices_user ON invoices(user_id, status);
CREATE INDEX idx_invoices_number ON invoices(user_id, invoice_number);
CREATE INDEX idx_invoices_due ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');

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

CREATE INDEX idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_item ON calendar_events(item_id) WHERE item_id IS NOT NULL;

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

CREATE INDEX idx_whatsapp_messages_user ON whatsapp_messages(user_id, direction);
CREATE INDEX idx_whatsapp_messages_connection ON whatsapp_messages(connection_id);

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

CREATE INDEX idx_ai_clarifications_user ON ai_clarifications(user_id, resolved);

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

CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

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
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reminder preferences RLS
CREATE POLICY "Users can view own reminder prefs" ON reminder_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminder prefs" ON reminder_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminder prefs" ON reminder_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Reminders RLS
CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notification devices RLS
CREATE POLICY "Users can view own devices" ON notification_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON notification_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devices" ON notification_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON notification_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Invoices RLS
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Calendar connections RLS
CREATE POLICY "Users can view own calendar connections" ON calendar_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar connections" ON calendar_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar connections" ON calendar_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar connections" ON calendar_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Calendar events RLS
CREATE POLICY "Users can view own calendar events" ON calendar_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar events" ON calendar_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar events" ON calendar_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar events" ON calendar_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp connections RLS
CREATE POLICY "Users can view own whatsapp connections" ON whatsapp_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp connections" ON whatsapp_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own whatsapp connections" ON whatsapp_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- WhatsApp messages RLS
CREATE POLICY "Users can view own whatsapp messages" ON whatsapp_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own whatsapp messages" ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI clarifications RLS
CREATE POLICY "Users can view own ai clarifications" ON ai_clarifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai clarifications" ON ai_clarifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai clarifications" ON ai_clarifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily briefings RLS
CREATE POLICY "Users can view own briefings" ON daily_briefings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own briefings" ON daily_briefings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own briefings" ON daily_briefings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Audit log RLS
CREATE POLICY "Users can view own audit log" ON audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit log" ON audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
