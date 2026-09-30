/**
 * ChatMessageList Component
 *
 * Scrollable conversation message thread supporting:
 * - Auto-scroll to bottom upon new message or typing state update
 * - Centered date divider badge ("Sep 25 at 3:35 PM")
 * - Top spacer pushing bubbles towards the bottom in short threads
 * - Animated Cooper thinking dots pulse when isThinking is active
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { ChatMessage } from '@/constants/dummyData';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';

export interface ChatMessageListProps {
  /** Array of conversation message objects */
  messages: ChatMessage[];
  /** When true, renders animated typing pulse bubble at the bottom */
  isThinking?: boolean;
}

/**
 * Scrollable Chat History List Component
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isThinking = false,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Automatically scroll to the latest message whenever messages array or thinking state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isThinking]);


  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {/* Top Flex Spacer to push messages towards bottom as in standard modern chat */}
      <View style={styles.topSpacer} />

      {/* Date separator centered */}
      <View style={styles.dateSeparator}>
        <Text style={styles.dateText}>Sep 25 at 3:35 PM</Text>
      </View>

      {/* Messages */}
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}

      {isThinking && (
        <View style={styles.typingWrapper}>
          <TypingIndicator />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  topSpacer: {
    flex: 1,
    minHeight: 40,
  },
  dateSeparator: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  typingWrapper: {
    paddingLeft: 4,
  },
});

export default ChatMessageList;
