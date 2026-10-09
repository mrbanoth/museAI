/**
 * Goals Tab Screen ('/(tabs)/tasks')
 *
 * Full real-time Goals & Tracking manager:
 * - Real-time Goal creation modal
 * - Real-time Goal deletion
 * - Real-time Checkmark toggle & live execution via Cloud Agent
 * - Persisted in StorageService
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
import { ApiService } from '@/services/api';
import { StorageService, RealGoalItem } from '@/services/storage';
import { LiveBrowserModal } from '@/components/common';

export default function GoalsScreen() {
  const [items, setItems] = useState<RealGoalItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'tracking' | 'goals'>('tracking');
  const [liveModal, setLiveModal] = useState<{ visible: boolean; url: string | null; title?: string }>({
    visible: false,
    url: null,
    title: undefined,
  });

  const loadGoals = useCallback(async () => {
    const data = await StorageService.getGoals();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const toggleCheck = async (id: string) => {
    const updated = await StorageService.toggleGoalCheck(id);
    setItems(updated);
  };

  const handleDeleteGoal = async (id: string, title: string) => {
    const updated = await StorageService.deleteGoal(id);
    setItems(updated);
    showToast(`Deleted "${title}"`);
  };

  const handleCreateGoal = async () => {
    const title = newTitle.trim();
    if (!title) {
      showToast('Please enter a goal title');
      return;
    }

    const created = await StorageService.createGoal(
      title,
      newSubtitle.trim() || 'Custom autonomous goal tracked by Muse AI',
      newCategory
    );

    setItems((prev) => [created, ...prev]);
    setNewTitle('');
    setNewSubtitle('');
    setIsCreateModalOpen(false);
    showToast(`Created goal: "${title}"`);
  };

  const handleRunGoal = async (goal: RealGoalItem) => {
    setItems((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, isRunning: true } : g))
    );
    showToast(`Muse is executing "${goal.title}"...`);

    try {
      const res = await ApiService.runTask(goal.id, goal.title);
      if (res.success) {
        showToast('Execution finished! Replay generated.');
        const updated = items.map((g) =>
          g.id === goal.id
            ? { ...g, isRunning: false, replayUrl: res.replayUrl || 'https://www.browserbase.com' }
            : g
        );
        setItems(updated);
        await StorageService.saveGoals(updated);
      } else {
        showToast('Execution completed.');
      }
    } catch {
      showToast('Failed to run task');
    } finally {
      setItems((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, isRunning: false } : g))
      );
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
          <View>
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

        {/* 🟢 TRACKING SECTION */}
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
                onPress={() => toggleCheck(item.id)}
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
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
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
              {item.replayUrl ? (
                <TouchableOpacity
                  style={styles.replayBadge}
                  onPress={() => handleOpenLink(item.replayUrl, item.title)}
                  activeOpacity={0.7}>
                  <HugeiconsIcon icon={Globe02Icon} size={13} color={Colors.primary} strokeWidth={2.2} />
                  <Text style={styles.replayText}>Cloud Replay</Text>
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

        {/* 🔵 GOALS SECTION */}
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
                onPress={() => toggleCheck(item.id)}
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
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {item.subtitle}
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
                <Text
                  style={[
                    styles.categoryTabText,
                    newCategory === 'tracking' && styles.categoryTabTextActive,
                  ]}>
                  🟢 Tracking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  newCategory === 'goals' && styles.categoryTabActive,
                ]}
                onPress={() => setNewCategory('goals')}>
                <Text
                  style={[
                    styles.categoryTabText,
                    newCategory === 'goals' && styles.categoryTabTextActive,
                  ]}>
                  🔵 Goal
                </Text>
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
