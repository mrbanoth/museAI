import { createClient } from '@supabase/supabase-js';
import { ChatMessage, TaskGoalItem, FeedItem, AgentProfile } from '@/types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hmkdafydnmouvmdvgwin.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'placeholder-anon-key');

export const isSupabaseConfigured = () => {
  return !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder-anon-key';
};

export const SupabaseService = {
  // Messages sync
  async syncMessages(messages: ChatMessage[]) {
    if (!isSupabaseConfigured()) return;
    try {
      // Upsert messages
      const rows = messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
        actions: m.actions ? JSON.stringify(m.actions) : null,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('chat_messages').upsert(rows);
    } catch (e: any) {
      console.warn('[Supabase] syncMessages error:', e.message);
    }
  },

  async fetchMessages(): Promise<ChatMessage[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) return null;

      return data.map((d: any) => ({
        id: d.id,
        sender: d.sender,
        text: d.text,
        timestamp: d.timestamp,
        actions: d.actions ? JSON.parse(d.actions) : undefined,
      }));
    } catch (e: any) {
      console.warn('[Supabase] fetchMessages error:', e.message);
      return null;
    }
  },

  // Tasks sync
  async syncTasks(tasks: TaskGoalItem[]) {
    if (!isSupabaseConfigured()) return;
    try {
      const rows = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        schedule: t.schedule,
        status: t.status,
        runs_count: t.runsCount,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('tasks').upsert(rows);
    } catch (e: any) {
      console.warn('[Supabase] syncTasks error:', e.message);
    }
  },

  // Agent Profile sync
  async syncProfile(profile: AgentProfile) {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('agent_profiles').upsert({
        id: 'current_agent',
        name: profile.name,
        subtitle: profile.subtitle,
        icon: profile.icon,
        color: profile.color,
        updated_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('[Supabase] syncProfile error:', e.message);
    }
  },
};
