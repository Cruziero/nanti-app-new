/*
# NANTI Core Schema — AI Work Memory for WhatsApp

1. Overview
   NANTI is an AI assistant that understands WhatsApp conversations and turns them into
   commitments, tasks, deadlines, follow-ups, waiting items, people, and projects.
   This migration creates the full data model with user-scoped RLS policies.

2. New Tables
   - `projects` — User projects (e.g., "ABC Export", "Bali Villa", "Marketing")
   - `people` — Contacts extracted from conversations (e.g., "Budi Santoso")
   - `tasks` — Commitments, tasks, follow-ups detected by NANTI AI
   - `waiting_items` — Things the user is waiting for from someone else
   - `conversations` — Original WhatsApp conversation snippets that NANTI analyzed
   - `ai_messages` — Ask NANTI conversation history
   - `inbox_items` — Things NANTI found and is asking the user to track or ignore

3. Columns
   - All tables have `id` (uuid PK), `user_id` (owner, defaults to auth.uid()), `created_at`
   - `projects`: name, description, color
   - `people`: name, company, role, last_conversation_at
   - `tasks`: title, description, type (commitment/task/follow_up/deadline), status (pending/completed/dismissed), priority (low/medium/high/urgent), due_date, project_id, person_id, conversation_id, source (ai/manual)
   - `waiting_items`: title, person_id, project_id, status (waiting/received/snoozed), started_at, days_warning_threshold
   - `conversations`: source (whatsapp/manual), participant, message_text, detected_at
   - `ai_messages`: role (user/assistant), content, metadata (jsonb)
   - `inbox_items`: type, title, person_name, project_name, due_date, conversation_text, status (pending/tracked/ignored), task_id

4. Security
   - RLS enabled on every table.
   - Each table has 4 CRUD policies scoped to `TO authenticated` with `auth.uid() = user_id`.
   - `user_id` columns default to `auth.uid()` so inserts that omit the owner still succeed.
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#25D366',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- People table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  role text,
  last_conversation_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_people" ON people;
CREATE POLICY "select_own_people" ON people FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_people" ON people;
CREATE POLICY "insert_own_people" ON people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_people" ON people;
CREATE POLICY "update_own_people" ON people FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_people" ON people;
CREATE POLICY "delete_own_people" ON people FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Conversations table (original WhatsApp messages)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'whatsapp',
  participant text,
  message_text text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tasks table (commitments, tasks, follow-ups, deadlines)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'task',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  due_date timestamptz,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Waiting items table
CREATE TABLE IF NOT EXISTS waiting_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'waiting',
  started_at timestamptz DEFAULT now(),
  days_warning_threshold integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE waiting_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_waiting" ON waiting_items;
CREATE POLICY "select_own_waiting" ON waiting_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_waiting" ON waiting_items;
CREATE POLICY "insert_own_waiting" ON waiting_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_waiting" ON waiting_items;
CREATE POLICY "update_own_waiting" ON waiting_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_waiting" ON waiting_items;
CREATE POLICY "delete_own_waiting" ON waiting_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI messages table (Ask NANTI conversation history)
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_messages" ON ai_messages;
CREATE POLICY "select_own_ai_messages" ON ai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_messages" ON ai_messages;
CREATE POLICY "insert_own_ai_messages" ON ai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_messages" ON ai_messages;
CREATE POLICY "update_own_ai_messages" ON ai_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_messages" ON ai_messages;
CREATE POLICY "delete_own_ai_messages" ON ai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Inbox items table (things NANTI found)
CREATE TABLE IF NOT EXISTS inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'commitment',
  title text NOT NULL,
  person_name text,
  project_name text,
  due_date timestamptz,
  conversation_text text,
  status text NOT NULL DEFAULT 'pending',
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_inbox" ON inbox_items;
CREATE POLICY "select_own_inbox" ON inbox_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_inbox" ON inbox_items;
CREATE POLICY "insert_own_inbox" ON inbox_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_inbox" ON inbox_items;
CREATE POLICY "update_own_inbox" ON inbox_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_inbox" ON inbox_items;
CREATE POLICY "delete_own_inbox" ON inbox_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_person_id ON tasks(person_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id);
CREATE INDEX IF NOT EXISTS idx_waiting_user_id ON waiting_items(user_id);
CREATE INDEX IF NOT EXISTS idx_waiting_status ON waiting_items(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_user_id ON inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox_items(status);
