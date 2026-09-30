/**
 * GoogleSignInButton Component
 *
 * Dedicated authentication call-to-action button adhering to Google brand
 * guidelines, with active press animations, disabled states, and loading indicators.
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { GoogleIcon } from './GoogleIcon';
import { Colors } from '@/constants/colors';

export interface GoogleSignInButtonProps {
  /** Callback triggered when the user taps the button */
  onPress: () => void;
  /** When true, displays an activity spinner in place of the button content */
  loading?: boolean;
  /** Disables tap interactions when true */
  disabled?: boolean;
  /** Button label string (defaults to "Sign in with Google") */
  text?: string;
}

/**
 * Clean elevated Google OAuth authentication button
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  text = 'Sign in with Google',
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google">
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <GoogleIcon size={22} />
          </View>
          <Text style={styles.buttonText}>{text}</Text>
        </View>
      )}
    </Pressable>
  );
};


const styles = StyleSheet.create({
  button: {
    height: 54,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonPressed: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderFocus,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
});

export default GoogleSignInButton;
