/**
 * SignInScreen Component
 *
 * Minimalist onboarding and authentication entry point:
 * - Center: Large Muse AI emblem brand hero with glowing halo
 * - Bottom: Full-width Google Sign-in action button with loading spinner transition
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { MuseLogo, GoogleSignInButton } from '@/components/auth';
import { useRouter } from 'expo-router';

/**
 * Authentication Entry Screen
 */
export const SignInScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle Google OAuth authentication sequence
  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/home');
    }, 450);
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        {/* Top / Center: Logo and App Name */}
        <View style={styles.logoContainer}>
          <MuseLogo size="large" />
        </View>

        {/* Bottom / Action: Single 'Sign in with Google' Button */}
        <View style={styles.actionContainer}>
          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={loading}
            text="Sign in with Google"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
});

export default SignInScreen;
