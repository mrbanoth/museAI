import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Publishable (anon) key is safe to ship in the client; data access is enforced by RLS policies
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hmkdafydnmouvmdvgwin.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3k8MdQMUoI-zhCXze3dBIA_LD_hBBjT';

// Safe universal storage adapter that never throws ReferenceError on Node.js/SSR
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window === 'undefined') {
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: customStorage as any,
    autoRefreshToken: Platform.OS !== 'web' || typeof window !== 'undefined',
    persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
    detectSessionInUrl: Platform.OS === 'web' && typeof window !== 'undefined',
  },
});

export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
};

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error('Sign-in is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

export const SupabaseService = {
  // Authentication
  async signUp(email: string, pass: string, fullName?: string) {
    assertConfigured();
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
    assertConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Google OAuth. Web: full-page redirect back to the app (session is picked up on load).
   * Native: in-app auth session that returns to the app's deep link with a PKCE code.
   * Returns the session on native, or null on web (the page navigates away).
   */
  async signInWithGoogle() {
    assertConfigured();
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return null;
    }

    const redirectTo = Linking.createURL('auth-callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') {
      throw new Error('Google sign-in was cancelled');
    }

    const { queryParams } = Linking.parse(result.url);
    const code = queryParams?.code;
    if (typeof code !== 'string') {
      throw new Error((queryParams?.error_description as string) || 'Google sign-in failed');
    }
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) throw exchanged.error;
    return exchanged.data.session;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signOut error:', error.message);
  },

  async getCurrentSession() {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
};
