import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Briefcase } from 'lucide-react-native';
import { PARTNER_API } from '../constants/api';
import PartnerDatabase from '../services/partnerDatabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${PARTNER_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Login failed.');
        setLoading(false);
        return;
      }

      await PartnerDatabase.saveSession(json.data);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />
      <View style={styles.aura1} />
      <View style={styles.aura2} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Briefcase size={28} color="#ffffff" />
            </View>
            <Text style={styles.title}>Partner Login</Text>
            <Text style={styles.subtitle}>Sign in to manage your business on happylokam</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="partner@example.com"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to happylokam?</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}> Register as Partner</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  aura1: { position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  aura2: { position: 'absolute', bottom: 100, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(99, 102, 241, 0.08)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  formCard: {
    backgroundColor: '#0d1117', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#1c2333',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: { fontSize: 13, color: '#f87171', fontWeight: '600' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#121622', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#1c2333',
  },
  input: { flex: 1, fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  loginBtn: {
    backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  demoBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  demoBtnText: { fontSize: 13, fontWeight: '700', color: '#60a5fa' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#64748b' },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#60a5fa' },
});
