/**
 * Chat Tab Screen ('/(tabs)/chat')
 *
 * Fully dynamic conversational companion with real-time multi-session chat engine:
 * - Dynamic session loading & title auto-naming
 * - Zero static dummy clutter; clean empty state with 1-tap starter chips
 * - Real-time Browserbase Cloud Live View & Replay execution
 * - (+) Action Sheet for live browsing, web searching, and session clearing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  Mic01Icon,
  SentIcon,
  Globe02Icon,
  PlayIcon,
  SparklesIcon,
  Search01Icon,
  Delete02Icon,
  Idea01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { ChatMessage } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';
import { StorageService } from '@/services/storage';
import {
  LiveBrowserModal,
  FinanceCard,
  BrowserCard,
  CheckoutCard,
  DocumentCard,
  MascotAvatar,
} from '@/components/common';

const QUICK_PROMPTS = [
  {
    icon: Search01Icon,
    title: 'Web Search',
    prompt: 'Search the web for the latest artificial intelligence agent updates today',
  },
  {
    icon: Globe02Icon,
    title: 'Live Cloud Browser',
    prompt: 'Open https://news.ycombinator.com in cloud browser and summarize top 3 posts',
  },
  {
    icon: SparklesIcon,
    title: 'Market Analysis',
    prompt: 'Give me a concise analysis of top tech company earnings and market sentiment',
  },
  {
    icon: Idea01Icon,
    title: 'Workflow Automation',
    prompt: 'Help me design an autonomous daily routine to track competitors and prices',
  },
];

export default function ChatScreen() {
  const [activeSessionId, setActiveSessionId] = useState('main-chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [liveModal, setLiveModal] = useState<{ visible: boolean; url: string | null; title?: string }>({
    visible: false,
    url: null,
    title: undefined,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Load messages whenever screen comes into focus or session switches
  const loadActiveSessionMessages = useCallback(async () => {
    const activeId = await StorageService.getActiveSessionId();
    setActiveSessionId(activeId);
    const sessionMessages = await StorageService.getSessionMessages(activeId);
    setMessages(sessionMessages || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActiveSessionMessages();
    }, [loadActiveSessionMessages])
  );

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isProcessing]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  const handleSend = async (overridePrompt?: string) => {
    const text = (typeof overridePrompt === 'string' ? overridePrompt : inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInputText('');
    setIsProcessing(true);

    const activeId = await StorageService.getActiveSessionId();
    const allSessions = await StorageService.getAllSessions();
    const currentSession = allSessions.find((s) => s.id === activeId);

    // Auto-rename session if it's the default name
    let newTitle: string | undefined = undefined;
    if (
      currentSession &&
      (currentSession.title === 'New chat' ||
        currentSession.title === 'Main chat' ||
        !currentSession.title)
    ) {
      newTitle = text.length > 26 ? `${text.slice(0, 26)}...` : text;
    }

    await StorageService.saveSessionMessages(activeId, updatedWithUser, newTitle);

    try {
      const history = updatedWithUser.map((m) => ({ sender: m.sender, text: m.text }));
      const res = await ApiService.sendMessage(text, history);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.data?.reply || 'Task completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: res.data?.actions,
      };

      const finalMessages = [...updatedWithUser, agentMsg];
      setMessages(finalMessages);
      await StorageService.saveSessionMessages(activeId, finalMessages, newTitle);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: "I couldn't reach the agent backend server. Please verify the backend is running at port 3001.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const finalWithErr = [...updatedWithUser, errorMsg];
      setMessages(finalWithErr);
      await StorageService.saveSessionMessages(activeId, finalWithErr, newTitle);
      showToast('Agent connection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenLink = async (url?: string, title?: string) => {
    if (!url) return;
    try {
      if (Platform.OS === 'web') {
        setLiveModal({
          visible: true,
          url,
          title: title || 'Browserbase Cloud Live View',
        });
      } else {
        const WebBrowser = await import('expo-web-browser');
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: '#FFFFFF',
          controlsColor: '#2563EB',
        });
      }
    } catch {
      Linking.openURL(url);
    }
  };

  const handleClearCurrentChat = async () => {
    await StorageService.saveSessionMessages(activeSessionId, []);
    setMessages([]);
    setShowAttachMenu(false);
    showToast('Conversation cleared');
  };

  const headerOffset = Platform.OS === 'ios' ? insets.top + 98 : 0;
  const hasUserMessages = messages.some((m) => m.sender === 'user');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerOffset}>
      <View style={styles.content}>
        {/* Scrollable Messages Thread */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.scrollInner}>
              {/* Empty / Welcome State with Quick Action Chips */}
              {!hasUserMessages && (
                <View style={styles.emptyWelcomeContainer}>
                  <View style={styles.welcomeMascotAura}>
                    <MascotAvatar size={80} />
                  </View>
                  <Text style={styles.welcomeTitle}>What can I do for you?</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Ask anything, browse live cloud sessions, or run autonomous workflows.
                  </Text>

                  {/* 1-Tap Quick Action Prompt Chips */}
                  <View style={styles.promptChipsGrid}>
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <TouchableOpacity
                        key={`qp-${idx}`}
                        style={styles.promptChip}
                        onPress={() => handleSend(qp.prompt)}
                        activeOpacity={0.75}>
                        <View style={styles.promptChipIcon}>
                          <HugeiconsIcon icon={qp.icon} size={16} color={Colors.primary} strokeWidth={2} />
                        </View>
                        <View style={styles.promptChipContent}>
                          <Text style={styles.promptChipTitle}>{qp.title}</Text>
                          <Text style={styles.promptChipDesc} numberOfLines={2}>
                            {qp.prompt}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Centered Date Badge */}
              {hasUserMessages && (
                <View style={styles.dateBadgeContainer}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>Today</Text>
                  </View>
                </View>
              )}

              {/* Messages Thread */}
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.userMessageRow : styles.agentMessageRow,
                    ]}>
                    <View style={styles.bubbleContainer}>
                      {/* Chat Bubble */}
                      {msg.text ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => showToast(msg.text)}
                          style={[
                            styles.bubble,
                            isUser ? styles.userBubble : styles.agentBubble,
                          ]}>
                          <Text
                            style={[
                              styles.bubbleText,
                              isUser ? styles.userBubbleText : styles.agentBubbleText,
                            ]}>
                            {msg.text}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {/* User Reaction Badge */}
                      {isUser && msg.reaction && (
                        <View style={styles.reactionBadge}>
                          <Text style={styles.reactionText}>{msg.reaction}</Text>
                        </View>
                      )}

                      {/* Embedded Widget Cards */}
                      {msg.widget?.type === 'finance' && (
                        <FinanceCard
                          onOpenTracker={() => showToast('Opened Finance Tracker')}
                          onOptions={() => showToast('Finance options')}
                        />
                      )}

                      {msg.widget?.type === 'browser' && (
                        <BrowserCard
                          statusText={msg.widget.data?.statusText || 'Executing in cloud...'}
                          onOpenBrowser={() =>
                            handleOpenLink(
                              'https://www.browserbase.com',
                              'Cloud Browser View'
                            )
                          }
                        />
                      )}

                      {msg.widget?.type === 'checkout' && (
                        <CheckoutCard
                          productTitle={msg.widget.data?.productTitle || 'Item'}
                          price={msg.widget.data?.price || '$0.00'}
                          regularPrice={msg.widget.data?.regularPrice || '$0.00'}
                          total={msg.widget.data?.total || '$0'}
                          onAllow={() => showToast('Order approved')}
                          onDeny={() => showToast('Order cancelled')}
                          onReviewOrder={() =>
                            handleOpenLink('https://www.google.com', 'Review Order')
                          }
                        />
                      )}

                      {msg.widget?.type === 'document' && (
                        <DocumentCard
                          onOpenDoc={() => showToast('Opening document')}
                          onOptions={() => showToast('Document options')}
                        />
                      )}

                      {/* Live Browserbase Cloud Actions */}
                      {msg.actions && msg.actions.length > 0 && !msg.widget && (
                        <View style={styles.actionsContainer}>
                          {msg.actions.map((act, i) => {
                            if (act.type === 'browser_session') {
                              return (
                                <BrowserCard
                                  key={`browser-act-${i}`}
                                  title={act.title || 'Browser (Beta)'}
                                  url={act.url || act.liveViewUrl || act.replayUrl}
                                  statusText="Cloud browser session completed"
                                  previewType="web"
                                  onOpenBrowser={() =>
                                    handleOpenLink(
                                      act.replayUrl || act.liveViewUrl || act.url || 'https://www.browserbase.com',
                                      act.title
                                    )
                                  }
                                />
                              );
                            }
                            return (
                              <View key={`act-${i}`} style={styles.actionCard}>
                                <View style={styles.actionHeader}>
                                  <HugeiconsIcon
                                    icon={Globe02Icon}
                                    size={16}
                                    color={Colors.primary}
                                    strokeWidth={2}
                                  />
                                  <Text style={styles.actionTitle} numberOfLines={1}>
                                    {act.title}
                                  </Text>
                                </View>

                                {(act.replayUrl || act.url) && (
                                  <TouchableOpacity
                                    style={styles.sessionLinkBtn}
                                    onPress={() => handleOpenLink(act.replayUrl || act.url, act.title)}
                                    activeOpacity={0.7}>
                                    <HugeiconsIcon
                                      icon={PlayIcon}
                                      size={13}
                                      color={Colors.primary}
                                      strokeWidth={2.4}
                                    />
                                    <Text style={styles.sessionLinkText}>
                                      Open Browser / Replay
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Processing indicator */}
              {isProcessing && (
                <View style={[styles.messageRow, styles.agentMessageRow]}>
                  <View style={[styles.bubble, styles.agentBubble, styles.loadingBubble]}>
                    <HugeiconsIcon icon={SparklesIcon} size={16} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.loadingText}>Muse AI is reasoning and executing...</Text>
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 6 }} />
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* Floating Input Pill */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputBar}>
            {/* Plus Attach / Actions Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => setShowAttachMenu(true)}
              activeOpacity={0.7}
              accessibilityLabel="Add attachment or action">
              <HugeiconsIcon icon={Add01Icon} size={20} color={Colors.iconDark} strokeWidth={2.2} />
            </TouchableOpacity>

            {/* Prompt Text Input */}
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              placeholder="Message Muse AI or type URL / goal..."
              placeholderTextColor={Colors.iconMuted}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />

            {/* Right Action: Send Button */}
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={[styles.circleBtn, styles.sendBtn]}
                onPress={() => handleSend()}
                activeOpacity={0.8}>
                <HugeiconsIcon icon={SentIcon} size={18} color={Colors.white} strokeWidth={2.4} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => showToast('Voice input')}
                activeOpacity={0.7}>
                <HugeiconsIcon icon={Mic01Icon} size={20} color={Colors.iconDark} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Quick Action (+) Modal Sheet */}
      <Modal
        visible={showAttachMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Agent Actions</Text>
              <TouchableOpacity onPress={() => setShowAttachMenu(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.iconMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setShowAttachMenu(false);
                handleSend('Open https://google.com in live cloud browser and check headlines');
              }}>
              <HugeiconsIcon icon={Globe02Icon} size={20} color={Colors.primary} />
              <View style={styles.sheetOptionTextWrap}>
                <Text style={styles.sheetOptionTitle}>Browse Cloud Web Page</Text>
                <Text style={styles.sheetOptionDesc}>Launch live Browserbase session</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setShowAttachMenu(false);
                handleSend('Search the web for the latest updates today');
              }}>
              <HugeiconsIcon icon={Search01Icon} size={20} color="#10B981" />
              <View style={styles.sheetOptionTextWrap}>
                <Text style={styles.sheetOptionTitle}>Deep Web Search</Text>
                <Text style={styles.sheetOptionDesc}>Real-time information gathering</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetOption, { borderBottomWidth: 0 }]}
              onPress={handleClearCurrentChat}>
              <HugeiconsIcon icon={Delete02Icon} size={20} color="#EF4444" />
              <View style={styles.sheetOptionTextWrap}>
                <Text style={[styles.sheetOptionTitle, { color: '#EF4444' }]}>Clear Conversation</Text>
                <Text style={styles.sheetOptionDesc}>Reset active chat history</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Embedded Live Cloud Browser Modal */}
      <LiveBrowserModal
        visible={liveModal.visible}
        url={liveModal.url}
        title={liveModal.title}
        onClose={() => setLiveModal({ visible: false, url: null })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  scrollInner: {
    flexGrow: 1,
  },
  emptyWelcomeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  welcomeMascotAura: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeMascot: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.iconDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
    lineHeight: 19,
  },
  promptChipsGrid: {
    width: '100%',
    gap: 10,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  promptChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipContent: {
    flex: 1,
  },
  promptChipTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.iconDark,
    marginBottom: 2,
  },
  promptChipDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dateBadgeContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  dateBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  messageRow: {
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  agentMessageRow: {
    justifyContent: 'flex-start',
  },
  bubbleContainer: {
    maxWidth: '88%',
    position: 'relative',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.chatBubbleUser,
    borderBottomRightRadius: 6,
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: Colors.chatBubbleAi,
    borderBottomLeftRadius: 6,
    alignSelf: 'flex-start',
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionText: {
    fontSize: 13,
  },
  bubbleText: {
    fontSize: 15.5,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  userBubbleText: {
    color: '#3B2318',
    fontWeight: '500',
  },
  agentBubbleText: {
    color: Colors.iconDark,
    fontWeight: '400',
  },
  actionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  sessionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sessionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    paddingTop: 6,
    backgroundColor: Colors.white,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    backgroundColor: Colors.iconDark,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.iconDark,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  sheetOptionTextWrap: {
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: Colors.iconDark,
  },
  sheetOptionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
