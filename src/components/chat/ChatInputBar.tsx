/**
 * ChatInputBar Component
 *
 * Floating stadium-shaped prompt input bar located right above the navigation dock:
 * - Left: Add attachment / integration action button (+)
 * - Center: Single-line / multi-line prompt text field with focus styling & keyboard submit
 * - Right: Context-sensitive button (Voice mic icon when empty, Up arrow send button when typing)
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  AiMicIcon,
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';

export interface ChatInputBarProps {
  /** Current text value in the input field */
  inputText: string;
  /** Callback fired as user types */
  onChangeText: (text: string) => void;
  /** Callback fired when message is submitted */
  onSend: () => void;
  /** Callback fired when attachment (+) is tapped */
  onAttach?: () => void;
  /** Callback fired when voice mic button is tapped */
  onVoice?: () => void;
  /** Disables submission when AI agent is currently processing */
  isLoading?: boolean;
  /** Placeholder hint text */
  placeholder?: string;
}

/**
 * Chat Prompt Input Bar Component
 */
export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  onChangeText,
  onSend,
  onAttach,
  onVoice,
  isLoading = false,
  placeholder = 'Message in Start a health goal',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasText = inputText.trim().length > 0;

  // Handle hardware / web Enter key submission (Shift+Enter for newline)
  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      if (hasText && !isLoading) {
        onSend();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputPill,
          isFocused && styles.focusedPill,
        ]}>
        {/* Left Plus Icon (+) */}
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={onAttach}
          activeOpacity={0.7}
          accessibilityLabel="Add attachment or action">
          <HugeiconsIcon
            icon={Add01Icon}
            size={22}
            color={Colors.iconDark}
            strokeWidth={2.2}
          />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.iconMuted}
          value={inputText}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          accessibilityLabel="Chat prompt input"
        />

        {/* Right Icon: Send button when typing, or Mic icon when empty */}
        {hasText ? (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={onSend}
            disabled={isLoading}
            activeOpacity={0.8}
            accessibilityLabel="Send message">
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              size={18}
              color={Colors.white}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.micBtn}
            onPress={onVoice}
            activeOpacity={0.7}
            accessibilityLabel="Voice dictate">
            <HugeiconsIcon
              icon={AiMicIcon}
              size={20}
              color={Colors.iconMuted}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: Colors.white,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  focusedPill: {
    borderColor: '#D0D5DD',
  },
  plusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.iconDark,
    paddingVertical: 0,
  },
  micBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.iconDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

export default ChatInputBar;
