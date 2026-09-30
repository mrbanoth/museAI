/**
 * IdeasTab Component
 *
 * Inspiration feed showcasing pre-built autonomous agent task templates:
 * - AI Builder Cup Entry Package
 * - Live Money-Making Apps Leaderboard
 * - YouTube Shorts Series Builder
 * - Product Launch Assets & Copy
 *
 * Tapping any idea immediately populates Cooper's chat prompt and transitions to Chat tab.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { IDEA_ITEMS, IdeaItem } from '@/constants/dummyData';

export interface IdeasTabProps {
  /** Callback fired when an idea card is tapped, forwarding the template data */
  onSelectIdea?: (idea: IdeaItem) => void;
}

/**
 * Prompt & Automation Ideas Feed View
 */
export const IdeasTab: React.FC<IdeasTabProps> = ({ onSelectIdea }) => {

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Large Page Title */}
        <View style={styles.titleWrapper}>
          <Text style={styles.pageTitle}>Ideas</Text>
        </View>

        {/* List of Ideas */}
        {IDEA_ITEMS.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.ideaRow}
              onPress={() => onSelectIdea?.(item)}
              activeOpacity={0.75}>
              {/* Left 3D Icon Badge */}
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>{item.icon}</Text>
              </View>

              {/* Right Content Block */}
              <View style={styles.textContainer}>
                <Text style={styles.ideaTitle}>{item.title}</Text>
                <Text style={styles.ideaDescription} numberOfLines={4}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Subtle Row Divider */}
            {index < IDEA_ITEMS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
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
  ideaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  iconEmoji: {
    fontSize: 34,
  },
  textContainer: {
    flex: 1,
  },
  ideaTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: Colors.iconDark,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  ideaDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#707070',
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: -0.1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginHorizontal: 20,
  },
});

export default IdeasTab;
