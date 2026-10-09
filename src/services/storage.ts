import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, TaskGoalItem, AgentProfile, ChatSession } from '@/types';

const KEYS = {
  CHAT_SESSIONS: '@muse_ai:chat_sessions',
  ACTIVE_SESSION_ID: '@muse_ai:active_session_id',
  TASKS: '@muse_ai:tasks',
  AGENT_PROFILE: '@muse_ai:agent_profile',
  USER_AUTH: '@muse_ai:user_auth',
};

// Resilient memory cache fallback if native storage bridge is unavailable
const memoryStore: Record<string, string> = {};

const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) {
        memoryStore[key] = val;
        return val;
      }
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

const DEFAULT_GREETING: ChatMessage = {
  id: 'greeting-msg',
  sender: 'agent',
  text: "Hello! I'm Muse, your autonomous AI companion. I can research topics, navigate live cloud browsers, execute scheduled goals, and analyze files.\n\nHow can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const StorageService = {
  // Chat Sessions
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const data = await safeStorage.getItem(KEYS.CHAT_SESSIONS);
      if (data) {
        return JSON.parse(data);
      }
      // Create initial clean session if none exists
      const initialSession: ChatSession = {
        id: 'main-chat',
        title: 'Main chat',
        messages: [DEFAULT_GREETING],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await safeStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify([initialSession]));
      return [initialSession];
    } catch {
      return [
        {
          id: 'main-chat',
          title: 'Main chat',
          messages: [DEFAULT_GREETING],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  async getActiveSessionId(): Promise<string> {
    const active = await safeStorage.getItem(KEYS.ACTIVE_SESSION_ID);
    return active || 'main-chat';
  },

  async setActiveSessionId(sessionId: string): Promise<void> {
    await safeStorage.setItem(KEYS.ACTIVE_SESSION_ID, sessionId);
  },

  async createSession(title?: string): Promise<ChatSession> {
    const sessions = await this.getAllSessions();
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: title || 'New chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    await safeStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(updated));
    await this.setActiveSessionId(newSession.id);
    return newSession;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getAllSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    if (filtered.length === 0) {
      filtered.push({
        id: 'main-chat',
        title: 'Main chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await safeStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(filtered));
    const activeId = await this.getActiveSessionId();
    if (activeId === sessionId) {
      await this.setActiveSessionId(filtered[0].id);
    }
  },

  async clearAllSessions(): Promise<void> {
    const initialSession: ChatSession = {
      id: 'main-chat',
      title: 'Main chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await safeStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify([initialSession]));
    await this.setActiveSessionId('main-chat');
  },

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const sessions = await this.getAllSessions();
    const session = sessions.find((s) => s.id === sessionId);
    return session ? session.messages : [];
  },

  async saveSessionMessages(sessionId: string, messages: ChatMessage[], newTitle?: string): Promise<void> {
    const sessions = await this.getAllSessions();
    const exists = sessions.some((s) => s.id === sessionId);
    let updated: ChatSession[];
    if (exists) {
      updated = sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: newTitle || s.title,
            messages,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    } else {
      updated = [
        {
          id: sessionId,
          title: newTitle || 'New chat',
          messages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...sessions,
      ];
    }
    await safeStorage.setItem(KEYS.CHAT_SESSIONS, JSON.stringify(updated));
  },

  // Legacy helper
  async getChatMessages(): Promise<ChatMessage[]> {
    const activeId = await this.getActiveSessionId();
    return this.getSessionMessages(activeId);
  },

  async saveChatMessages(messages: ChatMessage[]): Promise<void> {
    const activeId = await this.getActiveSessionId();
    await this.saveSessionMessages(activeId, messages);
  },

  // Tasks & Goals
  async getTasks(): Promise<TaskGoalItem[]> {
    try {
      const data = await safeStorage.getItem(KEYS.TASKS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  },

  async saveTasks(tasks: TaskGoalItem[]): Promise<void> {
    try {
      await safeStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch {}
  },

  // Agent Profile Customization
  async getAgentProfile(): Promise<AgentProfile> {
    const defaultProfile: AgentProfile = {
      name: 'Muse',
      subtitle: 'Autonomous Agent',
      icon: 'muse',
      color: '#2563EB',
    };

    try {
      const data = await safeStorage.getItem(KEYS.AGENT_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
      return defaultProfile;
    } catch {
      return defaultProfile;
    }
  },

  async saveAgentProfile(profile: AgentProfile): Promise<void> {
    try {
      await safeStorage.setItem(KEYS.AGENT_PROFILE, JSON.stringify(profile));
    } catch {}
  },

  // User Auth State
  async getUserAuth(): Promise<{ signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string } | null> {
    try {
      const data = await safeStorage.getItem(KEYS.USER_AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserAuth(user: { signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string }): Promise<void> {
    try {
      await safeStorage.setItem(KEYS.USER_AUTH, JSON.stringify(user));
    } catch {}
  },

  async clearUserAuth(): Promise<void> {
    try {
      await safeStorage.removeItem(KEYS.USER_AUTH);
    } catch {}
  },
};
