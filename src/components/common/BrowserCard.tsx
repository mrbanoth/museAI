import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Globe02Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface BrowserCardProps {
  title?: string;
  url?: string;
  statusText?: string;
  previewType?: 'seats' | 'web';
  onOpenBrowser?: () => void;
}

export const BrowserCard: React.FC<BrowserCardProps> = ({
  title = 'Browser (Beta)',
  url,
  statusText = 'Selecting seats...',
  previewType = 'seats',
  onOpenBrowser,
}) => {
  const targetUrl = url || 'https://news.ycombinator.com';
  const domain = targetUrl.replace(/^https?:\/\//, '').split('/')[0];

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 9;

  return (
    <View style={styles.container}>
      {/* 1. Header Row */}
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
      </View>

      {/* 2. Main Visual Canvas Box (Always Open Directly in this Box) */}
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
                    const isSelected = row === 'C' && (cIdx === 4 || cIdx === 5);
                    const isTaken = (row === 'A' && cIdx < 3) || (row === 'D' && cIdx === 2);
                    return (
                      <View
                        key={`seat-${row}-${cIdx}`}
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

          {/* Web Viewport in this box */}
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
              <View style={styles.nativePreview}>
                <HugeiconsIcon icon={SparklesIcon} size={28} color={Colors.primary} />
                <Text style={styles.nativeDomain}>{domain}</Text>
                <Text style={styles.nativeStatus}>Live cloud browser session active</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 3. Open Browser Action Button */}
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
  canvasArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  webCanvasBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    height: 200,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  nativePreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  nativeDomain: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iconDark,
    marginTop: 4,
  },
  nativeStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
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
