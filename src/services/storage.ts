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

export const StorageService = {
  // Chat Messages
  async getChatMessages(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_MESSAGES);
      if (data) {
        return JSON.parse(data);
      }
      return INITIAL_CHAT_MESSAGES;
    } catch (e) {
      console.warn('[Storage] Error loading chat messages:', e);
      return INITIAL_CHAT_MESSAGES;
    }
  },

  async saveChatMessages(messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('[Storage] Error saving chat messages:', e);
    }
  },

  async clearChatMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.CHAT_MESSAGES);
    } catch (e) {
      console.warn('[Storage] Error clearing chat messages:', e);
    }
  },

  // Side Chats
  async getSideChats(): Promise<SideChatItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SIDE_CHATS);
      if (data) {
        return JSON.parse(data);
      }
      return SIDE_CHATS;
    } catch (e) {
      return SIDE_CHATS;
    }
  },

  async saveSideChats(sideChats: SideChatItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SIDE_CHATS, JSON.stringify(sideChats));
    } catch (e) {
      console.warn('[Storage] Error saving side chats:', e);
    }
  },

  // Tasks & Goals
  async getTasks(): Promise<TaskGoalItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TASKS);
      if (data) {
        return JSON.parse(data);
      }
      return TASK_GOALS;
    } catch (e) {
      return TASK_GOALS;
    }
  },

  async saveTasks(tasks: TaskGoalItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('[Storage] Error saving tasks:', e);
    }
  },

  // Agent Profile Customization
  async getAgentProfile(): Promise<AgentProfile> {
    const defaultProfile: AgentProfile = {
      name: 'Muse AI',
      subtitle: 'Autonomous Agent',
      icon: 'muse',
      color: '#2563EB',
    };

    try {
      const data = await AsyncStorage.getItem(KEYS.AGENT_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
      return defaultProfile;
    } catch (e) {
      return defaultProfile;
    }
  },

  async saveAgentProfile(profile: AgentProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.AGENT_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('[Storage] Error saving agent profile:', e);
    }
  },

  // User Auth State
  async getUserAuth(): Promise<{ signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string } | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_AUTH);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async saveUserAuth(user: { signedIn: boolean; email?: string; name?: string; avatar?: string; userId?: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_AUTH, JSON.stringify(user));
    } catch (e) {
      console.warn('[Storage] Error saving user auth:', e);
    }
  },

  async clearUserAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER_AUTH);
    } catch (e) {
      console.warn('[Storage] Error clearing user auth:', e);
    }
  },
};
