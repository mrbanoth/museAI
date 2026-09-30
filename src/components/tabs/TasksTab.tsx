/**
 * TasksTab Component
 *
 * Autonomous Agent Scheduler & Goal Manager:
 * - Header: Page title and "+ New" goal creation trigger
 * - Goals List: Scheduled routines (Morning Check-in, Evening Reflection, Sprint Review)
 * - Metadata: Schedule frequency (e.g. Every day @ 8:00 AM) and lifetime run counts
 * - Controls: Active/Paused toggle switch and manual instantaneous "Run" trigger with feedback
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
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  Target01Icon,
  Clock01Icon,
  PlayIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { TASK_GOALS, TaskGoalItem } from '@/constants/dummyData';

export interface TasksTabProps {
  /** Callback fired when "+ New" goal button is pressed */
  onNewGoal?: () => void;
  /** Callback fired when manual run is triggered for a task */
  onRunTask?: (task: TaskGoalItem) => void;
}

/**
 * Scheduled Agents & Autonomous Goals Tab View
 */
export const TasksTab: React.FC<TasksTabProps> = ({ onNewGoal, onRunTask }) => {
  const [tasks, setTasks] = useState<TaskGoalItem[]>(TASK_GOALS);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [recentlyRunTaskId, setRecentlyRunTaskId] = useState<string | null>(null);


  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: t.status === 'active' ? 'paused' : 'active',
          };
        }
        return t;
      })
    );
  };

  const handleRunManual = (task: TaskGoalItem) => {
    if (runningTaskId) return;
    setRunningTaskId(task.id);
    setRecentlyRunTaskId(null);

    // Simulate manual agent execution with responsive feedback
    setTimeout(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              runsCount: t.runsCount + 1,
            };
          }
          return t;
        })
      );
      setRunningTaskId(null);
      setRecentlyRunTaskId(task.id);

      setTimeout(() => {
        setRecentlyRunTaskId(null);
      }, 3500);
    }, 1000);

    onRunTask?.(task);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Large Page Title (no subtitle, matching existing design) */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Scheduled Agents & Goals</Text>
          <TouchableOpacity
            style={styles.newGoalBtn}
            onPress={onNewGoal}
            activeOpacity={0.8}>
            <HugeiconsIcon icon={Add01Icon} size={15} color={Colors.white} strokeWidth={2.4} />
            <Text style={styles.newGoalText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* List of Tasks / Goals (matching existing list row style) */}
        {tasks.map((task, index) => {
          const isActive = task.status === 'active';
          const isRunning = runningTaskId === task.id;
          const isRecentlyCompleted = recentlyRunTaskId === task.id;

          return (
            <View key={task.id}>
              <View style={styles.taskRow}>
                {/* Left Icon Badge */}
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

                {/* Center Content Block */}
                <View style={styles.textContainer}>
                  <Text style={[styles.taskTitle, !isActive && styles.pausedText]}>
                    {task.title}
                  </Text>

                  {/* Schedule info (shown once) & Executions */}
                  <View style={styles.metaRow}>
                    <View style={styles.scheduleItem}>
                      <HugeiconsIcon icon={Clock01Icon} size={12} color={Colors.textMuted} />
                      <Text style={styles.taskSchedule}>{task.schedule}</Text>
                    </View>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.executionsText}>{task.runsCount} runs</Text>
                  </View>

                  {/* Execution feedback badge */}
                  {isRecentlyCompleted && (
                    <View style={styles.successBadge}>
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={12}
                        color={Colors.success}
                        strokeWidth={2.2}
                      />
                      <Text style={styles.successBadgeText}>Executed just now</Text>
                    </View>
                  )}
                </View>

                {/* Right Action Controls: Run Button & Status Toggle */}
                <View style={styles.actionsCol}>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleTaskStatus(task.id)}
                    trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                    thumbColor={isActive ? Colors.primary : Colors.surfaceMuted}
                  />

                  <TouchableOpacity
                    style={[
                      styles.runManualBtn,
                      isRunning && styles.runManualBtnActive,
                    ]}
                    onPress={() => handleRunManual(task)}
                    disabled={isRunning}
                    activeOpacity={0.75}>
                    {isRunning ? (
                      <>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.runManualText}>Running</Text>
                      </>
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
              </View>

              {/* Subtle Row Divider */}
              {index < tasks.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

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
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  successBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
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
  },
  runManualBtnActive: {
    opacity: 0.8,
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

export default TasksTab;
