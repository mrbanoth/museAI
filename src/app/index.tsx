/**
 * Real-Time Authentication & Animated Onboarding Screen ('/')
 *
 * Premium Landing & Auth:
 * - Floating animated plush mascot hero (no harsh black borders)
 * - Seamless Supabase Real-Time Email & Password Sign-in / Sign-up
 * - Google Sign-In with official brand styling
 * - Automatic session recovery
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
} from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { showToast } from '@/context/ToastContext';
import { StorageService } from '@/services/storage';
import { SupabaseService } from '@/services/supabase';
import { MascotAvatar } from '@/components/common';

/**
 * Official Google Brand SVG Icon
 */
const GoogleBrandIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

export default function SignInScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Floating animation for mascot
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.03,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseScale]);

  // Auto-redirect if already signed in (also completes the web Google OAuth redirect)
  useEffect(() => {
    (async () => {
      const session = await SupabaseService.getCurrentSession().catch(() => null);
      if (session?.user) {
        const user = session.user;
        await StorageService.signInAs({
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          avatar: user.user_metadata?.avatar_url,
          userId: user.id,
        });
        router.replace('/(tabs)/chat' as any);
        return;
      }
      const auth = await StorageService.getUserAuth();
      if (auth && auth.signedIn && auth.userId) {
        router.replace('/(tabs)/chat' as any);
      }
    })();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const session = await SupabaseService.signInWithGoogle();
      if (session?.user) {
        const user = session.user;
        await StorageService.signInAs({
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          avatar: user.user_metadata?.avatar_url,
          userId: user.id,
        });
        showToast('Signed in with Google');
        router.replace('/(tabs)/chat' as any);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Animated Hero Mascot Section */}
          <View style={styles.heroSection}>
            <Animated.View
              style={[
                styles.mascotAura,
                {
                  transform: [
                    { translateY: floatAnim },
                    { scale: pulseScale },
                  ],
                },
              ]}>
              <MascotAvatar size={96} />
            </Animated.View>

            <View style={styles.brandRow}>
              <Text style={styles.brandName}>Muse</Text>
              <Text style={styles.brandAi}> AI</Text>
            </View>
            <Text style={styles.tagline}>Autonomous Agent & Cloud Companion</Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.googleHint}>Sign in with your Google account to start.</Text>

            {/* Google Sign In */}

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.8}>
              {googleLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <View style={styles.googleContent}>
                  <GoogleBrandIcon size={20} />
                  <Text style={styles.googleText}>Sign in with Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  googleHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  mascotAura: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  mascotImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.iconDark,
    letterSpacing: -0.5,
  },
  brandAi: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.iconDark,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.iconDark,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dividerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  googleBtn: {
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.iconDark,
  },
});
