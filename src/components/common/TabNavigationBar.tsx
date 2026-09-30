/**
 * TabNavigationBar Component
 *
 * Floating bottom stadium capsule dock containing 5 core application destinations:
 * 1. Chat: Primary dialogue with Cooper AI
 * 2. Feed: Real-time autonomous activity & notification feed
 * 3. Ideas: AI builder & prompt action templates
 * 4. Task/Goal: Scheduled agents and recurring check-ins
 * 5. Settings: Plan limits, connectors, billing, and appearance
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Comment01Icon,
  File01Icon,
  Idea01Icon,
  CheckmarkSquare02Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

/**
 * Union of valid navigation tab identifiers
 */
export type TabKey = 'chat' | 'feed' | 'ideas' | 'tasks' | 'settings';

export interface TabItem {
  /** Unique key for the tab destination */
  key: TabKey;
  /** Accessible label description */
  label: string;
  /** Hugeicons vector component reference */
  icon: any;
}

/**
 * Ordered list of navigation tabs displayed in the bottom dock
 */
export const TABS: TabItem[] = [
  {
    key: 'chat',
    label: 'Chat',
    icon: Comment01Icon,
  },
  {
    key: 'feed',
    label: 'Feed',
    icon: File01Icon,
  },
  {
    key: 'ideas',
    label: 'Ideas',
    icon: Idea01Icon,
  },
  {
    key: 'tasks',
    label: 'Task / Goal',
    icon: CheckmarkSquare02Icon,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings02Icon,
  },
];

export interface TabNavigationBarProps {
  /** Currently active tab identifier */
  activeTab: TabKey;
  /** Callback fired when user selects a tab */
  onSelectTab: (tab: TabKey) => void;
}

/**
 * Floating Dock Navigation Bar Component
 */
export const TabNavigationBar: React.FC<TabNavigationBarProps> = ({
  activeTab,
  onSelectTab,
}) => {

  return (
    <View style={styles.dockWrapper}>
      <View style={styles.floatingDock}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}>
              <View style={[styles.iconPill, isActive && styles.activeIconPill]}>
                <HugeiconsIcon
                  icon={IconComponent}
                  size={23}
                  color={Colors.iconDark}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 4,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F2',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeTabButton: {},
  iconPill: {
    width: 60,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconPill: {
    backgroundColor: Colors.tabActiveBg, // Soft #E6E8EA capsule
  },
});

export default TabNavigationBar;
