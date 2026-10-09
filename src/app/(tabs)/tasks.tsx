/**
 * Tasks Tab Screen ('/(tabs)/tasks')
 *
 * Minimalist Autonomous Agent Scheduler & Goal Manager:
 * - Clean UI displaying scheduled routines and goals
 * - Live Cloud Browser Execution via Browserbase & Playwright
 * - Direct session replay and status badges
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  Target01Icon,
  Clock01Icon,
  PlayIcon,
  Globe02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { TASK_GOALS } from '@/constants/dummyData';
import { TaskGoalItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';

interface TaskWithSession extends TaskGoalItem {
  lastSessionId?: string;
  lastReplayUrl?: string;
  isRunning?: boolean;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskWithSession[]>(TASK_GOALS);

  // Load saved tasks
  React.useEffect(() => {
    (async () => {
      const { StorageService } = await import('@/services/storage');
      const saved = await StorageService.getTasks();
      if (saved && saved.length > 0) {
        setTasks(saved);
      }
    })();
  }, []);

  const handleToggle = async (id: string, title: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'active' ? 'paused' : 'active') as any } : t
    );
    setTasks(updated);
    const { StorageService } = await import('@/services/storage');
    await StorageService.saveTasks(updated);
    showToast(`${title} status updated`);
  };

  const handleRunTask = async (task: TaskWithSession) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isRunning: true } : t))
    );
    showToast(`Launching cloud browser for "${task.title}"...`);

    try {
      const res = await ApiService.runTask(task.id, task.title);

      if (res.success) {
        showToast(`Completed! Replay created.`);
        const updated = tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                isRunning: false,
                runsCount: t.runsCount + 1,
                lastSessionId: res.sessionId,
                lastReplayUrl: res.replayUrl,
              }
            : t
        );
        setTasks(updated);
        const { StorageService } = await import('@/services/storage');
        await StorageService.saveTasks(updated);
      } else {
        showToast(`Failed: ${res.message || 'Unknown error'}`);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, isRunning: false } : t))
        );
      }
    } catch (e: any) {
      showToast('Execution error');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isRunning: false } : t))
      );
    }
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
        {/* Page Title & "+ New" Button */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Scheduled Agents & Goals</Text>
          <TouchableOpacity
            style={styles.newGoalBtn}
            onPress={() => showToast('Create New Goal')}
            activeOpacity={0.8}>
            <HugeiconsIcon icon={Add01Icon} size={15} color={Colors.white} strokeWidth={2.4} />
            <Text style={styles.newGoalText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Task Rows */}
        {tasks.map((task, index) => {
          const isActive = task.status === 'active';

          return (
            <View key={task.id}>
              <TouchableOpacity
                style={styles.taskRow}
                onPress={() => showToast(task.title)}
                activeOpacity={0.75}>
                {/* Left Target Icon Badge */}
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isActive ? Colors.primarySubtle : Colors.surfaceMuted },
                  ]}>
                  <HugeiconsIcon
                    icon={Target01Icon}
                    size={20}
                    color={isActive ? Colors.primary : Colors.textMuted}
                    strokeWidth={2}
                  />
                </View>

                {/* Center Content */}
                <View style={styles.textContainer}>
                  <Text style={[styles.taskTitle, !isActive && styles.pausedText]}>
                    {task.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.scheduleItem}>
                      <HugeiconsIcon icon={Clock01Icon} size={12} color={Colors.textMuted} />
                      <Text style={styles.taskSchedule}>{task.schedule}</Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.executionsText}>{task.runsCount} runs</Text>
                  </View>

                  {/* Cloud Browser Replay Link if run */}
                  {task.lastReplayUrl && (
                    <TouchableOpacity
                      style={styles.replayBadge}
                      onPress={() => handleOpenReplay(task.lastReplayUrl)}
                      activeOpacity={0.7}>
                      <HugeiconsIcon icon={Globe02Icon} size={12} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.replayBadgeText}>Browserbase Replay</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Right Controls: Switch & Run Button */}
                <View style={styles.actionsCol}>
                  <Switch
                    value={isActive}
                    onValueChange={() => handleToggle(task.id, task.title)}
                    trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                    thumbColor={isActive ? Colors.primary : Colors.surfaceMuted}
                  />

                  <TouchableOpacity
                    style={[styles.runManualBtn, task.isRunning && styles.runningBtn]}
                    onPress={() => handleRunTask(task)}
                    disabled={task.isRunning}
                    activeOpacity={0.75}>
                    {task.isRunning ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={PlayIcon}
                          size={12}
                          color={Colors.primary}
                          strokeWidth={2.4}
                        />
                        <Text style={styles.runManualText}>Run</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {index < tasks.length - 1 && <View style={styles.divider} />}
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
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.5,
    flex: 1,
    paddingRight: 12,
  },
  newGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  newGoalText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.iconDark,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  pausedText: {
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskSchedule: {
    fontSize: 13,
    color: '#707070',
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  executionsText: {
    fontSize: 13,
    color: '#707070',
    fontWeight: '500',
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  replayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  runManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    minWidth: 54,
    justifyContent: 'center',
  },
  runningBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  runManualText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginHorizontal: 20,
  },
});
