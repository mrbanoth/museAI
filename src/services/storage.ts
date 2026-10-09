import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, SideChatItem, TaskGoalItem, AgentProfile } from '@/types';
import {
  INITIAL_CHAT_MESSAGES,
  SIDE_CHATS,
  TASK_GOALS,
} from '@/constants/dummyData';

const KEYS = {
  CHAT_MESSAGES: '@muse_ai:chat_messages',
  SIDE_CHATS: '@muse_ai:side_chats',
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

export const StorageService = {
  // Chat Messages
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const data = await safeStorage.getItem(KEYS.CHAT_MESSAGES);
      if (data) {
        return JSON.parse(data);
      }
      return INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  },

  async saveChatMessages(messages: ChatMessage[]): Promise<void> {
    try {
      await safeStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch {}
  },

  async clearChatMessages(): Promise<void> {
    try {
      await safeStorage.removeItem(KEYS.CHAT_MESSAGES);
    } catch {}
  },

  // Side Chats
  async getSideChats(): Promise<SideChatItem[]> {
    try {
      const data = await safeStorage.getItem(KEYS.SIDE_CHATS);
      if (data) {
        return JSON.parse(data);
      }
      return SIDE_CHATS;
    } catch {
      return SIDE_CHATS;
    }
  },

  async saveSideChats(sideChats: SideChatItem[]): Promise<void> {
    try {
      await safeStorage.setItem(KEYS.SIDE_CHATS, JSON.stringify(sideChats));
    } catch {}
  },

  // Tasks & Goals
  async getTasks(): Promise<TaskGoalItem[]> {
    try {
      const data = await safeStorage.getItem(KEYS.TASKS);
      if (data) {
        return JSON.parse(data);
      }
      return TASK_GOALS;
    } catch {
      return TASK_GOALS;
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
