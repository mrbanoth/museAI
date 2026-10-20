/**
 * MascotAvatar Component
 *
 * Universal animated 3D plush character mascot avatar:
 * - Plays looping animated video with circular crop
 * - Web: HTML5 optimized looping video tag
 * - Native: expo-video with zero controls and infinite loop
 * - Instant fallback to high-res static poster
 */

import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

export interface MascotAvatarProps {
  /** Avatar diameter in pixels (defaults to 54) */
  size?: number;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Disable animated video and force static poster */
  staticOnly?: boolean;
}

const mascotVideo = require('../../../assets/videos/muse_mascot_animated.mp4');
// Round, edge-cleaned still (the original artwork has black corners outside its circle)
const mascotImage = require('../../../assets/images/muse_mascot_round.png');

// Native Video Subcomponent using expo-video
const NativeVideoAvatar: React.FC<{ size: number }> = ({ size }) => {
  // Hidden until the first frame plays, so the still mascot shows instead of a black circle
  const [playing, setPlaying] = useState(false);
  try {
    const { useVideoPlayer, VideoView } = require('expo-video');
    const player = useVideoPlayer(mascotVideo, (p: any) => {
      p.loop = true;
      p.muted = true;
      p.play();
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const sub = player.addListener('playingChange', (e: { isPlaying: boolean }) => {
        if (e.isPlaying) setPlaying(true);
      });
      return () => sub.remove();
    }, [player]);

    return (
      <VideoView
        player={player}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: playing ? 1 : 0,
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
  // Web: keep the video invisible until it actually plays (it renders black before the first frame)
  const [videoPlaying, setVideoPlaying] = useState(false);

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
      {/* Static mascot underneath so there is never an empty circle while the video loads */}
      <Image
        source={mascotImage}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        resizeMode="cover"
      />
      {Platform.OS === 'web' ? (
        // @ts-ignore - Web video element
        <video
          src={mascotVideo}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setHasError(true)}
          onPlaying={() => setVideoPlaying(true)}
          style={{
            opacity: videoPlaying ? 1 : 0,
            transition: 'opacity 300ms',
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
    backgroundColor: Colors.museCream,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MascotAvatar;
