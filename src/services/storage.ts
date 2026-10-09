import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, TaskGoalItem, AgentProfile, ChatSession, ConnectorItem } from '@/types';

const KEYS = {
  CHAT_SESSIONS: '@muse_ai:chat_sessions',
  ACTIVE_SESSION_ID: '@muse_ai:active_session_id',
  TASKS: '@muse_ai:tasks',
  AGENT_PROFILE: '@muse_ai:agent_profile',
  USER_AUTH: '@muse_ai:user_auth',
  CONNECTORS: '@muse_ai:connectors',
  GOALS: '@muse_ai:goals',
};

// Global in-memory cache to guarantee zero storage latency and seamless offline/native fallback
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

const DEFAULT_CONNECTORS: ConnectorItem[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Autonomous email triage, draft replies, and confirmation extraction',
    iconBg: '#EA4335',
    connected: true,
    category: 'Productivity',
    accountEmail: 'user@gmail.com',
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    description: 'Sync scheduled routines and automated event reminders',
    iconBg: '#4285F4',
    connected: true,
    category: 'Productivity',
    accountEmail: 'user@gmail.com',
  },
  {
    id: 'healthex',
    name: 'HealthEx',
    description: 'VO2 max, daily endurance, and marathon pacing insights',
    iconBg: '#F59E0B',
    connected: true,
    category: 'Health',
  },
  {
    id: 'opentable',
    name: 'OpenTable',
    description: 'Automated dining reservations and table seat tracking',
    iconBg: '#DA3743',
    connected: true,
    category: 'Lifestyle',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Marketplace alerts for deals and item tracking',
    iconBg: '#1877F2',
    connected: true,
    category: 'Social',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Saved places and restaurant recommendation tracking',
    iconBg: '#E1306C',
    connected: true,
    category: 'Social',
  },
  {
    id: 'peloton',
    name: 'Peloton',
    description: 'Workout cadence and daily recovery metrics',
    iconBg: '#1E2022',
    connected: true,
    category: 'Fitness',
  },
  {
    id: 'plaid',
    name: 'Finances (Plaid)',
    description: 'Bank statements, recurring subscription tracking & spending alerts',
    iconBg: '#111827',
    connected: false,
    category: 'Finance',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repository watchers, issue tracking, and automated pull requests',
    iconBg: '#24292E',
    connected: false,
    category: 'Developer',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync workspace notes, project databases, and task backlogs',
    iconBg: '#000000',
    connected: false,
    category: 'Workspace',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team updates and autonomous notification summaries',
    iconBg: '#4A154B',
    connected: false,
    category: 'Workspace',
  },
];

export interface RealGoalItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'tracking' | 'goals';
  checked: boolean;
  replayUrl?: string;
  isRunning?: boolean;
}

const DEFAULT_GOALS: RealGoalItem[] = [
  {
    id: 'track-1',
    title: 'Dinner reservations',
    subtitle: 'Sushi restaurants downtown with 7:30 PM availability',
    category: 'tracking',
    checked: false,
    replayUrl: 'https://www.browserbase.com',
  },
  {
    id: 'goal-1',
    title: 'Marathon prep',
    subtitle: 'Build endurance, hit pace goals, and cross that finish line strong.',
    category: 'goals',
    checked: false,
  },
  {
    id: 'goal-2',
    title: 'Save for new car',
    subtitle: 'On track to hit your goals if you save $210 each month towards your car fund!',
    category: 'goals',
    checked: false,
  },
];

export const StorageService = {
  // Chat Sessions
  async getAllSessions(): Promise<ChatSession[]> {
    try {
      const data = await safeStorage.getItem(KEYS.CHAT_SESSIONS);
      if (data) {
        return JSON.parse(data);
      }
      const initialSession: ChatSession = {
        id: 'main-chat',
        title: 'Main chat',
        messages: [],
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
          messages: [],
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

  // Connectors
  async getConnectors(): Promise<ConnectorItem[]> {
    try {
      const data = await safeStorage.getItem(KEYS.CONNECTORS);
      if (data) {
        return JSON.parse(data);
      }
      await safeStorage.setItem(KEYS.CONNECTORS, JSON.stringify(DEFAULT_CONNECTORS));
      return DEFAULT_CONNECTORS;
    } catch {
      return DEFAULT_CONNECTORS;
    }
  },

  async toggleConnector(id: string): Promise<ConnectorItem[]> {
    const current = await this.getConnectors();
    const updated = current.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c));
    await safeStorage.setItem(KEYS.CONNECTORS, JSON.stringify(updated));
    return updated;
  },

  async saveConnectors(connectors: ConnectorItem[]): Promise<void> {
    await safeStorage.setItem(KEYS.CONNECTORS, JSON.stringify(connectors));
  },

  // Goals & Tracking
  async getGoals(): Promise<RealGoalItem[]> {
    try {
      const data = await safeStorage.getItem(KEYS.GOALS);
      if (data) {
        return JSON.parse(data);
      }
      await safeStorage.setItem(KEYS.GOALS, JSON.stringify(DEFAULT_GOALS));
      return DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  },

  async createGoal(title: string, subtitle: string, category: 'tracking' | 'goals'): Promise<RealGoalItem> {
    const current = await this.getGoals();
    const newGoal: RealGoalItem = {
      id: `goal-${Date.now()}`,
      title,
      subtitle,
      category,
      checked: false,
    };
    const updated = [newGoal, ...current];
    await safeStorage.setItem(KEYS.GOALS, JSON.stringify(updated));
    return newGoal;
  },

  async deleteGoal(id: string): Promise<RealGoalItem[]> {
    const current = await this.getGoals();
    const filtered = current.filter((g) => g.id !== id);
    await safeStorage.setItem(KEYS.GOALS, JSON.stringify(filtered));
    return filtered;
  },

  async toggleGoalCheck(id: string): Promise<RealGoalItem[]> {
    const current = await this.getGoals();
    const updated = current.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g));
    await safeStorage.setItem(KEYS.GOALS, JSON.stringify(updated));
    return updated;
  },

  async saveGoals(goals: RealGoalItem[]): Promise<void> {
    await safeStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
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
      return data ? JSON.parse(data) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  },

  async saveAgentProfile(profile: AgentProfile): Promise<void> {
    await safeStorage.setItem(KEYS.AGENT_PROFILE, JSON.stringify(profile));
  },

  // User Auth State & Avatar
  async getUserAuth(): Promise<{ signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string } | null> {
    try {
      const data = await safeStorage.getItem(KEYS.USER_AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserAuth(user: { signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string }): Promise<void> {
    await safeStorage.setItem(KEYS.USER_AUTH, JSON.stringify(user));
  },

  async updateUserAvatar(avatarUri: string | null): Promise<void> {
    const current = await this.getUserAuth();
    if (current) {
      await this.saveUserAuth({
        ...current,
        avatar: avatarUri || undefined,
      });
    } else {
      await this.saveUserAuth({
        signedIn: true,
        name: 'User',
        email: 'user@muse.ai',
        avatar: avatarUri || undefined,
      });
    }
  },

  async clearUserAuth(): Promise<void> {
    await safeStorage.removeItem(KEYS.USER_AUTH);
  },
};
