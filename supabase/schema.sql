-- ==============================================================================
-- Muse AI & Cooper — Supabase PostgreSQL Schema
-- Project: hmkdafydnmouvmdvgwin
-- ==============================================================================

-- 1. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'agent', 'system')),
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  actions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tasks & Goals Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  schedule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  runs_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Autonomous Feed Items Table
CREATE TABLE IF NOT EXISTS public.feed_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  source_url TEXT,
  replay_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT '💡',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Agent Mascot Profile Table
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  id TEXT PRIMARY KEY DEFAULT 'current_agent',
  name TEXT NOT NULL DEFAULT 'Cooper',
  subtitle TEXT NOT NULL DEFAULT 'Autonomous Agent',
  icon TEXT NOT NULL DEFAULT 'cooper',
  color TEXT NOT NULL DEFAULT '#2563EB',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public access for development (or replace with auth.uid() rules)
CREATE POLICY "Allow public read-write on chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on feed_items" ON public.feed_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on agent_profiles" ON public.agent_profiles FOR ALL USING (true) WITH CHECK (true);
