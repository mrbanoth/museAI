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
import { ConnectorItem } from '@/types';
import { showToast } from '@/context/ToastContext';
import { StorageService } from '@/services/storage';
import { SupabaseService } from '@/services/supabase';
import { ApiService, API_BASE_URL, subscribeEvents } from '@/services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { MascotAvatar, BrandLogoIcon } from '@/components/common';

export default function SettingsScreen() {
  const router = useRouter();
  const [userAuth, setUserAuth] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [me, setMe] = useState<Awaited<ReturnType<typeof ApiService.getMe>> | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  const openLink = (url: string) => {
    if (Platform.OS === 'web') window.open(url, '_blank');
    else WebBrowser.openBrowserAsync(url).catch(() => showToast('Could not open link'));
  };

  const loadData = useCallback(async () => {
    const auth = await StorageService.getUserAuth();
    if (auth) setUserAuth(auth);
    ApiService.getMe()
      .then((data) => {
        setMe(data);
        setMeError(null);
      })
      .catch((e) => setMeError(e.message));
    const connList = await StorageService.getConnectors();
    // Gmail & Calendar are real OAuth connectors managed by the agent server
    let live: Awaited<ReturnType<typeof ApiService.listConnectors>> = [];
    try {
      live = await ApiService.listConnectors();
    } catch {}
    setConnectors(
      connList.map((c) => {
        const status = live.find((l) => l.id === c.id);
        return status
          ? { ...c, live: status.available, connected: status.connected, accountEmail: status.email }
          : { ...c, connected: false };
      })
    );
  }, []);

  useEffect(() => {
    return subscribeEvents((event) => {
      if (event.type === 'connector.updated') loadData();
    });
  }, [loadData]);

  // Web returns here from Google with ?connector=gmail&status=connected
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'connected' && params.get('connector')) {
      showToast('Account connected');
      setIsConnectorsOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
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
    const current = connectors.find((c) => c.id === id);
    if (!current?.live) {
      showToast(
        id === 'gmail' || id === 'gcal'
          ? `${name} needs Google OAuth set up on the server (see .env.example)`
          : `${name} integration is coming soon`
      );
      return;
    }

    try {
      if (current.connected) {
        await ApiService.disconnectConnector(id);
        showToast(`Disconnected ${name}`);
        loadData();
        return;
      }

      if (Platform.OS === 'web') {
        const returnTo = `${window.location.origin}${window.location.pathname}`;
        window.location.href = await ApiService.getConnectUrl(id, returnTo);
        return;
      }

      const returnTo = Linking.createURL('settings');
      const url = await ApiService.getConnectUrl(id, returnTo);
      const result = await WebBrowser.openAuthSessionAsync(url, returnTo);
      if (result.type === 'success' && result.url.includes('status=connected')) {
        showToast(`${name} connected`);
      }
      loadData();
    } catch (e: any) {
      showToast(e.message || `Could not connect ${name}`);
    }
  };

  const handleSignOut = async () => {
    await SupabaseService.signOut();
    // Chats live on the device: don't leave them for the next person who signs in
    await StorageService.clearAllSessions();
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
            <Text style={styles.accountName}>{userAuth?.name || me?.email?.split('@')[0] || 'Muse user'}</Text>
            <Text style={styles.accountEmail}>{userAuth?.email || me?.email || ''}</Text>
            {userAuth?.avatar ? (
              <TouchableOpacity onPress={handleRemoveAvatar} style={styles.resetAvatarBtn}>
                <Text style={styles.resetAvatarText}>Use Mascot Avatar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

        </View>

        {/* 1. Today's usage + live service status (from the server) */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planTitle}>Today's agent runs</Text>
            <Text style={styles.planUsageText}>
              {me ? `${me.usage.used} / ${me.usage.limit}` : meError ? 'Offline' : '…'}
            </Text>
          </View>
          <Text style={styles.planResetText}>
            {meError ? `Server unreachable: ${meError}` : 'Chats, ideas and manual task runs. Resets daily.'}
          </Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${me ? Math.min(100, Math.round((me.usage.used / Math.max(1, me.usage.limit)) * 100)) : 0}%` },
              ]}
            />
          </View>
          <View style={styles.statusRow}>
            {[
              { label: 'AI brain', ok: me?.services.ai },
              { label: 'Live browser', ok: me?.services.browser },
              { label: 'Google', ok: me?.services.google },
            ].map((svc) => (
              <View key={svc.label} style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: svc.ok ? Colors.success : svc.ok === false ? Colors.error : Colors.textMuted }]} />
                <Text style={styles.statusText}>{svc.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={loadData} activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Refresh status</Text>
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

        </View>

        {/* 4. Support & Sign Out */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openLink('https://github.com/mrbanoth/museAI/blob/main/SETUP.md')}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={HelpCircleIcon} size={20} color={Colors.textSecondary} strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Help & Setup guide</Text>
              <Text style={styles.menuSubtitle}>How to connect accounts and fix problems</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openLink(API_BASE_URL.replace(/\/api$/, '/privacy'))}
            activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <HugeiconsIcon icon={Tag01Icon} size={20} color={Colors.success} strokeWidth={2} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Privacy policy</Text>
              <Text style={styles.menuSubtitle}>What Muse does with your data</Text>
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
                        {item.accountEmail || item.description}
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
                      <Text style={styles.connectBtnText}>{item.live ? 'Connect' : 'Soon'}</Text>
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
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
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
