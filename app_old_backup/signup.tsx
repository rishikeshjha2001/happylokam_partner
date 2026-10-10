import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://api.happylokam.com/api/v1/auth/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('partner_token', data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Become a Partner</Text>
          <Text style={styles.subtitle}>Join happylokam to list your venues and services.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Business/Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your Business Name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="partner@happylokam.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already a partner? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.signupLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 80 },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', lineHeight: 24 },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a', marginBottom: 20 },
  loginButton: { backgroundColor: '#e11d48', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#e11d48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 12 },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  signupText: { color: '#64748b', fontSize: 15 },
  signupLink: { color: '#e11d48', fontSize: 15, fontWeight: '700' },
});
