/**
 * HomeScreen Component
 *
 * Primary application screen composing the complete Muse AI interface:
 * 1. AppHeader: 3D mascot avatar, agent name capsule pill, sidebar & settings triggers
 * 2. Main Tab Viewport:
 *    - Chat: Interactive conversational agent with simulated streaming responses
 *    - Feed: Autonomous feed and notification updates
 *    - Ideas: 1-tap prompt templates injecting into chat
 *    - Tasks: Scheduled recurring autonomous goals & manual check-in runner
 *    - Settings: Account usage, workspace connector toggles, billing & appearance
 * 3. TabNavigationBar: Stadium-shaped floating bottom dock
 * 4. Modal Overlays: Sliding session sidebar, 3-dots actions menu, and agent customization modal
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  INITIAL_CHAT_MESSAGES,
  ChatMessage,
} from '@/constants/dummyData';
import {
  AppHeader,
  TabNavigationBar,
  TabKey,
  SidebarDrawer,
  SettingsMenuModal,
  EditAgentModal,
} from '@/components/common';
import {
  ChatMessageList,
  ChatInputBar,
} from '@/components/chat';
import {
  FeedTab,
  IdeasTab,
  TasksTab,
  SettingsTab,
} from '@/components/tabs';

/**
 * Main Home Container Screen
 */
export const HomeScreen: React.FC = () => {
  // Navigation Tab state (Starts with 'chat')
  const [activeTab, setActiveTab] = useState<TabKey>('chat');


  // Agent customization state
  const [agentName, setAgentName] = useState('Cooper');
  const [agentSubtitle, setAgentSubtitle] = useState('Autonomous Agent');
  const [mascotIcon, setMascotIcon] = useState('cooper');
  const [mascotColor, setMascotColor] = useState<string>(Colors.primary);

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);

  // Chat conversation state
  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Send message handler
  const handleSendMessage = (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isThinking) return;

    const userMsgId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsThinking(true);

    // Simulated intelligent response
    setTimeout(() => {
      setIsThinking(false);
      const agentMsgId = `msg-${Date.now() + 1}`;
      const agentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let responseText = `That sounds like a great start. I've noted down your goal and can help you break it into simple daily milestones. What's your target timeline?`;

      const lower = prompt.toLowerCase();
      if (lower.includes('health') || lower.includes('workout') || lower.includes('diet') || lower.includes('sleep')) {
        responseText = `Awesome! Building a consistent habit is the key. Would you like me to schedule a gentle daily check-in at your preferred time?`;
      } else if (lower.includes('brief') || lower.includes('morning')) {
        responseText = `I've prepared your morning summary with all your latest updates and task priorities.`;
      }

      const newAgentMsg: ChatMessage = {
        id: agentMsgId,
        sender: 'agent',
        text: responseText,
        timestamp: agentTime,
      };

      setMessages((prev) => [...prev, newAgentMsg]);
    }, 1000);
  };

  // Clear chat conversation
  const handleClearChat = () => {
    setMessages([]);
    if (Platform.OS === 'web') {
      window.alert('Conversation cleared.');
    } else {
      Alert.alert('Chat Cleared', 'All messages in this session have been reset.');
    }
  };

  // Delete chat conversation
  const handleDeleteChat = () => {
    setMessages([]);
    setActiveChatId(`chat-${Date.now()}`);
    if (Platform.OS === 'web') {
      window.alert('Chat session deleted. Started a new clean session.');
    } else {
      Alert.alert('Session Deleted', 'Started a new clean session.');
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setActiveChatId(`chat-${Date.now()}`);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: `Hi! I'm **${agentName}**. What would you like to work on together?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Select chat from sidebar
  const handleSelectRecentChat = (chatTitle: string) => {
    setActiveChatId(`chat-${Date.now()}`);
    if (chatTitle === 'Main chat') {
      setMessages(INITIAL_CHAT_MESSAGES);
    } else {
      setMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          text: chatTitle,
          timestamp: 'Just now',
        },
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'agent',
          text: `I'd love to help with that. What are the key details or targets you'd like to work on?`,
          timestamp: 'Just now',
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. All-Time App Header with 3D Mascot & Name */}
      <AppHeader
        agentName={agentName}
        mascotIcon={mascotIcon}
        mascotColor={mascotColor}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onMascotPress={() => setIsEditAgentOpen(true)}
      />

      {/* 2. Main Content View for Active Tab */}
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
        {activeTab === 'chat' && (
          <View style={styles.tabContent}>
            {/* Scrollable Chat History */}
            <ChatMessageList
              messages={messages}
              isThinking={isThinking}
            />

            {/* Bottom Text Prompt Input Bar */}
            <ChatInputBar
              inputText={inputText}
              onChangeText={setInputText}
              onSend={() => handleSendMessage()}
              onAttach={() => {
                if (Platform.OS === 'web') {
                  window.alert('Attach data or file (UI Demo)');
                } else {
                  Alert.alert('Attach', 'Select file or integration.');
                }
              }}
              onVoice={() => {
                if (Platform.OS === 'web') {
                  window.alert('Listening to voice prompt... (UI Demo)');
                } else {
                  Alert.alert('Voice Input', 'Listening...');
                }
              }}
              isLoading={isThinking}
              placeholder="Message in Start a health goal"
            />
          </View>
        )}

        {activeTab === 'feed' && <FeedTab />}

        {activeTab === 'ideas' && (
          <IdeasTab
            onSelectIdea={(idea) => {
              setInputText(idea.prompt);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            onNewGoal={() => {
              setActiveTab('chat');
              setInputText('I want to start a new goal: ');
            }}
          />
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </KeyboardAvoidingView>

      {/* 3. Floating Bottom Dock / Tab Navigation Bar */}
      <TabNavigationBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 4. Left Fullscreen / Sliding Sidebar Drawer */}
      <SidebarDrawer
        visible={isSidebarOpen}
        activeChatId={activeChatId}
        agentName={agentName}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={handleSelectRecentChat}
        onNewChat={handleNewChat}
        onOpenSettings={() => {
          setIsSidebarOpen(false);
          setActiveTab('settings');
        }}
        onClearSideChats={() => {
          if (Platform.OS === 'web') {
            window.alert('Side chats cleared (UI Demo)');
          } else {
            Alert.alert('Side Chats', 'Cleared side chats.');
          }
        }}
      />

      {/* 5. Right 3-Dots Settings Action Sheet / Menu */}
      <SettingsMenuModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onEditAvatar={() => setIsEditAgentOpen(true)}
        onRename={() => setIsEditAgentOpen(true)}
        onClearChat={handleClearChat}
        onDeleteChat={handleDeleteChat}
        onShareChat={() => {
          if (Platform.OS === 'web') {
            window.alert('Chat transcript copied to clipboard (UI Demo)');
          } else {
            Alert.alert('Share Chat', 'Chat log export generated.');
          }
        }}
      />

      {/* 6. Edit Avatar, Name & Mascot Modal */}
      <EditAgentModal
        visible={isEditAgentOpen}
        initialName={agentName}
        initialSubtitle={agentSubtitle}
        initialIcon={mascotIcon}
        initialColor={mascotColor}
        onClose={() => setIsEditAgentOpen(false)}
        onSave={(data) => {
          setAgentName(data.name);
          setAgentSubtitle(data.subtitle);
          setMascotIcon(data.icon);
          setMascotColor(data.color);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
