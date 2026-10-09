/**
 * Settings Tab Screen ('/(tabs)/settings')
 *
 * Clean settings & account management:
 * - User Profile Account Card
 * - Free Plan progress card
 * - Settings items (Connectors, Pricing, Notifications, Appearance, Help & Feedback, Sign Out)
 * - Sign Out with auth clearance and redirection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Grid02Icon,
  Tag01Icon,
  Notification01Icon,
  PaintBrush01Icon,
  ArrowRight01Icon,
  HelpCircleIcon,
  Logout01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { SETTINGS_PLAN_DATA } from '@/constants/dummyData';
import { showToast } from '@/context/ToastContext';
import { StorageService } from '@/services/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [userAuth, setUserAuth] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState('');

  const connectedServices = [
    { name: 'Gmail', icon: '✉️', color: '#EA4335' },
    { name: 'Google Calendar', icon: '📅', color: '#4285F4' },
    { name: 'HealthEx', icon: '⚡', color: '#F59E0B' },
    { name: 'OpenTable', icon: '🔴', color: '#E11D48' },
    { name: 'Facebook', icon: '🔵', color: '#1877F2' },
    { name: 'Instagram', icon: '📸', color: '#E1306C' },
    { name: 'Peloton', icon: '🚴', color: '#1E2022' },
  ];

  const availableServices = [
    { name: 'Finances (Plaid)', icon: '🔲' },
    { name: 'Essential Health', icon: '🏥' },
  ];

  useEffect(() => {
    (async () => {
      const auth = await StorageService.getUserAuth();
      if (auth) {
        setUserAuth(auth);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await StorageService.clearUserAuth();
    showToast('Signed Out');
    router.replace('/' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        {/* 0. User Account Card */}
        <View style={styles.accountCard}>
          <View style={styles.avatarContainer}>
            {userAuth?.avatar ? (
              <Image source={{ uri: userAuth.avatar }} style={styles.avatarImage} />
            ) : (
              <HugeiconsIcon icon={UserIcon} size={24} color={Colors.primary} strokeWidth={2} />
            )}
          </View>
          <View style={styles.accountTextCol}>
            <Text style={styles.accountName}>{userAuth?.name || 'Rahul Sana'}</Text>
            <Text style={styles.accountEmail}>{userAuth?.email || 'rahul.s@muse.ai'}</Text>
          </View>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        </View>

        {/* 1. Free Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planTitle}>{SETTINGS_PLAN_DATA.planName}</Text>
            <Text style={styles.planUsageText}>{SETTINGS_PLAN_DATA.percentUsed}% used</Text>
          </View>
          <Text style={styles.planResetText}>{SETTINGS_PLAN_DATA.resetText}</Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${SETTINGS_PLAN_DATA.percentUsed}%` },
              ]}
            />
          </View>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => showToast('Upgrade to Pro')}
            activeOpacity={0.7}>
            <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Primary Group: Connectors & Pricing */}
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setIsConnectorsOpen(true)}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Grid02Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Connectors (7 Connected)</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={() => showToast('Pricing & Plans')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Tag01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Pricing & Token Limits</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* 3. Secondary Group: Preferences & Support */}
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => showToast('Notifications')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Notification01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Notifications</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={() => showToast('Appearance')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={PaintBrush01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Appearance</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={() => showToast('Help & Feedback')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={HelpCircleIcon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Help & Feedback</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={handleSignOut}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Logout01Icon} size={22} color={Colors.error} strokeWidth={2} />
            </View>
            <Text style={[styles.listLabel, { color: Colors.error }]}>Sign Out</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Connectors Full Sheet Modal (Matching Screenshot 4) */}
      <Modal
        visible={isConnectorsOpen}
        animationType="slide"
        onRequestClose={() => setIsConnectorsOpen(false)}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsConnectorsOpen(false)}
              activeOpacity={0.7}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconDark} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Connectors</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                value={connectorSearch}
                onChangeText={setConnectorSearch}
              />
            </View>

            {/* Connected Section */}
            <Text style={styles.connectorSectionTitle}>Connected</Text>
            <View style={styles.connectorCard}>
              {connectedServices
                .filter((s) => s.name.toLowerCase().includes(connectorSearch.toLowerCase()))
                .map((srv, idx) => (
                  <View key={srv.name}>
                    <View style={styles.connectorRow}>
                      <View style={styles.connectorLeft}>
                        <Text style={{ fontSize: 18 }}>{srv.icon}</Text>
                        <Text style={styles.connectorName}>{srv.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => showToast(`${srv.name} settings`)}
                        activeOpacity={0.7}>
                        <Text style={{ fontSize: 16, color: '#9CA3AF' }}>•••</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < connectedServices.length - 1 && <View style={styles.connectorDivider} />}
                  </View>
                ))}
            </View>

            {/* Available Section */}
            <Text style={[styles.connectorSectionTitle, { marginTop: 24 }]}>Available</Text>
            <View style={styles.connectorCard}>
              {availableServices
                .filter((s) => s.name.toLowerCase().includes(connectorSearch.toLowerCase()))
                .map((srv, idx) => (
                  <View key={srv.name}>
                    <View style={styles.connectorRow}>
                      <View style={styles.connectorLeft}>
                        <Text style={{ fontSize: 18 }}>{srv.icon}</Text>
                        <Text style={styles.connectorName}>{srv.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => showToast(`Connecting to ${srv.name}...`)}
                        activeOpacity={0.8}>
                        <Text style={styles.connectBtnText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                    {idx < availableServices.length - 1 && <View style={styles.connectorDivider} />}
                  </View>
                ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerRow: {
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
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FAFAFB',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    gap: 14,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  accountTextCol: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  accountEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FAFAFB',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECEEF0',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
    letterSpacing: -0.2,
  },
  planUsageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
  },
  planResetText: {
    fontSize: 12.5,
    color: '#707070',
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E6E8EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  upgradeBtn: {
    alignSelf: 'flex-start',
  },
  upgradeBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0066FF',
  },
  groupCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FAFAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  listIconCol: {
    width: 32,
    alignItems: 'flex-start',
  },
  listLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.iconDark,
    letterSpacing: -0.2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginLeft: 48,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.iconDark,
  },
  connectorSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  connectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  connectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  moreBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectorDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 46,
  },
  connectBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});
