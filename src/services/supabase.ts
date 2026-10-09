import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, TaskGoalItem, FeedItem, AgentProfile } from '@/types';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hmkdafydnmouvmdvgwin.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_3k8MdQMUoI-zhCXze3dBIA_LD_hBBjT';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: (isBrowser || Platform.OS !== 'web' ? AsyncStorage : undefined) as any,
    autoRefreshToken: isBrowser || Platform.OS !== 'web',
    persistSession: isBrowser || Platform.OS !== 'web',
    detectSessionInUrl: isBrowser && Platform.OS === 'web',
  },
});

export const isSupabaseConfigured = () => {
  return !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10;
};

export const SupabaseService = {
  // Authentication
  async signUp(email: string, pass: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Platform.OS === 'web' ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signOut error:', error.message);
  },

  async getCurrentSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Messages sync
  async syncMessages(messages: ChatMessage[]) {
    if (!isSupabaseConfigured()) return;
    try {
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
