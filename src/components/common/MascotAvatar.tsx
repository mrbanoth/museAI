/**
 * MascotAvatar Component
 *
 * Universal animated 3D plush character mascot avatar:
 * - Plays looping animated video with circular crop
 * - Web: HTML5 optimized looping video tag
 * - Native: expo-video with zero controls and infinite loop
 * - Instant fallback to high-res static poster
 */

import React, { useState } from 'react';
import { View, Image, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';

export interface MascotAvatarProps {
  /** Avatar diameter in pixels (defaults to 54) */
  size?: number;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Disable animated video and force static poster */
  staticOnly?: boolean;
}

const mascotVideo = require('../../../assets/videos/muse_mascot_animated.mp4');
const mascotImage = require('../../../assets/images/muse_mascot.png');

// Native Video Subcomponent using expo-video
const NativeVideoAvatar: React.FC<{ size: number }> = ({ size }) => {
  try {
    const { useVideoPlayer, VideoView } = require('expo-video');
    const player = useVideoPlayer(mascotVideo, (p: any) => {
      p.loop = true;
      p.muted = true;
      p.play();
    });

    return (
      <VideoView
        player={player}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        contentFit="cover"
        nativeControls={false}
      />
    );
  } catch {
    return (
      <Image
        source={mascotImage}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
};

export const MascotAvatar: React.FC<MascotAvatarProps> = ({
  size = 54,
  style,
  staticOnly = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const containerStyle = [
    styles.avatarContainer,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  if (staticOnly || hasError) {
    return (
      <View style={containerStyle}>
        <Image
          source={mascotImage}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {Platform.OS === 'web' ? (
        // @ts-ignore - Web video element
        <video
          src={mascotVideo}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <NativeVideoAvatar size={size} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MascotAvatar;
