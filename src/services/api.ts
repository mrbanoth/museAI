import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AgentTask, FeedItem, MuseEvent } from '@/types';
import { supabase } from '@/services/supabase';

// Resolve the backend: explicit env var first, then the Metro host (same machine as `npm run server`)
const getApiBaseUrl = () => {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  // Deployed web build is served by the agent server itself: same origin
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return `${window.location.origin}/api`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3001/api`;
    }
  }

  if (Platform.OS === 'android') {
    // Android emulator reaches the host machine through 10.0.2.2
    return 'http://10.0.2.2:3001/api';
  }
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();
const API_TOKEN = process.env.EXPO_PUBLIC_MUSE_API_TOKEN;

export interface AgentActionData {
  type: string;
  title: string;
  sessionId?: string;
  liveViewUrl?: string;
  replayUrl?: string;
  url?: string;
  status?: 'COMPLETED' | 'FAILED';
  details?: any;
}

export interface ConnectorStatus {
  id: string;
  name: string;
  /** Server has Google OAuth credentials configured */
  available: boolean;
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export interface ChatApiResponse {
  success: boolean;
  error?: string;
  data?: {
    reply: string;
    actions: AgentActionData[];
    suggestedTasks?: string[];
    engine?: 'gemini' | 'basic';
  };
}

/** Bearer token for the agent server: shared secret if configured, else the Supabase session */
async function authToken(): Promise<string | undefined> {
  if (API_TOKEN) return API_TOKEN;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = 75000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = await authToken();
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error || `Request failed (${res.status})`);
    }
    return body as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('The server is taking too long (it may be waking up). Please try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const newRequestId = () => `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const ApiService = {
  async checkHealth() {
    try {
      return await request<any>('/health', {}, 8000);
    } catch (e: any) {
      return { status: 'OFFLINE', error: e.message, llm: { configured: false }, browserbase: { status: 'UNKNOWN' } };
    }
  },

  async sendMessage(
    message: string,
    history: Array<{ sender: string; text: string }> = [],
    requestId?: string
  ): Promise<ChatApiResponse> {
    try {
      return await request<ChatApiResponse>(
        '/chat',
        { method: 'POST', body: JSON.stringify({ message, history, requestId }) },
        180000
      );
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Tasks
  async listTasks(): Promise<AgentTask[]> {
    const res = await request<{ tasks: AgentTask[] }>('/tasks');
    return res.tasks;
  },

  async createTask(input: { title: string; subtitle?: string; category?: string; url?: string; schedule?: string }) {
    const res = await request<{ task: AgentTask }>('/tasks', { method: 'POST', body: JSON.stringify(input) });
    return res.task;
  },

  async updateTask(id: string, patch: Partial<Pick<AgentTask, 'title' | 'subtitle' | 'schedule' | 'status' | 'checked' | 'url'>>) {
    const res = await request<{ task: AgentTask }>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return res.task;
  },

  async deleteTask(id: string) {
    await request(`/tasks/${id}`, { method: 'DELETE' });
  },

  /** Starts a run; results arrive through subscribeEvents */
  async runTask(id: string) {
    return request<{ success: boolean; requestId: string }>(`/tasks/${id}/run`, { method: 'POST' });
  },

  // Feed
  async getFeed(): Promise<FeedItem[]> {
    const res = await request<{ feed: FeedItem[] }>('/feed');
    return res.feed;
  },

  async runIdea(idea: { id: string; title: string; prompt: string }, requestId?: string) {
    return request<{ success: boolean; feedItem: FeedItem; replayUrl?: string; message: string }>(
      '/feed/run-idea',
      {
        method: 'POST',
        body: JSON.stringify({ ideaId: idea.id, title: idea.title, prompt: idea.prompt, requestId }),
      },
      180000
    );
  },

  /** Signed-in user's usage today and which services are live on the server */
  async getMe() {
    return request<{
      email: string;
      usage: { used: number; limit: number };
      services: { ai: boolean; browser: boolean; google: boolean };
    }>('/me');
  },

  // Connectors (Google OAuth handled by the backend)
  async listConnectors(): Promise<ConnectorStatus[]> {
    const res = await request<{ connectors: ConnectorStatus[] }>('/connectors');
    return res.connectors;
  },

  /** Returns the Google consent URL to open in a browser */
  async getConnectUrl(id: string, returnTo?: string) {
    const res = await request<{ url: string }>(`/connectors/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify({ returnTo }),
    });
    return res.url;
  },

  async disconnectConnector(id: string) {
    await request(`/connectors/${id}`, { method: 'DELETE' });
  },

};

// ---------------------------------------------------------------------------
// Live events: one shared connection (SSE on web, long-polling on native)
// ---------------------------------------------------------------------------

type Listener = (event: MuseEvent) => void;
const listeners = new Set<Listener>();
let lastSeq: number | undefined;
let stopConnection: (() => void) | null = null;

function dispatch(event: MuseEvent) {
  lastSeq = event.seq;
  listeners.forEach((l) => {
    try {
      l(event);
    } catch (e) {
      console.warn('Event listener error:', e);
    }
  });
}

function connectSse() {
  let source: any = null;
  let active = true;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const open = async () => {
    // Fresh token on every (re)connect: Supabase access tokens expire hourly
    const token = await authToken();
    if (!active) return;
    const params = new URLSearchParams();
    if (lastSeq !== undefined) params.set('since', String(lastSeq));
    if (token) params.set('token', token);
    source = new (globalThis as any).EventSource(`${API_BASE_URL}/events/stream?${params}`);
    source.onmessage = (msg: { data: string }) => {
      try {
        dispatch(JSON.parse(msg.data));
      } catch {}
    };
    source.onerror = () => {
      source?.close();
      if (active) retry = setTimeout(open, 4000);
    };
  };
  open();

  return () => {
    active = false;
    if (retry) clearTimeout(retry);
    source?.close();
  };
}

function connectLongPoll() {
  let active = true;
  const loop = async () => {
    while (active) {
      try {
        const query = lastSeq !== undefined ? `?since=${lastSeq}` : '';
        const res = await request<{ seq: number; events: MuseEvent[] }>(`/events${query}`, {}, 30000);
        if (!active) break;
        if (lastSeq === undefined) lastSeq = res.seq;
        res.events.forEach(dispatch);
      } catch {
        // Backend offline: back off before retrying
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  };
  loop();
  return () => {
    active = false;
  };
}

/**
 * Subscribe to live backend events (task runs, feed updates, agent progress steps).
 */
export function subscribeEvents(listener: Listener): () => void {
  listeners.add(listener);
  if (!stopConnection) {
    stopConnection =
      Platform.OS === 'web' && typeof (globalThis as any).EventSource !== 'undefined' ? connectSse() : connectLongPoll();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stopConnection) {
      stopConnection();
      stopConnection = null;
    }
  };
}
