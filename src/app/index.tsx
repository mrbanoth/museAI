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
  Platform,
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Globe02Icon, Mail01Icon, RepeatIcon } from '@hugeicons/core-free-icons';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { showToast } from '@/context/ToastContext';
import { StorageService } from '@/services/storage';
import { SupabaseService } from '@/services/supabase';
import { API_BASE_URL } from '@/services/api';
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

  const openPrivacy = () => {
    const url = `${API_BASE_URL.replace(/\/api$/, '')}/privacy`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.column}>
          {/* Floating mascot */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: pulseScale }] }}>
            <View style={styles.mascotRing}>
              <MascotAvatar size={128} />
            </View>
          </Animated.View>

          <Text style={styles.brandName}>Muse</Text>
          <Text style={styles.tagline}>Your personal AI agent that browses the web, reads your inbox and gets things done.</Text>

          {/* What Muse can do */}
          <View style={styles.features}>
            {[
              { icon: Globe02Icon, text: 'Browses live websites for you' },
              { icon: Mail01Icon, text: 'Summarizes Gmail & plans your Calendar' },
              { icon: RepeatIcon, text: 'Runs recurring tasks while you sleep' },
            ].map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <HugeiconsIcon icon={f.icon} size={16} color={Colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.googleBtnBusy]}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
            accessibilityLabel="Sign in with Google">
            {googleLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <GoogleBrandIcon size={20} />
                <Text style={styles.googleText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink} onPress={openPrivacy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.museCream,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  column: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  mascotRing: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  brandName: {
    marginTop: 22,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.iconDark,
  },
  tagline: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: Colors.textSecondary,
    maxWidth: 320,
  },
  features: {
    width: '100%',
    marginTop: 28,
    marginBottom: 24,
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySubtle,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.iconDark,
    fontWeight: '500',
  },
  errorBox: {
    width: '100%',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  googleBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  googleBtnBusy: {
    opacity: 0.7,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.iconDark,
  },
  legal: {
    marginTop: 18,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
