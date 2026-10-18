-- ==============================================================================
-- Muse AI — Supabase PostgreSQL Schema
-- Every row belongs to a signed-in user; RLS restricts access to the owner.
-- (Tasks & feed currently live on the agent server: server/data/db.json.
--  These tables are ready for moving that state into Supabase.)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'agent', 'system')),
  text TEXT NOT NULL,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'tracking' CHECK (category IN ('tracking', 'goals')),
  url TEXT,
  schedule TEXT NOT NULL DEFAULT 'Manual',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  runs_count INT NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('COMPLETED', 'FAILED')),
  last_summary TEXT,
  last_replay_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feed_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  task_id TEXT REFERENCES public.tasks (id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT,
  replay_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT NOT NULL DEFAULT 'task',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agent_profiles (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Muse',
  subtitle TEXT NOT NULL DEFAULT 'Autonomous Agent',
  icon TEXT NOT NULL DEFAULT 'muse',
  color TEXT NOT NULL DEFAULT '#2563EB',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_session_idx ON public.chat_messages (user_id, session_id, created_at);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON public.tasks (status, next_run_at);
CREATE INDEX IF NOT EXISTS feed_items_user_idx ON public.feed_items (user_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Replace the old development policies that allowed anyone to read/write everything
DROP POLICY IF EXISTS "Allow public read-write on chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow public read-write on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read-write on feed_items" ON public.feed_items;
DROP POLICY IF EXISTS "Allow public read-write on agent_profiles" ON public.agent_profiles;

CREATE POLICY "Owner access on chat_messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner access on tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner access on feed_items" ON public.feed_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner access on agent_profiles" ON public.agent_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
