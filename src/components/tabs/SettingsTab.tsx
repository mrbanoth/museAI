/**
 * SettingsTab Component
 *
 * Comprehensive account, integrations, and preferences hub:
 * 1. Free Plan Card: Progress bar representing compute quota (% used, weekly reset schedule, upgrade CTA)
 * 2. Primary Group:
 *    - Connectors: Full modal sheet toggling third-party integrations (Google, Notion, GitHub, Slack, etc.)
 *    - Pricing: Full modal sheet offering Monthly & Yearly billing switch and Pro Plan comparison
 * 3. Secondary Group:
 *    - Notifications: Push toggles, morning briefings (8:00 AM), task alerts
 *    - Appearance: System / Light / Dark theme selector
 *    - Help & Feedback: Documentation, Discord community, and email support
 *    - Sign Out: Account sign out with platform-specific confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Grid02Icon,
  Tag01Icon,
  Notification01Icon,
  PaintBrush01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  HelpCircleIcon,
  Logout01Icon,
  FlashIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import {
  SETTINGS_PLAN_DATA,
  SETTINGS_CONNECTORS,
  ConnectorItem,
} from '@/constants/dummyData';
import { useRouter } from 'expo-router';

/**
 * Union of active sub-sheet modal destinations
 */
type ActiveModal =
  | null
  | 'connectors'
  | 'pricing'
  | 'notifications'
  | 'appearance'
  | 'help';

/**
 * Settings & Account Management View
 */
