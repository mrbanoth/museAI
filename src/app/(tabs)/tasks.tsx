/**
 * Goals Tab Screen ('/(tabs)/tasks')
 *
 * Backend-scheduled goals & trackers:
 * - Tasks persist on the agent server and run automatically on their schedule
 * - Manual "Run now" streams progress back over live events
 * - Results are posted to the Feed
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PlayIcon,
  Globe02Icon,
  Add01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { showToast } from '@/context/ToastContext';
import { ApiService, serverUrl, subscribeEvents } from '@/services/api';
import { LiveBrowserModal } from '@/components/common';
import { AgentTask } from '@/types';
import { timeAgo } from '@/utils/time';

const SCHEDULE_PRESETS = ['Manual', 'Every 1 hours', 'Every 6 hours', 'Daily at 9:00 AM', 'Weekly on Monday at 9:00 AM'];

type GoalItem = AgentTask & { liveStep?: string };

function describeSchedule(item: GoalItem) {
  const parts = [item.schedule];
  if (item.status === 'paused') parts.push('paused');
  else if (item.nextRunAt) parts.push(`next ${timeAgo(item.nextRunAt)}`);
  if (item.lastRunAt) parts.push(`last ${timeAgo(item.lastRunAt)}${item.lastStatus === 'FAILED' ? ' (failed)' : ''}`);
  return parts.join(' · ');
}

export default function GoalsScreen() {
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSchedule, setNewSchedule] = useState('Daily at 9:00 AM');
  const [newCategory, setNewCategory] = useState<'tracking' | 'goals'>('tracking');
  const [liveModal, setLiveModal] = useState<{ visible: boolean; url: string | null; title?: string }>({
    visible: false,
    url: null,
    title: undefined,
  });

  const loadGoals = useCallback(async () => {
    try {
      setItems(await ApiService.listTasks());
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e.message || 'Could not reach the agent backend');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  // Live task state, progress steps and live browser views
  useEffect(() => {
    return subscribeEvents((event) => {
      if (event.type === 'task.updated' && event.data) {
        setItems((prev) => {
          const exists = prev.some((t) => t.id === event.data.id);
          const merged = { ...event.data, liveStep: event.data.isRunning ? prev.find((t) => t.id === event.data.id)?.liveStep : undefined };
          return exists ? prev.map((t) => (t.id === event.data.id ? merged : t)) : [merged, ...prev];
        });
      } else if (event.type === 'task.deleted') {
        setItems((prev) => prev.filter((t) => t.id !== event.data.id));
      } else if (event.type === 'agent.step' && event.requestId?.startsWith('task:')) {
        const taskId = event.requestId.slice(5);
        setItems((prev) => prev.map((t) => (t.id === taskId ? { ...t, liveStep: event.data.text } : t)));
      } else if (event.type === 'task.run.finished') {
        showToast(event.data.status === 'FAILED' ? 'Task run failed — see Feed' : 'Task finished — posted to Feed');
      }
    });
  }, []);

  const toggleCheck = async (item: GoalItem) => {
    setItems((prev) => prev.map((g) => (g.id === item.id ? { ...g, checked: !g.checked } : g)));
    try {
      await ApiService.updateTask(item.id, { checked: !item.checked, status: !item.checked ? 'done' : 'active' });
    } catch (e: any) {
      showToast(e.message);
      loadGoals();
    }
  };

  const handleDeleteGoal = async (id: string, title: string) => {
    try {
      await ApiService.deleteTask(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      showToast(`Deleted "${title}"`);
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const handleCreateGoal = async () => {
    const title = newTitle.trim();
    if (!title) {
      showToast('Please enter a goal title');
      return;
    }
    const url = newUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      showToast('URL must start with http:// or https://');
      return;
    }

    try {
      const created = await ApiService.createTask({
        title,
        subtitle: newSubtitle.trim(),
        url: url || undefined,
        schedule: newSchedule,
        category: newCategory,
      });
      setItems((prev) => (prev.some((t) => t.id === created.id) ? prev : [created, ...prev]));
      setNewTitle('');
      setNewSubtitle('');
      setNewUrl('');
      setIsCreateModalOpen(false);
      showToast(`Created "${title}" (${created.schedule})`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create task');
    }
  };

  const handleRunGoal = async (goal: GoalItem) => {
    setItems((prev) => prev.map((g) => (g.id === goal.id ? { ...g, isRunning: true, liveStep: 'Starting...' } : g)));
    try {
      await ApiService.runTask(goal.id);
    } catch (e: any) {
      showToast(e.message || 'Failed to start task');
      setItems((prev) => prev.map((g) => (g.id === goal.id ? { ...g, isRunning: false, liveStep: undefined } : g)));
    }
  };

  const handleOpenLink = (url?: string, title?: string) => {
    if (!url) return;
    setLiveModal({
      visible: true,
      url,
      title: title || 'Browserbase Cloud Live View',
    });
  };

  const trackingItems = items.filter((i) => i.category === 'tracking');
  const goalItems = items.filter((i) => i.category === 'goals');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.pageTitle}>Task / Goal</Text>
            <Text style={styles.subtitle}>Scheduled autonomous routines & watchers</Text>
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.8}>
            <HugeiconsIcon icon={Add01Icon} size={18} color={Colors.white} strokeWidth={2.4} />
            <Text style={styles.createBtnText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              Agent backend offline ({loadError}). Start it with "npm run server".
            </Text>
          </View>
        ) : null}

        {/* TRACKING SECTION */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionDotGreen} />
          <Text style={styles.sectionTitle}>Tracking ({trackingItems.length})</Text>
        </View>

        {trackingItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              {/* Checkbox */}
              <TouchableOpacity
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleCheck(item)}
                activeOpacity={0.7}>
                {item.checked && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={18}
                    color={Colors.primary}
                    strokeWidth={2.4}
                  />
                )}
              </TouchableOpacity>

              {/* Text */}
              <View style={styles.cardTextCol}>
                <Text
                  style={[styles.cardTitle, item.checked && styles.cardTitleChecked]}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.isRunning && item.liveStep ? item.liveStep : describeSchedule(item)}
                </Text>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteGoal(item.id, item.title)}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={Delete02Icon} size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.cardBottomRow}>
              {item.lastScreenshotUrl || item.url ? (
                <TouchableOpacity
                  style={styles.replayBadge}
                  onPress={() => handleOpenLink(serverUrl(item.lastScreenshotUrl) || item.url, item.title)}
                  activeOpacity={0.7}>
                  <HugeiconsIcon icon={Globe02Icon} size={13} color={Colors.primary} strokeWidth={2.2} />
                  <Text style={styles.replayText}>{item.lastScreenshotUrl ? 'Last result' : 'Open page'}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.runBtn}
                onPress={() => handleRunGoal(item)}
                disabled={item.isRunning}
                activeOpacity={0.8}>
                {item.isRunning ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <HugeiconsIcon icon={PlayIcon} size={13} color={Colors.primary} strokeWidth={2.4} />
                    <Text style={styles.runBtnText}>Run now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* GOALS SECTION */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionDotBlue} />
          <Text style={styles.sectionTitle}>Goals ({goalItems.length})</Text>
        </View>

        {goalItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTopRow}>
              {/* Checkbox */}
              <TouchableOpacity
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleCheck(item)}
                activeOpacity={0.7}>
                {item.checked && (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={18}
                    color={Colors.primary}
                    strokeWidth={2.4}
                  />
                )}
              </TouchableOpacity>

              {/* Text */}
              <View style={styles.cardTextCol}>
                <Text
                  style={[styles.cardTitle, item.checked && styles.cardTitleChecked]}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.isRunning && item.liveStep ? item.liveStep : describeSchedule(item)}
                </Text>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteGoal(item.id, item.title)}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={Delete02Icon} size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Bottom Actions */}
            <View style={styles.cardBottomRow}>
              <TouchableOpacity
                style={styles.runBtn}
                onPress={() => handleRunGoal(item)}
                disabled={item.isRunning}
                activeOpacity={0.8}>
                {item.isRunning ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <HugeiconsIcon icon={PlayIcon} size={13} color={Colors.primary} strokeWidth={2.4} />
                    <Text style={styles.runBtnText}>Run routine</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Goal or Tracker</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Toggle */}
            <View style={styles.categoryToggleRow}>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  newCategory === 'tracking' && styles.categoryTabActive,
                ]}
                onPress={() => setNewCategory('tracking')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.sectionDotGreen} />
                  <Text
                    style={[
                      styles.categoryTabText,
                      newCategory === 'tracking' && styles.categoryTabTextActive,
                    ]}>
                    Tracking
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  newCategory === 'goals' && styles.categoryTabActive,
                ]}
                onPress={() => setNewCategory('goals')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.sectionDotBlue} />
                  <Text
                    style={[
                      styles.categoryTabText,
                      newCategory === 'goals' && styles.categoryTabTextActive,
                    ]}>
                    Goal
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Title (e.g. Flight price watcher)"
              placeholderTextColor={Colors.iconMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Description or routine instructions..."
              placeholderTextColor={Colors.iconMuted}
              value={newSubtitle}
              onChangeText={setNewSubtitle}
              multiline
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Page to check (optional, https://...)"
              placeholderTextColor={Colors.iconMuted}
              value={newUrl}
              onChangeText={setNewUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.scheduleLabel}>Schedule</Text>
            <View style={styles.scheduleRow}>
              {SCHEDULE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.schedulePill, newSchedule === preset && styles.schedulePillActive]}
                  onPress={() => setNewSchedule(preset)}>
                  <Text style={[styles.schedulePillText, newSchedule === preset && styles.schedulePillTextActive]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCreateGoal}
              activeOpacity={0.85}>
              <Text style={styles.modalSubmitBtnText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Live Browser Modal */}
      <LiveBrowserModal
        visible={liveModal.visible}
        url={liveModal.url}
        title={liveModal.title}
        onClose={() => setLiveModal({ visible: false, url: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.iconMuted,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: Colors.error,
  },
  scheduleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iconDark,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  schedulePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.tabActiveBg,
  },
  schedulePillActive: {
    backgroundColor: Colors.primary,
  },
  schedulePillText: {
    fontSize: 12,
    color: Colors.iconDark,
  },
  schedulePillTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  createBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  sectionDotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 3,
  },
  cardTitleChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 'auto',
  },
  replayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.primary,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  runBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.iconDark,
  },
  categoryToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 6,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.iconDark,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.iconDark,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
