/**
 * Ideas Tab Screen ('/(tabs)/ideas')
 *
 * Inspiration feed with vector brand & action icons (no emojis).
 * 1-Tap execution launches multi-step cloud research and publishes to Feed.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PlayIcon,
  Comment01Icon,
  Globe02Icon,
  Airplane01Icon,
  ShoppingBag01Icon,
  Activity01Icon,
  Calendar01Icon,
  Moon02Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { IDEA_ITEMS } from '@/constants/dummyData';
import { IdeaItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';

const IDEA_ICONS: Record<string, any> = {
  'idea-1': Airplane01Icon,
  'idea-2': ShoppingBag01Icon,
  'idea-3': Activity01Icon,
  'idea-4': Calendar01Icon,
  'idea-5': Moon02Icon,
};

export default function IdeasScreen() {
  const router = useRouter();
  const [runningIdeaId, setRunningIdeaId] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{ [id: string]: { replayUrl?: string; message?: string } }>({});

  const handleRunIdea = async (item: IdeaItem) => {
    if (runningIdeaId) return;

    setRunningIdeaId(item.id);
    showToast(`Launching cloud agent for "${item.title}"...`);

    try {
      const res = await ApiService.runIdea(item);
      if (res.success) {
        showToast(`Completed! Added to Feed.`);
        setLastResults((prev) => ({
          ...prev,
          [item.id]: {
            replayUrl: res.replayUrl || 'https://www.browserbase.com',
            message: res.message,
          },
        }));
      } else {
        showToast(res.message || 'Execution completed');
      }
    } catch {
      showToast('Execution error');
    } finally {
      setRunningIdeaId(null);
    }
  };

  const handleDiscussInChat = async (item: IdeaItem) => {
    // Create new session or switch to chat and load prompt
    const session = await StorageService.createSession(item.title);
    await StorageService.setActiveSessionId(session.id);
    showToast(`Started new chat on "${item.title}"`);
    router.push('/(tabs)/chat' as any);
  };

  const handleOpenReplay = (url?: string) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => showToast(`Opening: ${url}`));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Page Title & Subtitle */}
        <View style={styles.titleWrapper}>
          <Text style={styles.pageTitle}>Ideas & Workflows</Text>
          <Text style={styles.subtitle}>
            1-tap autonomous workflows executed in Browserbase cloud Chrome
          </Text>
        </View>

        {/* Ideas List */}
        {IDEA_ITEMS.map((item, index) => {
          const isRunning = runningIdeaId === item.id;
          const result = lastResults[item.id];
          const IconComponent = IDEA_ICONS[item.id] || SparklesIcon;

          return (
            <View key={item.id} style={styles.cardContainer}>
              <View style={styles.ideaCard}>
                {/* Header row: Vector Icon & Title */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <HugeiconsIcon icon={IconComponent} size={20} color={Colors.primary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.headerTextWrapper}>
                    <Text style={styles.ideaTitle}>{item.title}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.ideaDescription}>{item.description}</Text>

                {/* Replay badge if finished */}
                {result?.replayUrl && (
                  <TouchableOpacity
                    style={styles.replayBadge}
                    onPress={() => handleOpenReplay(result.replayUrl)}
                    activeOpacity={0.7}>
                    <HugeiconsIcon icon={Globe02Icon} size={13} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.replayBadgeText}>View Cloud Replay</Text>
                  </TouchableOpacity>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.runBtn, isRunning && styles.runningBtn]}
                    onPress={() => handleRunIdea(item)}
                    disabled={isRunning}
                    activeOpacity={0.8}>
                    {isRunning ? (
                      <>
                        <ActivityIndicator size="small" color={Colors.white} />
                        <Text style={styles.runBtnText}>Agent Browsing...</Text>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={PlayIcon} size={13} color={Colors.white} strokeWidth={2.4} />
                        <Text style={styles.runBtnText}>Run Workflow</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => handleDiscussInChat(item)}
                    activeOpacity={0.7}>
                    <HugeiconsIcon icon={Comment01Icon} size={15} color={Colors.iconDark} strokeWidth={2} />
                    <Text style={styles.chatBtnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {index < IDEA_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  titleWrapper: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.iconDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  cardContainer: {
    marginBottom: 6,
  },
  ideaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrapper: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iconDark,
    lineHeight: 20,
  },
  ideaDescription: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  replayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  runBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 42,
    gap: 8,
  },
  runningBtn: {
    backgroundColor: '#3B82F6',
  },
  runBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 42,
    paddingHorizontal: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatBtnText: {
    color: Colors.iconDark,
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 8,
  },
});