export const SettingsTab: React.FC = () => {
  const router = useRouter();

  // State for active modal sheet
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Dynamic connectors state
  const [connectors, setConnectors] = useState<ConnectorItem[]>(SETTINGS_CONNECTORS);
  
  // Pricing billing cycle toggle (monthly vs yearly)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Preferences state
  const [selectedTheme, setSelectedTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);

  // Toggle a connector's connection status
  const handleToggleConnector = (id: string) => {
    setConnectors((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item
      )
    );
  };

  // Handle Logout
  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        router.replace('/');
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out from Muse AI?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => router.replace('/'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Header */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        {/* 1. Free Plan & Limit Remaining Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planTitle}>{SETTINGS_PLAN_DATA.planName}</Text>
            <Text style={styles.planUsageText}>{SETTINGS_PLAN_DATA.percentUsed}% used</Text>
          </View>

          <Text style={styles.planResetText}>{SETTINGS_PLAN_DATA.resetText}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${SETTINGS_PLAN_DATA.percentUsed}%` },
              ]}
            />
          </View>

          {/* Upgrade Link */}
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => setActiveModal('pricing')}
            activeOpacity={0.7}>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Primary Group: Connectors & Pricing */}
        <View style={styles.groupCard}>
          {/* Connectors */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setActiveModal('connectors')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Grid02Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Connectors</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Pricing */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setActiveModal('pricing')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Tag01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Pricing</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* 3. Secondary Group: Preferences & Support */}
        <View style={styles.groupCard}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setActiveModal('notifications')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={Notification01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Notifications</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Appearance */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setActiveModal('appearance')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={PaintBrush01Icon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Appearance</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Help & Feedback */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setActiveModal('help')}
            activeOpacity={0.65}>
            <View style={styles.listIconCol}>
              <HugeiconsIcon icon={HelpCircleIcon} size={22} color={Colors.iconDark} strokeWidth={2} />
            </View>
            <Text style={styles.listLabel}>Help & Feedback</Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.iconMuted} strokeWidth={1.8} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Sign Out */}
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

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= MODALS & DETAIL SHEETS ================= */}

      {/* 1. Connectors Sheet */}
      <Modal
        visible={activeModal === 'connectors'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Connectors</Text>
                <Text style={styles.sheetSubtitle}>Connected workspace tools & automations</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {connectors.map((item) => (
                <View key={item.id} style={styles.connectorCard}>
                  <View style={[styles.connectorIconBg, { backgroundColor: item.iconBg }]}>
                    <Text style={styles.connectorLetter}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.connectorInfo}>
                    <View style={styles.connectorTitleRow}>
                      <Text style={styles.connectorName}>{item.name}</Text>
                      {item.connected && (
                        <View style={styles.connectedBadge}>
                          <Text style={styles.connectedBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.connectorDesc}>{item.description}</Text>
                    {item.accountEmail && (
                      <Text style={styles.connectorAccount}>{item.accountEmail}</Text>
                    )}
                  </View>
                  <Switch
                    value={item.connected}
                    onValueChange={() => handleToggleConnector(item.id)}
                    trackColor={{ false: '#E2E8F0', true: '#0066FF' }}
                    thumbColor={Colors.white}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Pricing & Plans Sheet */}
      <Modal
        visible={activeModal === 'pricing'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { maxHeight: '90%' }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Pricing & Plans</Text>
                <Text style={styles.sheetSubtitle}>Choose the plan that powers your autonomous workflow</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* Monthly / Yearly Switch */}
              <View style={styles.billingToggleWrapper}>
                <TouchableOpacity
                  style={[
                    styles.billingTabBtn,
                    billingCycle === 'monthly' && styles.billingTabBtnActive,
                  ]}
                  onPress={() => setBillingCycle('monthly')}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.billingTabText,
                      billingCycle === 'monthly' && styles.billingTabTextActive,
                    ]}>
                    Monthly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.billingTabBtn,
                    billingCycle === 'yearly' && styles.billingTabBtnActive,
                  ]}
                  onPress={() => setBillingCycle('yearly')}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.billingTabText,
                      billingCycle === 'yearly' && styles.billingTabTextActive,
                    ]}>
                    Yearly (Save 20%)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pro Plan (Highlighted) */}
              <View style={styles.proPricingCard}>
                <View style={styles.proHeaderRow}>
                  <View>
                    <View style={styles.proBadgeRow}>
                      <Text style={styles.pricingCardTitle}>Pro Plan</Text>
                      <View style={styles.popularBadge}>
                        <HugeiconsIcon icon={FlashIcon} size={12} color={Colors.white} />
                        <Text style={styles.popularBadgeText}>POPULAR</Text>
                      </View>
                    </View>
                    <Text style={styles.pricingCardSub}>For power creators & automated goals</Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>
                    {billingCycle === 'yearly' ? '$12' : '$15'}
                  </Text>
                  <Text style={styles.pricePeriod}>/ month</Text>
                </View>

                <View style={styles.planFeatureList}>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#0066FF" />
                    <Text style={styles.featureText}>Unlimited background recurring tasks</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#0066FF" />
                    <Text style={styles.featureText}>10x higher weekly compute & reasoning</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#0066FF" />
                    <Text style={styles.featureText}>Access to all 50+ tool connectors & webhooks</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#0066FF" />
                    <Text style={styles.featureText}>Priority reasoning & fast response times</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.proUpgradeBtn}
                  onPress={() => {
                    setActiveModal(null);
                    if (Platform.OS === 'web') {
                      window.alert('Subscribed to Pro Plan (UI Demo)');
                    } else {
                      Alert.alert('Subscribed', 'Welcome to Muse AI Pro!');
                    }
                  }}
                  activeOpacity={0.85}>
                  <Text style={styles.proUpgradeBtnText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              </View>

              {/* Free Plan (Current) */}
              <View style={styles.freePricingCard}>
                <View style={styles.pricingCardHeader}>
                  <View>
                    <Text style={styles.pricingCardTitle}>Free Plan</Text>
                    <Text style={styles.pricingCardSub}>Essential autonomous companion</Text>
                  </View>
                  <View style={styles.currentPlanTag}>
                    <Text style={styles.currentPlanTagText}>Current Plan</Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>$0</Text>
                  <Text style={styles.pricePeriod}>/ forever</Text>
                </View>

                <View style={styles.planFeatureList}>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#15803D" />
                    <Text style={styles.featureText}>1,000 weekly compute requests</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#15803D" />
                    <Text style={styles.featureText}>Core connectors (Google, Notion, Slack)</Text>
                  </View>
                  <View style={styles.featureItemRow}>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="#15803D" />
                    <Text style={styles.featureText}>Standard companion chat & memory</Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3. Notifications Sheet */}
      <Modal
        visible={activeModal === 'notifications'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Notifications</Text>
                <Text style={styles.sheetSubtitle}>Manage companion alerts & sound</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <View style={styles.prefToggleRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Push Notifications</Text>
                  <Text style={styles.prefDesc}>Receive task updates on lockscreen</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: '#E2E8F0', true: '#0066FF' }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.prefToggleRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Morning Briefing (8:00 AM)</Text>
                  <Text style={styles.prefDesc}>Daily automated overview of your goals</Text>
                </View>
                <Switch
                  value={morningBriefing}
                  onValueChange={setMorningBriefing}
                  trackColor={{ false: '#E2E8F0', true: '#0066FF' }}
                  thumbColor={Colors.white}
                />
              </View>

              <View style={styles.prefToggleRow}>
                <View style={styles.prefTextCol}>
                  <Text style={styles.prefTitle}>Task Completion Alerts</Text>
                  <Text style={styles.prefDesc}>Get notified when automated agents finish work</Text>
                </View>
                <Switch
                  value={taskAlerts}
                  onValueChange={setTaskAlerts}
                  trackColor={{ false: '#E2E8F0', true: '#0066FF' }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Appearance Sheet */}
      <Modal
        visible={activeModal === 'appearance'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Appearance</Text>
                <Text style={styles.sheetSubtitle}>Choose app theme style</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              {(['system', 'light', 'dark'] as const).map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeOptionRow,
                    selectedTheme === theme && styles.themeOptionSelected,
                  ]}
                  onPress={() => setSelectedTheme(theme)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.themeOptionText,
                      selectedTheme === theme && styles.themeOptionTextActive,
                    ]}>
                    {theme === 'system'
                      ? 'System Default'
                      : theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                  {selectedTheme === theme && (
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} color="#0066FF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Help & Feedback Sheet */}
      <Modal
        visible={activeModal === 'help'}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Help & Feedback</Text>
                <Text style={styles.sheetSubtitle}>Documentation & support</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <TouchableOpacity
                style={styles.helpRow}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.alert('Opening Documentation');
                  } else {
                    Alert.alert('Help', 'Opening documentation guide.');
                  }
                }}>
                <Text style={styles.helpText}>Documentation & Tutorials</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpRow}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.alert('Community Discord opened');
                  } else {
                    Alert.alert('Community', 'Join the Muse AI Discord.');
                  }
                }}>
                <Text style={styles.helpText}>Join Discord Community</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpRow}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.alert('Support contact: support@muse.ai');
                  } else {
                    Alert.alert('Support', 'Contact team at support@muse.ai');
                  }
                }}>
                <Text style={styles.helpText}>Contact Support</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.iconMuted} />
              </TouchableOpacity>

              <View style={styles.appVersionBox}>
                <Text style={styles.appVersionText}>Muse AI • Version 2.4.0 (2026)</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA', // Soft clean background matching reference
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    paddingVertical: 12,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.iconDark,
    letterSpacing: -0.4,
  },

  /* 1. Free Plan Card */
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  planUsageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  planResetText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 14,
  },
  progressBarTrack: {
    width: '100%',
    height: 7,
    backgroundColor: '#E6E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 4,
  },
  upgradeBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },

  /* 2. Group Cards */
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  listIconCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 10,
  },
  listLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.iconDark,
    letterSpacing: -0.1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F2F3F5',
    marginLeft: 60,
    marginRight: 18,
  },

  /* Modals & Sheets */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  sheetScroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },

  /* Connectors Card */
  connectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  connectorIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectorLetter: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  connectorInfo: {
    flex: 1,
    paddingRight: 10,
  },
  connectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  connectorDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  connectorAccount: {
    fontSize: 11,
    color: '#0066FF',
    marginTop: 3,
    fontWeight: '500',
  },

  /* Pricing Billing Toggle */
  billingToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  billingTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  billingTabBtnActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  billingTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  billingTabTextActive: {
    fontWeight: '700',
    color: Colors.iconDark,
  },

  /* Pricing Cards */
  proPricingCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#0066FF',
  },
  proHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  proBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0066FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.4,
  },
  pricingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  pricingCardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.iconDark,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
    marginLeft: 4,
  },
  planFeatureList: {
    gap: 10,
    marginBottom: 18,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  proUpgradeBtn: {
    backgroundColor: '#0066FF',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proUpgradeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  /* Free Plan Card in Modal */
  freePricingCard: {
    backgroundColor: '#FAFBFD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPlanTag: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentPlanTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  /* Preferences */
  prefToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  prefTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  prefDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  /* Appearance */
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FAFBFD',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  themeOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066FF',
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.iconDark,
  },
  themeOptionTextActive: {
    fontWeight: '700',
    color: '#0066FF',
  },

  /* Help & Support */
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  helpText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.iconDark,
  },
  appVersionBox: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  appVersionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

export default SettingsTab;
