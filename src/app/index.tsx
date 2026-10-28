import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, ShieldCheck, Briefcase } from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // Main Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(35)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const badgeTranslateY = useRef(new Animated.Value(25)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Ambient Aura Pulses
  const pulseScale1 = useRef(new Animated.Value(0.8)).current;
  const pulseScale2 = useRef(new Animated.Value(1.1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // 1. Ambient Background Pulse Loop
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale1, {
            toValue: 1.3,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale1, {
            toValue: 0.8,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseScale2, {
            toValue: 0.85,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale2, {
            toValue: 1.2,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.35,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Main Logo & Content Entrance Sequence
    Animated.sequence([
      // Step A: Logo Spring & Fade In
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // Step B: Staggered Typography
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Step C: Badge & Progress Bar
      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(badgeTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),

      Animated.delay(400),

      // Step D: Smooth Exit Transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(async () => {
      const isAuthed = await PartnerDatabase.isAuthenticated();
      if (isAuthed) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  const spin = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Ambient Neon Aura Backdrops */}
      <Animated.View
        style={[
          styles.ambientOrb1,
          {
            transform: [{ scale: pulseScale1 }],
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrb2,
          {
            transform: [{ scale: pulseScale2 }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Decorative Grid Lines */}
      <View style={styles.gridLineHorizontal} />
      <View style={styles.gridLineVertical} />

      {/* Main Branded Content */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Holographic Logo Emblem */}
        <Animated.View
          style={[
            styles.emblemOuter,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.emblemGlowRing} />
          <View style={styles.emblemCore}>
            <View style={styles.emblemTopAccent} />
            <Text style={styles.emblemLetter}>H</Text>
            <View style={styles.emblemSparkle}>
              <Sparkles size={14} color="#60a5fa" />
            </View>
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            alignItems: 'center',
          }}
        >
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitlePrefix}>happy</Text>
            <Text style={styles.brandTitleSuffix}>lokam</Text>
          </View>
          <Text style={styles.brandTagline}>PARTNER NETWORK</Text>
        </Animated.View>

        {/* Verified Business Suite Badge */}
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              opacity: badgeOpacity,
              transform: [{ translateY: badgeTranslateY }],
            },
          ]}
        >
          <ShieldCheck size={14} color="#34d399" />
          <Text style={styles.badgeText}>VERIFIED BUSINESS SUITE</Text>
        </Animated.View>

        {/* Glowing Progress Loader */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>

      {/* Bottom Footer Credits */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>POWERING EVENT EXCELLENCE</Text>
        <Text style={styles.footerVersion}>v1.0.0 • PRO SUITE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: height * 0.15,
    left: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: height * 0.18,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: width,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    top: height * 0.5,
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: height,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    left: width * 0.5,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemOuter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emblemGlowRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  emblemCore: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#60a5fa',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  emblemTopAccent: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 3,
    backgroundColor: '#93c5fd',
    borderRadius: 2,
  },
  emblemLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  emblemSparkle: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitlePrefix: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandTitleSuffix: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 4,
    marginTop: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 1.2,
  },
  progressTrack: {
    width: 140,
    height: 3,
    backgroundColor: '#161d2d',
    borderRadius: 2,
    marginTop: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 2,
  },
  footerVersion: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
});
