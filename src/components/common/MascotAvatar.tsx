/**
 * MascotAvatar Component
 *
 * Renders the Cooper 3D mascot avatar photo or an SVG vector emblem
 * with customizable sizing (header, small, medium, large) and accent color tinting.
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AiSparklesIcon,
  BotIcon,
  ZapIcon,
  Target01Icon,
  AiBrain01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface MascotAvatarProps {
  /** Size preset scaling the avatar circle (defaults to 'header') */
  size?: 'small' | 'medium' | 'large' | 'header';
  /** Icon identifier: 'cooper' for 3D portrait, or vector identifier */
  iconType?: 'cooper' | 'sparkle' | 'bot' | 'zap' | 'target' | 'brain' | string;
  /** Background fill color for vector avatar fallback */
  customColor?: string;
}

/**
 * 3D Mascot Portrait and Vector Emblem Avatar
 */
export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  size = 'header',
  iconType = 'cooper',
  customColor = Colors.primary,
}) => {
  // Resolve dimension values based on specified preset
  let width = 58;
  let height = 58;
  let borderRadius = 29;

  if (size === 'small') {
    width = 30;
    height = 30;
    borderRadius = 15;
  } else if (size === 'header') {
    width = 54;
    height = 54;
    borderRadius = 27;
  } else if (size === 'medium') {
    width = 68;
    height = 68;
    borderRadius = 34;
  } else if (size === 'large') {
    width = 84;
    height = 84;
    borderRadius = 42;
  }

  // Primary 3D Cooper character photo portrait
  if (iconType === 'cooper' || !iconType) {
    return (
      <View style={[styles.wrapper, { width, height }]}>
        <Image
          source={require('../../../assets/images/cooper_mascot.jpg')}
          style={[styles.avatarImage, { width, height, borderRadius }]}
          resizeMode="cover"
        />
      </View>
    );
  }


  // Vector icon fallback if user changed icon type in settings
  const getIcon = () => {
    switch (iconType) {
      case 'bot':
        return BotIcon;
      case 'zap':
        return ZapIcon;
      case 'target':
        return Target01Icon;
      case 'brain':
        return AiBrain01Icon;
      default:
        return AiSparklesIcon;
    }
  };

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <View
        style={[
          styles.container,
          {
            width,
            height,
            borderRadius,
            backgroundColor: customColor,
          },
        ]}>
        <HugeiconsIcon
          icon={getIcon()}
          size={width * 0.5}
          color={Colors.white}
          strokeWidth={2}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MascotAvatar;
