/**
 * Ideas Tab Screen ('/(tabs)/ideas')
 *
 * Inspiration feed showcasing pre-built autonomous agent task templates.
 * 1-Tap execution launches multi-step Browserbase cloud research and publishes to Feed.
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
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { IDEA_ITEMS } from '@/constants/dummyData';
import { IdeaItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';

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
            replayUrl: res.replayUrl,
            message: res.message,
          },
        }));
      } else {
        showToast(res.message || 'Execution failed');
      }
    } catch (e: any) {
      showToast('Execution error');
    } finally {
      setRunningIdeaId(null);
    }
  };

  const handleDiscussInChat = (item: IdeaItem) => {
    showToast(`Loaded "${item.title}" into Chat`);
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

          return (
            <View key={item.id} style={styles.cardContainer}>
              <View style={styles.ideaCard}>
                {/* Header row: Emoji & Title */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>{item.icon}</Text>
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
                    <Text style={styles.replayBadgeText}>View Cloud Replay & Feed Item</Text>
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
                        <Text style={styles.runBtnText}>Run Autonomous Workflow</Text>
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
    paddingBottom: 28,
  },
  titleWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  ideaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  headerTextWrapper: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  ideaDescription: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#555A60',
    lineHeight: 19.5,
    marginTop: 4,
    marginBottom: 12,
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  replayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  runningBtn: {
    backgroundColor: Colors.primaryDark,
  },
  runBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 5,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginTop: 16,
  },
});
