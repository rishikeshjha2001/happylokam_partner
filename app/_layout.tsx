import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <>
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
        <Stack.Screen name="wallet" />
        <Stack.Screen name="kyc" />
        <Stack.Screen name="referrals" />
        <Stack.Screen name="add-service" />
        <Stack.Screen name="service-details" />
        <Stack.Screen name="booking-details" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
