/**
 * TypingIndicator Component
 *
 * Animated 3-dot thinking bubble rendered while Cooper AI generates
 * an autonomous workflow or conversational reply. Uses native-driver
 * Animated loops with staggered offsets for smooth, hardware-accelerated bouncing.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

export interface TypingIndicatorProps {
  /** Optional container style override */
  style?: object;
}

/**
 * Animated 3-Dot Pulse Bubble
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ style }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(350),
        ])
      );
    };

    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 180);
    const a3 = animateDot(dot3, 360);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getTransform = (anim: Animated.Value) => [
    {
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5],
      }),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Animated.View
          style={[styles.dot, { transform: getTransform(dot1), backgroundColor: Colors.iconDark }]}
        />
        <Animated.View
          style={[styles.dot, { transform: getTransform(dot2), backgroundColor: Colors.iconDark }]}
        />
        <Animated.View
          style={[styles.dot, { transform: getTransform(dot3), backgroundColor: Colors.iconDark }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingHorizontal: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chatBubbleAi, // Soft gray #EEF0F2
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default TypingIndicator;
