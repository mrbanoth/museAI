/**
 * SidebarDrawer Component
 *
 * Fullscreen sliding drawer interface providing dynamic session management:
 * 1. Top bar: Agent title & right arrow dismissal button
 * 2. Main Chat: Quick jump capsule back to primary conversation
 * 3. Dynamic Side Chats: List of saved sessions with instant switch and individual delete action
 * 4. Bottom Toolbar: Settings gear shortcut, search filter input, and compose new chat button
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowRight01Icon,
  Delete02Icon,
  Settings01Icon,
  Search01Icon,
  Edit02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { ChatSession } from '@/types';
import { StorageService } from '@/services/storage';
import { showToast } from '@/context/ToastContext';

export interface SidebarDrawerProps {
  visible: boolean;
  activeChatId?: string;
  agentName?: string;
  onClose: () => void;
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  onOpenSettings?: () => void;
  onClearSideChats?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  visible,
  activeChatId,
  agentName = 'Muse',
  onClose,
  onSelectChat,
  onNewChat,
  onOpenSettings,
  onClearSideChats,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const loadSessions = async () => {
    const all = await StorageService.getAllSessions();
    setSessions(all);
  };

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible]);

  const handleDeleteSession = async (sessionId: string, title: string) => {
    await StorageService.deleteSession(sessionId);
    showToast(`Deleted "${title}"`);
    await loadSessions();
    if (activeChatId === sessionId) {
      const remaining = await StorageService.getAllSessions();
      if (remaining.length > 0) {
        onSelectChat(remaining[0].id);
      }
    }
  };

  const handleClearAll = async () => {
    await StorageService.clearAllSessions();
    showToast('All side chats cleared');
    await loadSessions();
    onSelectChat('main-chat');
  };

  // Filter side chat topics by active search query
  const filteredChats = sessions.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Fullscreen white sidebar with safe area */}
        <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
          {/* Top Bar: Center Name + Right Arrow Button */}
          <View style={styles.header}>
            <View style={styles.headerSideSpacer} />

            <Text style={styles.headerTitle}>{agentName}</Text>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close sidebar">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={22}
                color={Colors.iconDark}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>

          {/* Main Chat Capsule Button */}
          <View style={styles.mainChatWrapper}>
            <TouchableOpacity
              style={[
                styles.mainChatCapsule,
                activeChatId === 'main-chat' && styles.mainChatCapsuleActive,
              ]}
              onPress={() => {
                onSelectChat('main-chat');
                onClose();
              }}
              activeOpacity={0.8}>
              <Text style={styles.mainChatText}>Main chat</Text>
            </TouchableOpacity>
          </View>

          {/* Thin Divider Line */}
          <View style={styles.divider} />

          {/* Side Chats Section */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderText}>Side chats</Text>

              <TouchableOpacity
                style={styles.trashBtn}
                onPress={handleClearAll}
                activeOpacity={0.7}
                accessibilityLabel="Clear side chats">
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={18}
                  color={Colors.iconMuted}
                  strokeWidth={1.8}
                />
              </TouchableOpacity>
            </View>

            {/* Side Chats List */}
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              return (
                <View key={chat.id} style={[styles.chatRow, isActive && styles.chatRowActive]}>
                  <TouchableOpacity
                    style={styles.chatRowContent}
                    onPress={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[styles.chatRowText, isActive && styles.chatRowTextActive]}
                      numberOfLines={1}>
                      {chat.title}
                    </Text>
                    {chat.hasUnreadDot && <View style={styles.blueDot} />}
                  </TouchableOpacity>

                  {/* Individual Delete Button */}
                  <TouchableOpacity
                    style={styles.deleteItemBtn}
                    onPress={() => handleDeleteSession(chat.id, chat.title)}
                    activeOpacity={0.7}>
                    <HugeiconsIcon icon={Delete02Icon} size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Toolbar: Settings Gear (Left) + Search (Center) + Compose (Right) */}
          <View style={styles.bottomToolbar}>
            {/* Settings Gear Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => {
                onClose();
                onOpenSettings?.();
              }}
              activeOpacity={0.7}
              accessibilityLabel="Settings">
              <HugeiconsIcon
                icon={Settings01Icon}
                size={22}
                color={Colors.iconDark}
                strokeWidth={2}
              />
            </TouchableOpacity>

            {/* Search Capsule Input */}
            <View style={styles.searchCapsule}>
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color={Colors.iconMuted}
                strokeWidth={2}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={Colors.iconMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* New Chat Compose Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => {
                onClose();
                onNewChat();
              }}
              activeOpacity={0.7}
              accessibilityLabel="New chat">
              <HugeiconsIcon
                icon={Edit02Icon}
                size={20}
                color={Colors.iconDark}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerSideSpacer: {
    width: 48,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.2,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAFAFB',
    borderWidth: 1,
    borderColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainChatWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainChatCapsule: {
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainChatCapsuleActive: {
    backgroundColor: '#E5E7EB',
  },
  mainChatText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trashBtn: {
    padding: 6,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  chatRowActive: {
    backgroundColor: '#F1F5F9',
  },
  chatRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatRowText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.iconDark,
    flex: 1,
  },
  chatRowTextActive: {
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteItemBtn: {
    padding: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066FF',
  },
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    backgroundColor: Colors.white,
  },
  searchCapsule: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAFAFB',
    borderWidth: 1,
    borderColor: '#ECEEF0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.iconDark,
  },
});
