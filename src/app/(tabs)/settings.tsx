/**
 * Settings Tab Screen ('/(tabs)/settings')
 *
 * Full real-time settings and account management:
 * - Profile avatar with animated MascotAvatar placeholder & custom photo upload
 * - Connectors management with official vector brand logos (no emojis) & real-time toggle
 * - Account quota, plan upgrades, and sign-out
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Grid02Icon,
  Tag01Icon,
  Notification01Icon,
  PaintBrush01Icon,
  ArrowRight01Icon,
  HelpCircleIcon,
  Logout01Icon,
  Search01Icon,
  Cancel01Icon,
  Camera01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { SETTINGS_PLAN_DATA } from '@/constants/dummyData';
import { ConnectorItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { StorageService } from '@/services/storage';
import { MascotAvatar, BrandLogoIcon } from '@/components/common';

export default function SettingsScreen() {
  const router = useRouter();
  const [userAuth, setUserAuth] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = useCallback(async () => {
    const auth = await StorageService.getUserAuth();
    if (auth) setUserAuth(auth);
    const connList = await StorageService.getConnectors();
    setConnectors(connList);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUploadingImage(true);
        await StorageService.updateUserAvatar(uri);
        setUserAuth((prev) => ({
          ...(prev || { signedIn: true }),
          avatar: uri,
        }));
        showToast('Profile photo updated');
      }
    } catch {
      showToast('Could not access image library');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveAvatar = async () => {
    await StorageService.updateUserAvatar(null);
    setUserAuth((prev) => ({
      ...(prev || { signedIn: true }),
      avatar: undefined,
    }));
    showToast('Reset to default Muse avatar');
  };

  const handleToggleConnector = async (id: string, name: string) => {
    const updated = await StorageService.toggleConnector(id);
    setConnectors(updated);
    const item = updated.find((c) => c.id === id);
    showToast(`${item?.connected ? 'Connected' : 'Disconnected'} ${name}`);
  };

  const handleSignOut = async () => {
    await StorageService.clearUserAuth();
    showToast('Signed Out');
    router.replace('/' as any);
  };

  const connectedList = connectors.filter((c) => c.connected);
  const availableList = connectors.filter((c) => !c.connected);

  const filteredConnected = connectedList.filter((c) =>
    c.name.toLowerCase().includes(connectorSearch.toLowerCase())
  );
  const filteredAvailable = availableList.filter((c) =>
    c.name.toLowerCase().includes(connectorSearch.toLowerCase())
  );

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

        {/* 0. User Account Card with Photo Upload */}
        <View style={styles.accountCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            accessibilityLabel="Change profile avatar">
            {userAuth?.avatar ? (
              <Image source={{ uri: userAuth.avatar }} style={styles.avatarImage} />
            ) : (
              <MascotAvatar size={62} />
            )}

            <View style={styles.cameraIconBadge}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <HugeiconsIcon icon={Camera01Icon} size={12} color={Colors.white} strokeWidth={2.4} />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.accountTextCol}>
            <Text style={styles.accountName}>{userAuth?.name || 'Rahul Sana'}</Text>
            <Text style={styles.accountEmail}>{userAuth?.email || 'rahul.s@muse.ai'}</Text>
            {userAuth?.avatar ? (
              <TouchableOpacity onPress={handleRemoveAvatar} style={styles.resetAvatarBtn}>
                <Text style={styles.resetAvatarText}>Use Mascot Avatar</Text>
              </TouchableOpacity>
            ) : null}
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
            onPress={() => showToast('Upgraded to Unlimited Plan')}
            activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Menu Section: Workspaces & Integrations */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsConnectorsOpen(true)}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={Grid02Icon} size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Connectors & Workspaces</Text>
              <Text style={styles.menuSubtitle}>
                {connectedList.length} tools actively connected
              </Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showToast('Pricing plans')}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={Tag01Icon} size={20} color="#10B981" strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Billing & Invoices</Text>
              <Text style={styles.menuSubtitle}>Manage payment methods and history</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* 3. Menu Section: App Preferences */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showToast('Notification settings')}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={Notification01Icon} size={20} color="#F59E0B" strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Autonomous goals & daily summaries</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showToast('Appearance settings')}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={PaintBrush01Icon} size={20} color="#8B5CF6" strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Appearance</Text>
              <Text style={styles.menuSubtitle}>Theme, accent aura and display</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* 4. Support & Sign Out */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showToast('Help Center opened')}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={HelpCircleIcon} size={20} color="#64748B" strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Help & Feedback</Text>
              <Text style={styles.menuSubtitle}>Docs, guides, and priority support</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.signOutItem]}
            onPress={handleSignOut}
            activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <HugeiconsIcon icon={Logout01Icon} size={20} color="#EF4444" strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Sign Out</Text>
              <Text style={styles.menuSubtitle}>Log out of your Muse account</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Real-time Connectors Full Modal */}
      <Modal
        visible={isConnectorsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsConnectorsOpen(false)}>
        <View style={styles.connectorsModalContainer}>
          {/* Header */}
          <View style={styles.connectorsHeader}>
            <View style={styles.connectorsHeaderLeft}>
              <Text style={styles.connectorsModalTitle}>Connectors</Text>
              <Text style={styles.connectorsModalSubtitle}>
                Sync services for real-time automation
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setIsConnectorsOpen(false)}
              activeOpacity={0.7}>
              <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <HugeiconsIcon icon={Search01Icon} size={18} color={Colors.iconMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search apps and services..."
              placeholderTextColor={Colors.iconMuted}
              value={connectorSearch}
              onChangeText={setConnectorSearch}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.connectorsScrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Connected Section */}
            {filteredConnected.length > 0 && (
              <View style={styles.connectorSection}>
                <Text style={styles.connectorSectionHeader}>Connected ({filteredConnected.length})</Text>
                {filteredConnected.map((item) => (
                  <View key={item.id} style={styles.connectorCard}>
                    <View style={styles.connectorLogoWrap}>
                      <BrandLogoIcon name={item.name} size={28} />
                    </View>
                    <View style={styles.connectorInfo}>
                      <Text style={styles.connectorName}>{item.name}</Text>
                      <Text style={styles.connectorDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.disconnectBtn}
                      onPress={() => handleToggleConnector(item.id, item.name)}
                      activeOpacity={0.7}>
                      <Text style={styles.disconnectBtnText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Available Section */}
            {filteredAvailable.length > 0 && (
              <View style={styles.connectorSection}>
                <Text style={styles.connectorSectionHeader}>Available to Connect</Text>
                {filteredAvailable.map((item) => (
                  <View key={item.id} style={styles.connectorCard}>
                    <View style={styles.connectorLogoWrap}>
                      <BrandLogoIcon name={item.name} size={28} />
                    </View>
                    <View style={styles.connectorInfo}>
                      <Text style={styles.connectorName}>{item.name}</Text>
                      <Text style={styles.connectorDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.connectBtn}
                      onPress={() => handleToggleConnector(item.id, item.name)}
                      activeOpacity={0.8}>
                      <Text style={styles.connectBtnText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.iconDark,
    letterSpacing: -0.5,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  accountTextCol: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resetAvatarBtn: {
    marginTop: 4,
  },
  resetAvatarText: {
    fontSize: 11.5,
    color: Colors.primary,
    fontWeight: '600',
  },
  proBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  planUsageText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  planResetText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upgradeBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  menuGroup: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  signOutItem: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  connectorsModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
  },
  connectorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  connectorsHeaderLeft: {
    flex: 1,
  },
  connectorsModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.iconDark,
  },
  connectorsModalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.iconDark,
  },
  connectorsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  connectorSection: {
    marginBottom: 20,
  },
  connectorSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  connectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  connectorLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  connectorInfo: {
    flex: 1,
  },
  connectorName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  connectorDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  disconnectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  connectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
