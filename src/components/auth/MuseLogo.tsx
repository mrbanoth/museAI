/**
 * MuseLogo Component
 *
 * Visual hero brand mark presenting the glowing blue AI spark emblem
 * accompanied by the stylized bold 'Muse AI' wordmark and optional subtitle.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { AiSparklesIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface MuseLogoProps {
  /** Size variant controlling emblem dimension and font scaling */
  size?: 'small' | 'medium' | 'large';
  /** Whether to render the secondary subtitle below brand text */
  showSubtitle?: boolean;
}

/**
 * Muse AI Brand Emblem & Wordmark Component
 */
export const MuseLogo: React.FC<MuseLogoProps> = ({
  size = 'large',
  showSubtitle = false,
}) => {
  // Proportional scaling for icon, glow ring container, and typography
  const iconSize = size === 'small' ? 24 : size === 'medium' ? 32 : 40;
  const containerSize = size === 'small' ? 52 : size === 'medium' ? 68 : 84;
  const titleFontSize = size === 'small' ? 22 : size === 'medium' ? 28 : 34;

  return (
    <View style={styles.wrapper}>
      {/* Outer ambient glow halo ring */}
      <View
        style={[
          styles.glowRing,
          {
            width: containerSize + 20,
            height: containerSize + 20,
            borderRadius: (containerSize + 20) / 2,
          },
        ]}
      />

      {/* Main elevated circular emblem with spark icon */}
      <View
        style={[
          styles.iconContainer,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
          },
        ]}>
        <HugeiconsIcon
          icon={AiSparklesIcon}
          size={iconSize}
          color={Colors.white}
          strokeWidth={1.75}
        />
      </View>

      {/* Typography: Dark 'Muse' + Electric Blue 'AI' */}
      <View style={styles.brandRow}>
        <Text style={[styles.brandName, { fontSize: titleFontSize }]}>Muse</Text>
        <Text style={[styles.aiText, { fontSize: titleFontSize }]}> AI</Text>
      </View>

      {/* Optional descriptive subtitle */}
      {showSubtitle && (
        <Text style={styles.subtitle}>Autonomous Task Agent</Text>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.primaryGlow,
  },
  iconContainer: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  },
  aiText: {
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
});

export default MuseLogo;
