import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically resolve backend host IP on physical mobile devices, emulators, and web
const getApiBaseUrl = () => {
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

  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  }

  // Fallback to computer LAN IP
  return 'http://192.168.1.40:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ChatApiResponse {
  success: boolean;
  data: {
    reply: string;
    actions: Array<{
      type: string;
      title: string;
      sessionId?: string;
      liveViewUrl?: string;
      replayUrl?: string;
      url?: string;
      details?: any;
    }>;
    suggestedTasks?: string[];
  };
}

export interface TaskRunResponse {
  success: boolean;
  sessionId: string;
  liveViewUrl: string;
  replayUrl: string;
  status: string;
  message: string;
  data?: any;
}

export const ApiService = {
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch (e: any) {
      console.warn('API Health Check failed:', e.message);
      return { status: 'OFFLINE', browserbase: { status: 'UNKNOWN' } };
    }
  },

  async sendMessage(message: string, history: Array<{ sender: string; text: string }> = []): Promise<ChatApiResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Send chat message failed:', err.message);
      return {
        success: false,
        data: {
          reply: `I encountered a local network error while communicating with the agent backend. (${err.message})`,
          actions: [],
        },
      };
    }
  },

  async runTask(taskId: string, taskTitle?: string, customUrl?: string): Promise<TaskRunResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, taskTitle, customUrl }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Run task failed:', err.message);
      return {
        success: false,
        sessionId: '',
        liveViewUrl: '',
        replayUrl: '',
        status: 'FAILED',
        message: err.message,
      };
    }
  },

  async getFeed(): Promise<{ success: boolean; feed: any[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/feed`);
      return await res.json();
    } catch (err: any) {
      console.warn('Get feed failed:', err.message);
      return { success: false, feed: [] };
    }
  },

  async runIdea(idea: { id: string; title: string; prompt: string; icon: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/feed/run-idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          prompt: idea.prompt,
          icon: idea.icon,
        }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Run idea failed:', err.message);
      return { success: false, message: err.message };
    }
  },

  async listSessions() {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`);
      return await res.json();
    } catch (err: any) {
      return { success: false, sessions: [] };
    }
  },
};
