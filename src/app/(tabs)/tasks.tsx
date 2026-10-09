/**
 * Goals Tab Screen ('/(tabs)/tasks')
 *
 * Pixel-perfect implementation of Muse AI Goals & Tracking:
 * - 🟢 Tracking section with active reservation & watcher items
 * - 🔵 Goals section with milestone routines
 * - Expandable 'Show more' sections
 * - 'Create a goal' category templates
 * - Live Cloud Browser Execution via Browserbase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  MoreVerticalIcon,
  PlayIcon,
  Globe02Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';
import { LiveBrowserModal } from '@/components/common';

interface GoalItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'tracking' | 'goals';
  checked: boolean;
  replayUrl?: string;
  isRunning?: boolean;
}

const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'track-1',
    title: 'Dinner reservations',
    subtitle: 'Sushi restaurants downtown',
    category: 'tracking',
    checked: false,
    replayUrl: 'https://www.browserbase.com/sessions/45ea61b8-1a58-405e-8391-6955f71a9e1a',
  },
  {
    id: 'goal-1',
    title: 'Marathon prep',
    subtitle: 'Build endurance, hit your pace goals, and cross that finish line strong.',
    category: 'goals',
    checked: false,
  },
  {
    id: 'goal-2',
    title: 'Save for new car',
    subtitle: 'On track to hit your goals if you save $210 each month towards your new car fund!',
    category: 'goals',
    checked: false,
  },
];

export default function GoalsScreen() {
  const [items, setItems] = useState<GoalItem[]>(INITIAL_GOALS);
  const [showMoreTracking, setShowMoreTracking] = useState(false);
  const [showMoreGoals, setShowMoreGoals] = useState(false);
  const [liveModal, setLiveModal] = useState<{ visible: boolean; url: string | null; title?: string }>({
    visible: false,
    url: null,
    title: undefined,
  });

  const toggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRunGoal = async (goal: GoalItem) => {
    setItems((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, isRunning: true } : g))
    );
    showToast(`Muse is launching cloud browser for "${goal.title}"...`);

    try {
      const res = await ApiService.runTask(goal.id, goal.title);
      if (res.success) {
        showToast('Completed! Replay generated.');
        setItems((prev) =>
          prev.map((g) =>
            g.id === goal.id
              ? { ...g, isRunning: false, replayUrl: res.replayUrl }
              : g
          )
        );
      } else {
        showToast('Execution finished.');
        setItems((prev) =>
          prev.map((g) => (g.id === goal.id ? { ...g, isRunning: false } : g))
        );
      }
    } catch {
      showToast('Error executing goal');
      setItems((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, isRunning: false } : g))
      );
    }
  };

  const trackingItems = items.filter((i) => i.category === 'tracking');
  const goalItems = items.filter((i) => i.category === 'goals');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Goals</Text>
        </View>

        {/* SECTION 1: 🟢 Tracking */}
        <View style={styles.sectionHeader}>
          <View style={styles.greenDot} />
          <Text style={styles.sectionTitleGreen}>Tracking</Text>
        </View>

        <View style={styles.itemsList}>
          {trackingItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.7}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <View style={styles.itemDetails}>
                <Text style={[styles.itemTitle, item.checked && styles.itemCheckedText]}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>

                {item.replayUrl && (
                  <TouchableOpacity
                    style={styles.replayPill}
                    onPress={() =>
                      setLiveModal({
                        visible: true,
                        url: item.replayUrl!,
                        title: item.title,
                      })
                    }
                    activeOpacity={0.7}>
                    <HugeiconsIcon icon={Globe02Icon} size={11} color={Colors.primary} />
                    <Text style={styles.replayText}>Cloud Replay</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleRunGoal(item)}
                activeOpacity={0.7}>
                {item.isRunning ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} color={Colors.iconMuted} />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Show 2 more */}
          <TouchableOpacity
            style={styles.showMoreRow}
            onPress={() => {
              setShowMoreTracking(!showMoreTracking);
              showToast(showMoreTracking ? 'Collapsed' : 'Showing all tracked items');
            }}
            activeOpacity={0.7}>
            <Text style={styles.dragIcon}>⠿</Text>
            <Text style={styles.showMoreText}>
              {showMoreTracking ? 'Show less' : 'Show 2 more'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* SECTION 2: 🔵 Goals */}
        <View style={styles.sectionHeader}>
          <View style={styles.blueDot} />
          <Text style={styles.sectionTitleBlue}>Goals</Text>
        </View>

        <View style={styles.itemsList}>
          {goalItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <TouchableOpacity
                style={[styles.checkbox, item.checked && styles.checkboxChecked]}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.7}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <View style={styles.itemDetails}>
                <Text style={[styles.itemTitle, item.checked && styles.itemCheckedText]}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleRunGoal(item)}
                activeOpacity={0.7}>
                {item.isRunning ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <HugeiconsIcon icon={MoreVerticalIcon} size={18} color={Colors.iconMuted} />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Show 4 more */}
          <TouchableOpacity
            style={styles.showMoreRow}
            onPress={() => {
              setShowMoreGoals(!showMoreGoals);
              showToast(showMoreGoals ? 'Collapsed' : 'Showing all goals');
            }}
            activeOpacity={0.7}>
            <Text style={styles.dragIcon}>⠿</Text>
            <Text style={styles.showMoreText}>
              {showMoreGoals ? 'Show less' : 'Show 4 more'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* SECTION 3: Create a goal */}
        <View style={styles.createGoalSection}>
          <Text style={styles.createGoalTitle}>Create a goal</Text>

          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => showToast('Create Health Goal')}
            activeOpacity={0.7}>
            <View style={styles.categoryLeft}>
              <Text style={{ fontSize: 18 }}>🤍</Text>
              <Text style={styles.categoryName}>Health</Text>
            </View>
            <HugeiconsIcon icon={Add01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryRow}
            onPress={() => showToast('Create Relationships Goal')}
            activeOpacity={0.7}>
            <View style={styles.categoryLeft}>
              <Text style={{ fontSize: 18 }}>👥</Text>
              <Text style={styles.categoryName}>Relationships</Text>
            </View>
            <HugeiconsIcon icon={Add01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Embedded Cloud Browser Live Modal */}
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
  titleRow: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.iconDark,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  greenDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  sectionTitleGreen: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  blueDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563EB',
  },
  sectionTitleBlue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemsList: {
    gap: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: -2,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.2,
  },
  itemCheckedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 3,
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  replayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionBtn: {
    padding: 4,
  },
  showMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  dragIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  showMoreText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  createGoalSection: {
    marginTop: 6,
  },
  createGoalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.iconDark,
    marginBottom: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.iconDark,
  },
});
