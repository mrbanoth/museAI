/**
 * Ideas Tab Screen ('/(tabs)/ideas')
 *
 * Clean list of things Muse can do right now (matches the reference design):
 * - Tap a row: start a chat that sends the idea's prompt
 * - Run (▶): run it in the background and post the result to the Feed
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PlayIcon,
  Airplane01Icon,
  ShoppingBag01Icon,
  News01Icon,
  Calendar01Icon,
  Mail01Icon,
  SparklesIcon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { IDEA_ITEMS } from '@/constants/dummyData';
import { IdeaItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService, newRequestId, subscribeEvents } from '@/services/api';
import { StorageService } from '@/services/storage';

const IDEA_STYLE: Record<string, { icon: any; color: string; bg: string }> = {
  'idea-1': { icon: Airplane01Icon, color: Colors.primary, bg: Colors.tileBlue },
  'idea-2': { icon: ShoppingBag01Icon, color: Colors.error, bg: Colors.tilePeach },
  'idea-3': { icon: News01Icon, color: Colors.warning, bg: Colors.tileAmber },
  'idea-4': { icon: Calendar01Icon, color: Colors.success, bg: Colors.tileGreen },
  'idea-5': { icon: Mail01Icon, color: Colors.violet, bg: Colors.tileViolet },
};

export default function IdeasScreen() {
  const router = useRouter();
  const [runningIdeaId, setRunningIdeaId] = useState<string | null>(null);
  const [liveStep, setLiveStep] = useState<{ requestId: string; text: string } | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    return subscribeEvents((event) => {
      if (event.type === 'agent.step' && event.requestId) {
        setLiveStep((cur) => (cur && cur.requestId === event.requestId ? { ...cur, text: event.data.text } : cur));
      }
    });
  }, []);

  const handleRunIdea = async (item: IdeaItem) => {
    if (runningIdeaId) return;
    const requestId = newRequestId();
    setRunningIdeaId(item.id);
    setLiveStep({ requestId, text: 'Starting…' });
    try {
      await ApiService.runIdea(item, requestId);
      setDoneIds((prev) => new Set(prev).add(item.id));
      showToast('Done — result posted to your Feed');
    } catch (e: any) {
      showToast(e.message || 'Could not run this idea');
    } finally {
      setRunningIdeaId(null);
      setLiveStep(null);
    }
  };

  // New chat that immediately sends the idea's prompt to the agent
  const handleOpenInChat = async (item: IdeaItem) => {
    const session = await StorageService.createSession(item.title);
    await StorageService.setActiveSessionId(session.id);
    await StorageService.setPendingPrompt(item.prompt);
    router.push('/(tabs)/chat' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Ideas</Text>

        {IDEA_ITEMS.map((item, index) => {
          const look = IDEA_STYLE[item.id] || { icon: SparklesIcon, color: Colors.primary, bg: Colors.tileBlue };
          const isRunning = runningIdeaId === item.id;
          const isDone = doneIds.has(item.id);
          return (
            <View key={item.id}>
              <TouchableOpacity style={styles.row} onPress={() => handleOpenInChat(item)} activeOpacity={0.6}>
                <View style={[styles.iconTile, { backgroundColor: look.bg }]}>
                  <HugeiconsIcon icon={look.icon} size={22} color={look.color} strokeWidth={2} />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.ideaTitle}>{item.title}</Text>
                  <Text style={styles.ideaDescription} numberOfLines={isRunning ? 1 : 3}>
                    {isRunning ? liveStep?.text || 'Working…' : item.description}
                  </Text>
                  {isDone && !isRunning ? (
                    <TouchableOpacity onPress={() => router.push('/(tabs)/feed' as any)} hitSlop={8}>
                      <Text style={styles.doneLink}>View result in Feed ›</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[styles.runBtn, isDone && styles.runBtnDone]}
                  onPress={() => handleRunIdea(item)}
                  disabled={!!runningIdeaId}
                  hitSlop={8}
                  accessibilityLabel={`Run ${item.title} in the background`}>
                  {isRunning ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <HugeiconsIcon
                      icon={isDone ? CheckmarkCircle01Icon : PlayIcon}
                      size={16}
                      color={isDone ? Colors.success : Colors.iconDark}
                      strokeWidth={2.2}
                    />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
              {index < IDEA_ITEMS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          );
        })}

        <Text style={styles.footnote}>Tap an idea to do it together in chat, or ▶ to let Muse run it in the background.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 4,
  },
  ideaDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  doneLink: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  runBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    marginTop: 4,
  },
  runBtnDone: {
    backgroundColor: Colors.successLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 58,
  },
  footnote: {
    marginTop: 20,
    fontSize: 12,
    color: Colors.iconMuted,
    textAlign: 'center',
  },
});
