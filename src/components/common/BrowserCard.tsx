import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Globe02Icon,
  SparklesIcon,
  ArrowExpand01Icon,
  Minimize01Icon,
  RefreshIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
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
  statusText = 'Live session completed',
  previewType = 'web',
  onOpenBrowser,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const targetUrl = url || 'https://news.ycombinator.com';

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 9;

  return (
    <View style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.globeIconWrap}>
            <HugeiconsIcon icon={Globe02Icon} size={16} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subStatus} numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Controls: Reload & Inline Expand */}
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setRefreshKey((k) => k + 1)}
            activeOpacity={0.7}
            accessibilityLabel="Refresh mini browser">
            <HugeiconsIcon icon={RefreshIcon} size={15} color={Colors.iconMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
            accessibilityLabel={isExpanded ? 'Collapse' : 'Expand'}>
            <HugeiconsIcon
              icon={isExpanded ? Minimize01Icon : ArrowExpand01Icon}
              size={15}
              color={Colors.iconDark}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mini Browser Canvas Box */}
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
        <View style={[styles.miniBrowserBox, isExpanded && styles.miniBrowserBoxExpanded]}>
          {/* Mini URL Bar */}
          <View style={styles.addressBar}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.addressText} numberOfLines={1}>
              {targetUrl}
            </Text>
          </View>

          {/* Embedded Web View Port inside the Mini Box */}
          <View style={[styles.viewportArea, isExpanded && styles.viewportAreaExpanded]}>
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <iframe
                key={`iframe-${refreshKey}`}
                src={targetUrl}
                style={styles.webIframe}
                title="Mini Browser View"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            ) : (
              <View style={styles.nativeMiniPreview}>
                <View style={styles.previewCenterBadge}>
                  <HugeiconsIcon icon={SparklesIcon} size={24} color={Colors.primary} />
                  <Text style={styles.previewSiteName} numberOfLines={1}>
                    {targetUrl.replace(/^https?:\/\//, '').split('/')[0]}
                  </Text>
                  <Text style={styles.previewSubtext}>
                    Live cloud browser session active
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Bottom Action Button */}
      <TouchableOpacity
        style={styles.openBtn}
        onPress={onOpenBrowser}
        activeOpacity={0.85}>
        <Text style={styles.openBtnText}>Open browser</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={Colors.iconDark} strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  globeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  subStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  canvasArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  miniBrowserBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniBrowserBoxExpanded: {
    borderColor: Colors.primary,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  liveIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  addressText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  viewportArea: {
    height: 180,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  viewportAreaExpanded: {
    height: 320,
  },
  webIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  nativeMiniPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  previewCenterBadge: {
    alignItems: 'center',
    gap: 6,
  },
  previewSiteName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
    marginTop: 4,
  },
  previewSubtext: {
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
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  openBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
});
