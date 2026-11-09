import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import PartnerDatabase from '../services/partnerDatabase';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Clean, elegant fade-in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // Check authentication and navigate cleanly after 1 second
    const timer = setTimeout(async () => {
      try {
        const isAuthed = await PartnerDatabase.isAuthenticated();
        if (isAuthed) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0052FF" />

      {/* Blue Background with Pure White happylokam Text */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.brandTitle}>happylokam</Text>

        <View style={styles.partnerBadge}>
          <Text style={styles.tagline}>Partner Network</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0052FF', // Official Partner Blue
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff', // Pure White text happylokam
    letterSpacing: -1.5,
  },
  partnerBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
});
