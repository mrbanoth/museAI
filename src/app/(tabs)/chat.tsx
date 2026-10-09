/**
 * Chat Tab Screen ('/(tabs)/chat')
 *
 * Minimalist, clean conversational companion UI with real-time Browserbase Cloud Agent:
 * - Scrollable message thread
 * - Floating prompt bar (+ attachment, input box, voice mic, send action)
 * - Cloud Browser Live View & Replay badges
 * - Simple on-click Toast triggers
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  Mic01Icon,
  SentIcon,
  Globe02Icon,
  PlayIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { INITIAL_CHAT_MESSAGES } from '@/constants/dummyData';
import { ChatMessage } from '@/types';
import { showToast } from '@/context/ToastContext';
import { ApiService } from '@/services/api';
import {
  LiveBrowserModal,
  FinanceCard,
  BrowserCard,
  CheckoutCard,
  DocumentCard,
} from '@/components/common';

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveModal, setLiveModal] = useState<{ visible: boolean; url: string | null; title?: string }>({
    visible: false,
    url: null,
    title: undefined,
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Load persisted chat messages on mount
  useEffect(() => {
    (async () => {
      const { StorageService } = await import('@/services/storage');
      const saved = await StorageService.getChatMessages();
      if (saved && saved.length > 0) {
        setMessages(saved);
      }
    })();
  }, []);

  // Calculate header height offset for iOS KeyboardAvoidingView (SafeAreaView top + AppHeader height)
  const headerOffset = Platform.OS === 'ios' ? insets.top + 98 : 0;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isProcessing]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  const handleSend = async () => {
    const text = inputText.trim();
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

    const { StorageService } = await import('@/services/storage');
    await StorageService.saveChatMessages(updatedWithUser);

    try {
      const history = updatedWithUser.map((m) => ({ sender: m.sender, text: m.text }));
      const res = await ApiService.sendMessage(text, history);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.data?.reply || 'Done!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: res.data?.actions,
      };

      const finalMessages = [...updatedWithUser, agentMsg];
      setMessages(finalMessages);
      await StorageService.saveChatMessages(finalMessages);
    } catch (err: any) {
      showToast('Failed to reach agent');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenLink = (url?: string, title?: string) => {
    if (!url) return;
    setLiveModal({
      visible: true,
      url,
      title: title || 'Browserbase Cloud Live / Replay',
    });
  };

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
              {/* Centered Date Badge */}
              <View style={styles.dateBadgeContainer}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>Today</Text>
                </View>
              </View>

              {/* Messages */}
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
                      {/* Chat text bubble if text is present */}
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

                      {/* Attached User Emoji Reaction Badge */}
                      {isUser && msg.reaction && (
                        <View style={styles.reactionBadge}>
                          <Text style={styles.reactionText}>{msg.reaction}</Text>
                        </View>
                      )}

                      {/* Rich Embedded Widgets */}
                      {msg.widget?.type === 'finance' && (
                        <FinanceCard
                          onOpenTracker={() => showToast('Opened Finance Tracker')}
                          onOptions={() => showToast('Finance settings')}
                        />
                      )}

                      {msg.widget?.type === 'browser' && (
                        <BrowserCard
                          statusText={msg.widget.data?.statusText || 'Selecting seats...'}
                          onOpenBrowser={() =>
                            handleOpenLink(
                              'https://www.browserbase.com/sessions/45ea61b8-1a58-405e-8391-6955f71a9e1a',
                              'Movie Tickets Browser'
                            )
                          }
                        />
                      )}

                      {msg.widget?.type === 'checkout' && (
                        <CheckoutCard
                          productTitle={msg.widget.data?.productTitle || 'Glide Pro Stroller'}
                          price={msg.widget.data?.price || '$80.00'}
                          regularPrice={msg.widget.data?.regularPrice || '$320.00'}
                          total={msg.widget.data?.total || '$80'}
                          onAllow={() => showToast('Order approved! Placing order on merchant...')}
                          onDeny={() => showToast('Order denied.')}
                          onReviewOrder={() =>
                            handleOpenLink('https://www.google.com/search?q=Glide+Pro+Stroller', 'Review Order')
                          }
                        />
                      )}

                      {msg.widget?.type === 'document' && (
                        <DocumentCard
                          onOpenDoc={() => showToast('Opening Field Trip Permission Slip PDF')}
                          onOptions={() => showToast('Document options')}
                        />
                      )}

                      {/* Cloud Browser Action Badges */}
                      {msg.actions && msg.actions.length > 0 && !msg.widget && (
                        <View style={styles.actionsContainer}>
                          {msg.actions.map((act, i) => (
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

                              {act.replayUrl && (
                                <TouchableOpacity
                                  style={styles.sessionLinkBtn}
                                  onPress={() => handleOpenLink(act.replayUrl, act.title)}
                                  activeOpacity={0.7}>
                                  <HugeiconsIcon
                                    icon={PlayIcon}
                                    size={13}
                                    color={Colors.primary}
                                    strokeWidth={2.4}
                                  />
                                  <Text style={styles.sessionLinkText}>
                                    Watch Live / Replay
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
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
                    <Text style={styles.loadingText}>Muse AI is browsing the cloud...</Text>
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
            {/* Plus Attach Button */}
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => showToast('Attach file')}
              activeOpacity={0.7}>
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
              onSubmitEditing={handleSend}
            />

            {/* Right Action: Voice or Send */}
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={[styles.circleBtn, styles.sendBtn]}
                onPress={handleSend}
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    borderWidth: 1,
    borderColor: '#ECEEF0',
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
});
