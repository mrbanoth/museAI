/**
 * TabLayout Component ('/(tabs)/_layout.tsx')
 *
 * Master Tab Layout containing:
 * 1. AppHeader: 3D mascot avatar, agent name capsule pill, sidebar drawer and 3-dots actions
 * 2. Expo Router Tabs viewport for 5 routes:
 *    - /chat
 *    - /feed
 *    - /ideas
 *    - /tasks
 *    - /settings
 * 3. Native Expo Router Tab Bar with active pill capsule and keyboard auto-hide
 * 4. Modals: SidebarDrawer, SettingsMenuModal, EditAgentModal
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, Share, useWindowDimensions } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Comment01Icon,
  File01Icon,
  Idea01Icon,
  CheckmarkSquare02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import {
  AppHeader,
  SidebarDrawer,
  SettingsMenuModal,
  EditAgentModal,
  DesktopSidebar,
  type DesktopRoute,
} from '@/components/common';

/** Width at which the app switches to the web-portal layout (persistent sidebar) */
const WIDE_BREAKPOINT = 900;
import { showToast } from '@/context/ToastContext';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeRoute = (pathname.split('/').filter(Boolean).pop() || 'chat') as string;

  const goTo = (route: DesktopRoute) => router.navigate(`/(tabs)/${route}` as any);

  const selectChat = async (sessionId: string) => {
    const { StorageService } = await import('@/services/storage');
    await StorageService.setActiveSessionId(sessionId);
    setActiveSessionId(sessionId);
    setIsSidebarOpen(false);
    goTo('chat');
  };

  const startNewChat = async () => {
    const { StorageService } = await import('@/services/storage');
    const newSession = await StorageService.createSession();
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
    showToast('Started new chat');
    goTo('chat');
  };

  // Agent mascot & profile state
  const [agentName, setAgentName] = useState('Muse');
  const [agentSubtitle, setAgentSubtitle] = useState('Autonomous Agent');
  const [mascotIcon, setMascotIcon] = useState('muse');
  const [mascotColor, setMascotColor] = useState<string>(Colors.primary);
  const [activeSessionId, setActiveSessionId] = useState('main-chat');

  // Modals state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isEditAgentOpen, setIsEditAgentOpen] = useState(false);

  // Load saved profile
  React.useEffect(() => {
    (async () => {
      const { StorageService } = await import('@/services/storage');
      // Require a real (Supabase-backed) sign-in before showing the app
      const auth = await StorageService.getUserAuth();
      if (!auth?.signedIn || !auth.userId) {
        router.replace('/' as any);
        return;
      }
      const saved = await StorageService.getAgentProfile();
      if (saved) {
        setAgentName(saved.name);
        setAgentSubtitle(saved.subtitle);
        setMascotIcon(saved.icon);
        setMascotColor(saved.color);
      }
      const activeId = await StorageService.getActiveSessionId();
      setActiveSessionId(activeId);
    })();
  }, [router]);

  return (
    <SafeAreaView style={[styles.safeArea, isWide && styles.safeAreaWide]} edges={['top', 'left', 'right']}>
      {/* Web portal / tablet: persistent sidebar */}
      {isWide ? (
        <DesktopSidebar
          activeRoute={activeRoute}
          activeSessionId={activeSessionId}
          collapsed={sidebarCollapsed}
          agentName={agentName}
          onNavigate={goTo}
          onSelectChat={selectChat}
          onNewChat={startNewChat}
        />
      ) : null}

      <View style={styles.main}>
      {/* 1. Persistent App Header */}
      <AppHeader
        agentName={agentName}
        mascotIcon={mascotIcon}
        mascotColor={mascotColor}
        onOpenSidebar={() => (isWide ? setSidebarCollapsed((c) => !c) : setIsSidebarOpen(true))}
        onOpenSettings={() => setIsSettingsMenuOpen(true)}
        onMascotPress={() => setIsEditAgentOpen(true)}
      />

      {/* 2. Expo Router Tabs Viewport */}
      <View style={[styles.contentContainer, isWide && styles.contentWide]}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarHideOnKeyboard: true,
            // The sidebar replaces the bottom tab bar on wide screens
            tabBarStyle: isWide ? { display: 'none' } : styles.tabBar,
            tabBarItemStyle: styles.tabBarItem,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Chat',
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconPill, focused && styles.activeIconPill]}>
                  <HugeiconsIcon
                    icon={Comment01Icon}
                    size={23}
                    color={Colors.iconDark}
                    strokeWidth={2}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconPill, focused && styles.activeIconPill]}>
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={23}
                    color={Colors.iconDark}
                    strokeWidth={2}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="ideas"
            options={{
              title: 'Ideas',
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconPill, focused && styles.activeIconPill]}>
                  <HugeiconsIcon
                    icon={Idea01Icon}
                    size={23}
                    color={Colors.iconDark}
                    strokeWidth={2}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="tasks"
            options={{
              title: 'Task / Goal',
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconPill, focused && styles.activeIconPill]}>
                  <HugeiconsIcon
                    icon={CheckmarkSquare02Icon}
                    size={23}
                    color={Colors.iconDark}
                    strokeWidth={2}
                  />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              href: null,
              title: 'Library',
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconPill, focused && styles.activeIconPill]}>
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={23}
                    color={Colors.iconDark}
                    strokeWidth={2}
                  />
                </View>
              ),
            }}
          />
        </Tabs>
      </View>

      </View>

      {/* 3. Left Sliding Sidebar Drawer (phones) */}
      <SidebarDrawer
        visible={isSidebarOpen}
        activeChatId={activeSessionId}
        agentName={agentName}
        onClose={() => setIsSidebarOpen(false)}
        onSelectChat={selectChat}
        onNewChat={startNewChat}
        onOpenSettings={() => {
          setIsSidebarOpen(false);
          router.replace('/(tabs)/settings' as any);
        }}
        onClearSideChats={async () => {
          const { StorageService } = await import('@/services/storage');
          await StorageService.clearAllSessions();
          setActiveSessionId('main-chat');
          showToast('Side chats cleared');
        }}
      />

      {/* 4. Right 3-Dots Action Sheet */}
      <SettingsMenuModal
        visible={isSettingsMenuOpen}
        onClose={() => setIsSettingsMenuOpen(false)}
        onEditAvatar={() => setIsEditAgentOpen(true)}
        onRename={() => setIsEditAgentOpen(true)}
        onClearChat={async () => {
          const { StorageService } = await import('@/services/storage');
          await StorageService.clearSessionMessages(activeSessionId);
          setIsSettingsMenuOpen(false);
          showToast('Conversation cleared');
          router.replace('/(tabs)/chat' as any);
        }}
        onDeleteChat={async () => {
          const { StorageService } = await import('@/services/storage');
          await StorageService.deleteSession(activeSessionId);
          const active = await StorageService.getActiveSessionId();
          setActiveSessionId(active);
          setIsSettingsMenuOpen(false);
          showToast('Chat deleted');
          router.replace('/(tabs)/chat' as any);
        }}
        onShareChat={async () => {
          setIsSettingsMenuOpen(false);
          const { StorageService } = await import('@/services/storage');
          const sessions = await StorageService.getAllSessions();
          const session = sessions.find((x) => x.id === activeSessionId);
          if (!session || session.messages.length === 0) {
            showToast('Nothing to export yet');
            return;
          }
          const transcript = session.messages
            .map((m) => `${m.sender === 'user' ? 'You' : agentName} (${m.timestamp}):\n${m.text}`)
            .join('\n\n');
          const text = `${session.title}\n\n${transcript}`;
          try {
            if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !(navigator as any).share) {
              await navigator.clipboard.writeText(text);
              showToast('Chat copied to clipboard');
            } else {
              await Share.share({ title: session.title, message: text });
            }
          } catch {
            showToast('Could not export chat');
          }
        }}
      />

      {/* 5. Edit Mascot Avatar & Name Modal */}
      <EditAgentModal
        visible={isEditAgentOpen}
        initialName={agentName}
        initialSubtitle={agentSubtitle}
        initialIcon={mascotIcon}
        initialColor={mascotColor}
        onClose={() => setIsEditAgentOpen(false)}
        onSave={async (data) => {
          setAgentName(data.name);
          setAgentSubtitle(data.subtitle);
          setMascotIcon(data.icon);
          setMascotColor(data.color);
          const { StorageService } = await import('@/services/storage');
          await StorageService.saveAgentProfile(data);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeAreaWide: {
    flexDirection: 'row',
  },
  main: {
    flex: 1,
  },
  contentWide: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 8,
    paddingHorizontal: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  iconPill: {
    width: 58,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconPill: {
    backgroundColor: Colors.tabActiveBg, // Soft #E6E8EA capsule
  },
});
