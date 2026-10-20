/**
 * DesktopSidebar — persistent left navigation for the web portal / tablets.
 *
 * - "Muse" title + Invite (shares the app link)
 * - Main chat, Feed, Ideas, Goals, Library
 * - Side chats (real local chat sessions) with archive-all
 * - Bottom bar: settings, search (filters side chats), new chat
 * - Collapses to an icon rail
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Share } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Comment01Icon,
  File01Icon,
  Idea01Icon,
  CheckmarkSquare02Icon,
  DashboardSquare02Icon,
  Settings02Icon,
  Search01Icon,
  PencilEdit02Icon,
  Archive02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { StorageService, onSessionsChanged } from '@/services/storage';
import { API_BASE_URL } from '@/services/api';
import { showToast } from '@/context/ToastContext';
import { ChatSession } from '@/types';

export type DesktopRoute = 'chat' | 'feed' | 'ideas' | 'tasks' | 'library' | 'settings';

const NAV: Array<{ route: DesktopRoute; label: string; icon: any }> = [
  { route: 'chat', label: 'Main chat', icon: Comment01Icon },
  { route: 'feed', label: 'Feed', icon: File01Icon },
  { route: 'ideas', label: 'Ideas', icon: Idea01Icon },
  { route: 'tasks', label: 'Goals', icon: CheckmarkSquare02Icon },
  { route: 'library', label: 'Library', icon: DashboardSquare02Icon },
];

interface DesktopSidebarProps {
  /** 'panel' = floating card beside the content (web), 'drawer' = fills the phone slide-in drawer */
  variant?: 'panel' | 'drawer';
  activeRoute: string;
  activeSessionId: string;
  collapsed: boolean;
  agentName: string;
  onNavigate: (route: DesktopRoute) => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  variant = 'panel',
  activeRoute,
  activeSessionId,
  collapsed,
  agentName,
  onNavigate,
  onSelectChat,
  onNewChat,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setSessions(await StorageService.getAllSessions());
  }, []);

  useEffect(() => {
    load();
    return onSessionsChanged(load);
  }, [load]);

  const handleInvite = async () => {
    const link = API_BASE_URL.replace(/\/api$/, '');
    const message = `Try Muse — my AI agent that browses the web and handles Gmail & Calendar: ${link}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !(navigator as any).share) {
        await navigator.clipboard.writeText(message);
        showToast('Invite link copied');
      } else {
        await Share.share({ message });
      }
    } catch {
      showToast('Could not share invite');
    }
  };

  const handleArchiveAll = async () => {
    await StorageService.clearAllSessions();
    showToast('Side chats archived');
  };

  // The main chat is listed in the nav; side chats are the rest
  const sideChats = sessions
    .filter((s) => s.id !== 'main-chat')
    .filter((s) => !query.trim() || s.title.toLowerCase().includes(query.trim().toLowerCase()));

  const isChatRoute = activeRoute === 'chat';

  if (collapsed) {
    return (
      <View style={[styles.container, styles.rail]}>
        {NAV.map((item) => {
          const active = activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.railBtn, active && styles.navItemActive]}
              onPress={() => onNavigate(item.route)}
              accessibilityLabel={item.label}>
              <HugeiconsIcon icon={item.icon} size={20} color={Colors.iconDark} strokeWidth={1.8} />
            </TouchableOpacity>
          );
        })}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.railBtn} onPress={onNewChat} accessibilityLabel="New chat">
          <HugeiconsIcon icon={PencilEdit02Icon} size={20} color={Colors.iconDark} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.railBtn, activeRoute === 'settings' && styles.navItemActive]}
          onPress={() => onNavigate('settings')}
          accessibilityLabel="Settings">
          <HugeiconsIcon icon={Settings02Icon} size={20} color={Colors.iconDark} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, variant === 'drawer' && styles.drawer]}>
      {/* Title + Invite */}
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {agentName}
        </Text>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} activeOpacity={0.8}>
          <Text style={styles.inviteText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Main navigation */}
      <View style={styles.nav}>
        {NAV.map((item) => {
          const active = item.route === 'chat' ? isChatRoute && activeSessionId === 'main-chat' : activeRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => (item.route === 'chat' ? onSelectChat('main-chat') : onNavigate(item.route))}
              activeOpacity={0.7}>
              <HugeiconsIcon icon={item.icon} size={20} color={Colors.iconDark} strokeWidth={1.8} />
              <Text style={styles.navText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* Side chats */}
      <View style={styles.sideHeader}>
        <Text style={styles.sideTitle}>Side chats</Text>
        {sideChats.length > 0 ? (
          <TouchableOpacity onPress={handleArchiveAll} accessibilityLabel="Archive all side chats">
            <HugeiconsIcon icon={Archive02Icon} size={18} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView style={styles.sideList} showsVerticalScrollIndicator={false}>
        {sideChats.length === 0 ? (
          <Text style={styles.emptyText}>{query ? 'No chats match your search' : 'New chats you start show up here'}</Text>
        ) : (
          sideChats.map((s) => {
            const active = isChatRoute && activeSessionId === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sideItem, active && styles.navItemActive]}
                onPress={() => onSelectChat(s.id)}
                activeOpacity={0.7}>
                <Text style={styles.sideItemText} numberOfLines={1}>
                  {s.title}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom bar: settings · search · new chat */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.circleBtn, activeRoute === 'settings' && styles.navItemActive]}
          onPress={() => onNavigate('settings')}
          accessibilityLabel="Settings">
          <HugeiconsIcon icon={Settings02Icon} size={19} color={Colors.iconDark} strokeWidth={1.8} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchPill} activeOpacity={1} onPress={() => setSearching(true)}>
          <HugeiconsIcon icon={Search01Icon} size={17} color={Colors.iconMuted} strokeWidth={1.8} />
          {searching || query ? (
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={Colors.iconMuted}
              autoFocus
              onBlur={() => setSearching(false)}
            />
          ) : (
            <Text style={styles.searchPlaceholder}>Search</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleBtn} onPress={onNewChat} accessibilityLabel="New chat">
          <HugeiconsIcon icon={PencilEdit02Icon} size={19} color={Colors.iconDark} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 264,
    margin: 12,
    marginRight: 0,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  drawer: {
    flex: 1,
    width: '100%',
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
    shadowOpacity: 0,
  },
  rail: {
    width: 64,
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    paddingTop: 72,
  },
  railBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  inviteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  inviteText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  nav: {
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: Colors.tabActiveBg,
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.iconDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 14,
    marginHorizontal: 6,
  },
  sideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  sideTitle: {
    fontSize: 13,
    color: Colors.iconMuted,
    fontWeight: '500',
  },
  sideList: {
    flex: 1,
  },
  sideItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
  },
  sideItemText: {
    fontSize: 14.5,
    color: Colors.iconDark,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.iconMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
  },
  searchPill: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceMuted,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.iconMuted,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.iconDark,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
});
