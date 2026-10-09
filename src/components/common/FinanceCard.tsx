import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { BrandLogoIcon } from './BrandLogoIcon';

export interface FinanceCardProps {
  bannerText?: string;
  income?: string;
  spending?: string;
  saved?: string;
  savedRate?: string;
  onOpenTracker?: () => void;
  onOptions?: () => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  bannerText = 'Read from Felixz Card ••0617, Pellara Card ••1009 and Quillbrook Savings. Ninety days of transactions, categorized and checked against your last three months.',
  income = '$4,850',
  spending = '$4,320',
  saved = '$530',
  savedRate = '11% rate',
  onOpenTracker,
  onOptions,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Gradient Banner & Metrics Box */}
      <View style={styles.topCard}>
        <Text style={styles.bannerText}>{bannerText}</Text>

        <View style={styles.metricsRow}>
          {/* Income */}
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>INCOME</Text>
            <Text style={styles.metricValue}>{income}</Text>
            <Text style={styles.metricSub}>per month</Text>
          </View>

          {/* Spending */}
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>SPENDING</Text>
            <Text style={styles.metricValue}>{spending}</Text>
            <Text style={styles.metricSub}>per month</Text>
          </View>

          {/* Saved */}
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>SAVED</Text>
            <Text style={[styles.metricValue, styles.savedValue]}>{saved}</Text>
            <Text style={[styles.metricSub, styles.savedSub]}>{savedRate}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Tool Capsule */}
      <TouchableOpacity
        style={styles.bottomBar}
        onPress={onOpenTracker}
        activeOpacity={0.85}>
        <View style={styles.toolIcon}>
          <BrandLogoIcon name="plaid" size={24} />
        </View>
        <View style={styles.toolTextCol}>
          <Text style={styles.toolTitle}>Finance tracker</Text>
          <Text style={styles.toolSubtitle}>Spending, savings, subscriptions, and more.</Text>
        </View>
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={onOptions}
          activeOpacity={0.7}>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={18} color={Colors.iconMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topCard: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bannerText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '400',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  savedValue: {
    color: '#10B981',
  },
  metricSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
  },
  savedSub: {
    color: '#10B981',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 10,
  },
  toolIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextCol: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  toolSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  moreBtn: {
    padding: 6,
  },
});
