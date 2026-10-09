/**
 * BrowserCard Component
 *
 * Visually displays autonomous human-like browser automation inside a self-contained card:
 * - Animated human mouse cursor moving, clicking, and interacting with page elements
 * - Live seat map selection simulation with glowing click ripples
 * - Live webpage viewport with address bar, search typing, and real-time step ticker
 * - Seamless open in-app browser trigger
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Globe02Icon,
  SparklesIcon,
  CheckmarkCircle01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface BrowserCardProps {
  title?: string;
  url?: string;
  statusText?: string;
  previewType?: 'seats' | 'web';
  onOpenBrowser?: () => void;
}

const HUMAN_ACTIONS = [
  '🤖 Navigating to web page...',
  '🖱️ Moving cursor to search bar...',
  '⌨️ Typing query & filtering options...',
  '🎯 Selecting best available items...',
  '✅ Extracting structured details...',
];

export const BrowserCard: React.FC<BrowserCardProps> = ({
  title = 'Browser (Beta)',
  url,
  statusText = 'Selecting seats...',
  previewType = 'seats',
  onOpenBrowser,
}) => {
  const targetUrl = url || 'https://news.ycombinator.com';
  const domain = targetUrl.replace(/^https?:\/\//, '').split('/')[0];

  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['C-4', 'C-5']);

  // Human cursor animated position & click ripple
  const cursorX = useRef(new Animated.Value(20)).current;
  const cursorY = useRef(new Animated.Value(20)).current;
  const cursorScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Animate human cursor across the canvas
  useEffect(() => {
    let isMounted = true;

    const runHumanCursorLoop = () => {
      if (!isMounted) return;

      Animated.sequence([
        // 1. Move to seat/item 1
        Animated.parallel([
          Animated.timing(cursorX, {
            toValue: previewType === 'seats' ? 120 : 160,
            duration: 1400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cursorY, {
            toValue: previewType === 'seats' ? 68 : 80,
            duration: 1400,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
        ]),

        // 2. Click action (scale down + ripple)
        Animated.parallel([
          Animated.sequence([
            Animated.timing(cursorScale, { toValue: 0.8, duration: 150, useNativeDriver: true }),
            Animated.timing(cursorScale, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rippleOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 2.2, duration: 400, useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
          ]),
        ]),

        // 3. Move to seat/item 2
        Animated.parallel([
          Animated.timing(cursorX, {
            toValue: previewType === 'seats' ? 142 : 220,
            duration: 1200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.timing(cursorY, {
            toValue: previewType === 'seats' ? 68 : 110,
            duration: 1200,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            useNativeDriver: true,
          }),
        ]),

        // 4. Click action 2
        Animated.parallel([
          Animated.sequence([
            Animated.timing(cursorScale, { toValue: 0.8, duration: 150, useNativeDriver: true }),
            Animated.timing(cursorScale, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rippleOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.parallel([
              Animated.timing(rippleScale, { toValue: 2.2, duration: 400, useNativeDriver: true }),
              Animated.timing(rippleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]),
          ]),
        ]),

        // 5. Rest briefly
        Animated.delay(1600),
      ]).start(() => {
        if (isMounted) {
          rippleScale.setValue(0);
          runHumanCursorLoop();
        }
      });
    };

    runHumanCursorLoop();

    // Rotate step text
    const ticker = setInterval(() => {
      setCurrentActionIndex((prev) => (prev + 1) % HUMAN_ACTIONS.length);
    }, 2800);

    return () => {
      isMounted = false;
      clearInterval(ticker);
    };
  }, [cursorX, cursorY, cursorScale, rippleScale, rippleOpacity, previewType]);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 9;

  return (
    <View style={styles.container}>
      {/* 1. Top Header Row */}
      <View style={styles.header}>
        <View style={styles.globeIconWrap}>
          <HugeiconsIcon icon={Globe02Icon} size={16} color={Colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subStatus} numberOfLines={1}>
            {statusText}
          </Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      </View>

      {/* 2. Main Visual Canvas Box */}
      {previewType === 'seats' ? (
        <View style={styles.canvasArea}>
          <View style={styles.screenBar}>
            <Text style={styles.screenText}>SCREEN</Text>
          </View>

          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row} style={styles.row}>
                <Text style={styles.rowLabel}>{row}</Text>
                <View style={styles.seatsRow}>
                  {Array.from({ length: cols }).map((_, cIdx) => {
                    const seatId = `${row}-${cIdx}`;
                    const isSelected = selectedSeats.includes(seatId);
                    const isTaken = (row === 'A' && cIdx < 3) || (row === 'D' && cIdx === 2);
                    return (
                      <View
                        key={`seat-${seatId}`}
                        style={[
                          styles.seat,
                          isSelected && styles.seatSelected,
                          isTaken && styles.seatTaken,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#CBD5E1' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} />
              <Text style={styles.legendText}>Taken</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.legendText}>Your seats</Text>
            </View>
          </View>

          {/* Animated Human Cursor & Click Ripple */}
          <Animated.View
            style={[
              styles.humanCursor,
              {
                transform: [
                  { translateX: cursorX },
                  { translateY: cursorY },
                  { scale: cursorScale },
                ],
              },
            ]}>
            <View style={styles.cursorPointer}>
              <View style={styles.cursorArrow} />
            </View>
            <Animated.View
              style={[
                styles.clickRipple,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />
          </Animated.View>
        </View>
      ) : (
        <View style={styles.webCanvasBox}>
          {/* Address Bar */}
          <View style={styles.addressBar}>
            <View style={styles.liveDot} />
            <Text style={styles.addressText} numberOfLines={1}>
              {targetUrl}
            </Text>
          </View>

          {/* Live Web Viewport with Simulated Human Interaction */}
          <View style={styles.viewport}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <iframe
                src={targetUrl}
                style={styles.iframe}
                title="Browser View"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            ) : (
              <View style={styles.simulatedPage}>
                {/* Simulated Web Elements */}
                <View style={styles.simWebHeader}>
                  <View style={styles.simLogo} />
                  <View style={styles.simSearchBar}>
                    <HugeiconsIcon icon={Search01Icon} size={11} color="#94A3B8" />
                    <Text style={styles.simSearchText} numberOfLines={1}>
                      {domain}
                    </Text>
                  </View>
                </View>

                {/* Simulated Page Content Cards */}
                <View style={styles.simContentGrid}>
                  <View style={styles.simCard}>
                    <View style={styles.simCardLineLg} />
                    <View style={styles.simCardLineSm} />
                  </View>
                  <View style={[styles.simCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <View style={[styles.simCardLineLg, { backgroundColor: '#3B82F6' }]} />
                    <View style={styles.simCardLineSm} />
                  </View>
                </View>

                {/* Animated Human Cursor */}
                <Animated.View
                  style={[
                    styles.humanCursor,
                    {
                      transform: [
                        { translateX: cursorX },
                        { translateY: cursorY },
                        { scale: cursorScale },
                      ],
                    },
                  ]}>
                  <View style={styles.cursorPointer}>
                    <View style={styles.cursorArrow} />
                  </View>
                  <Animated.View
                    style={[
                      styles.clickRipple,
                      {
                        transform: [{ scale: rippleScale }],
                        opacity: rippleOpacity,
                      },
                    ]}
                  />
                </Animated.View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 3. Live Action Step Ticker */}
      <View style={styles.stepTickerRow}>
        <Text style={styles.stepTickerText}>{HUMAN_ACTIONS[currentActionIndex]}</Text>
      </View>

      {/* 4. Open Browser Action Button */}
      <TouchableOpacity
        style={styles.openBtn}
        onPress={onOpenBrowser}
        activeOpacity={0.85}>
        <Text style={styles.openBtnText}>Open browser</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  globeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  subStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  canvasArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 175,
  },
  webCanvasBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  viewport: {
    height: 180,
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  simulatedPage: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 12,
    position: 'relative',
  },
  simWebHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  simLogo: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  simSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simSearchText: {
    fontSize: 11,
    color: '#64748B',
  },
  simContentGrid: {
    gap: 8,
  },
  simCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  simCardLineLg: {
    width: '70%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  simCardLineSm: {
    width: '45%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  humanCursor: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 99,
  },
  cursorPointer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E2022',
    transform: [{ rotate: '-45deg' }],
  },
  clickRipple: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  stepTickerRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepTickerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  screenBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
    alignItems: 'center',
    marginBottom: 16,
  },
  screenText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -14,
  },
  grid: {
    width: '100%',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rowLabel: {
    fontSize: 10,
    color: '#94A3B8',
    width: 12,
    fontWeight: '600',
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  seat: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  seatSelected: {
    backgroundColor: '#2563EB',
  },
  seatTaken: {
    backgroundColor: '#E2E8F0',
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  openBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  openBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
});
