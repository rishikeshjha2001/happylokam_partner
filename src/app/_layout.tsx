import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { checkAndApplyOTAUpdates } from '../services/otaService';
import PartnerDatabase from '../services/partnerDatabase';

export default function RootLayout() {
  useEffect(() => {
    void PartnerDatabase.migrateOperationalCache('2026-11-04-clean-release-v29');
    void checkAndApplyOTAUpdates();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#070a12' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="kyc" />
        <Stack.Screen name="referrals" />
        <Stack.Screen name="add-service" />
        <Stack.Screen name="service-details" />
        <Stack.Screen name="edit-service" />
        <Stack.Screen name="booking-details" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}
