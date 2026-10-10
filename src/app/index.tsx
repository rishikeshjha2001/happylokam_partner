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
import { Sparkles, ShieldCheck } from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  // Main Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Background Ambient Wave
  const pulseScale = useRef(new Animated.Value(0.9)).current;
  const pulseOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // 1. Ambient Glow Loop
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.25,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 0.9,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.45,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.2,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 2. Entrance Animation Sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 400,
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

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 300,
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0052FF" />

      {/* Ambient Neon Backdrops */}
      <Animated.View
        style={[
          styles.ambientOrb1,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientOrb2,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Main Content Area */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: logoTranslateY },
            ],
          },
        ]}
      >
        {/* Exact Lowercase Brand Wordmark */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>happylokam</Text>
        </View>

        {/* Partner Ecosystem Tag */}
        <Animated.View style={[styles.partnerBadge, { opacity: badgeOpacity }]}>
          <ShieldCheck size={14} color="#ffffff" />
          <Text style={styles.partnerBadgeText}>PARTNER NETWORK</Text>
        </Animated.View>

        {/* Minimal Progress Loader */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </Animated.View>

      {/* Clean Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>POWERING EVENT EXCELLENCE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0052FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: height * 0.1,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 46,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'System',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  progressTrack: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    marginTop: 28,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
  },
});
