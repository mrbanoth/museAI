/**
 * ChatBubble Component
 *
 * Renders an individual chat utterance bubble:
 * - User messages: Warm peach terracotta (#E8C4B4) right-aligned bubble
 * - AI Agent messages: Soft minimalist gray (#EEF0F2) left-aligned bubble
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { ChatMessage } from '@/constants/dummyData';

export interface ChatBubbleProps {
  /** The message data entity containing sender, text, and timestamp */
  message: ChatMessage;
}

/**
 * Message Bubble Component supporting User and AI Agent styling
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.agentRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  bubbleRow: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 6,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  agentRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
  },
  userBubble: {
    backgroundColor: Colors.chatBubbleUser, // Soft peach #E8C4B4
  },
  agentBubble: {
    backgroundColor: Colors.chatBubbleAi, // Soft gray #EEF0F2
  },
  messageText: {
    fontSize: 16,
    lineHeight: 23,
    color: Colors.iconDark,
    letterSpacing: -0.1,
  },
});

export default ChatBubble;
