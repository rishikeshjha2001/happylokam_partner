import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User, Mail, Lock, Phone, Briefcase, MapPin, ArrowRight, ArrowLeft,
  FileText, Building2, CheckCircle2, Gift,
} from 'lucide-react-native';
import { PARTNER_API } from '../constants/api';
import PartnerDatabase from '../services/partnerDatabase';

const SERVICE_CATEGORIES = ['Venue', 'Catering', 'Decoration', 'DJ & Music', 'Photography', 'Mehendi', 'Makeup', 'Choreography', 'Other'];

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    businessName: '', categories: [] as string[], location: '', city: '',
    ownerName: '', gstNumber: '', panNumber: '',
    referredByCode: '',
  });

  const update = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  const toggleCategory = (cat: string) => {
    setForm(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : [...p.categories, cat],
    }));
  };

  const next = () => {
    setError('');
    if (step === 1) {
      if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.phone.trim()) {
        setError('All fields are required.'); return;
      }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    }
    if (step === 2) {
      if (!form.businessName.trim()) { setError('Business name is required.'); return; }
      if (form.categories.length === 0) { setError('Select at least one category.'); return; }
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.location.trim()) { setError('Location is required.'); return; }
    setLoading(true);

    try {
      const res = await fetch(`${PARTNER_API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Registration failed.'); setLoading(false); return;
      }
      await PartnerDatabase.saveSession(json.data);
      router.replace('/(tabs)');
    } catch (e) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Personal Details', 'Business Info', 'Location & Referral'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />
      <View style={styles.aura1} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Partner Registration</Text>
          <Text style={styles.subtitle}>Step {step} of 3 — {stepLabels[step - 1]}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]}>
              {s < step ? <CheckCircle2 size={16} color="#ffffff" /> : <Text style={[styles.progressNum, s <= step && { color: '#fff' }]}>{s}</Text>}
            </View>
          ))}
          <View style={styles.progressLine}>
            <View style={[styles.progressFill, { width: `${((step - 1) / 2) * 100}%` }]} />
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

          {/* Step 1: Personal */}
          {step === 1 && (
            <>
              <InputField icon={<User size={18} color="#64748b" />} label="Full Name" value={form.name} onChange={(v: string) => update('name', v)} placeholder="Enter your full name" />
              <InputField icon={<Mail size={18} color="#64748b" />} label="Email" value={form.email} onChange={(v: string) => update('email', v)} placeholder="partner@example.com" keyboard="email-address" />
              <InputField icon={<Lock size={18} color="#64748b" />} label="Password" value={form.password} onChange={(v: string) => update('password', v)} placeholder="Min 6 characters" secure />
              <InputField icon={<Phone size={18} color="#64748b" />} label="Phone Number" value={form.phone} onChange={(v: string) => update('phone', v)} placeholder="9876543210" keyboard="phone-pad" maxLen={10} />
            </>
          )}

          {/* Step 2: Business */}
          {step === 2 && (
            <>
              <InputField icon={<Briefcase size={18} color="#64748b" />} label="Business Name" value={form.businessName} onChange={(v: string) => update('businessName', v)} placeholder="Enter business name" />
              <Text style={styles.catLabel}>Service Categories</Text>
              <View style={styles.catGrid}>
                {SERVICE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, form.categories.includes(cat) && styles.catChipActive]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <Text style={[styles.catChipText, form.categories.includes(cat) && styles.catChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <InputField icon={<User size={18} color="#64748b" />} label="Owner Name" value={form.ownerName} onChange={(v: string) => update('ownerName', v)} placeholder="Business owner name" />
            </>
          )}

          {/* Step 3: Location, Documents & Referral */}
          {step === 3 && (
            <>
              <InputField icon={<MapPin size={18} color="#64748b" />} label="City / Location" value={form.location} onChange={(v: string) => update('location', v)} placeholder="Patna, Bihar" />
              <InputField icon={<Building2 size={18} color="#64748b" />} label="Full Address" value={form.city} onChange={(v: string) => update('city', v)} placeholder="Sector 5, Kankarbagh" />
              <InputField icon={<FileText size={18} color="#64748b" />} label="GST Number (Optional)" value={form.gstNumber} onChange={(v: string) => update('gstNumber', v)} placeholder="22AAAAA0000A1Z5" />
              <InputField icon={<FileText size={18} color="#64748b" />} label="PAN Number (Optional)" value={form.panNumber} onChange={(v: string) => update('panNumber', v)} placeholder="10-digit PAN (optional)" />
              <InputField icon={<Gift size={18} color="#60a5fa" />} label="Referral Code (Optional)" value={form.referredByCode} onChange={(v: string) => update('referredByCode', v.toUpperCase())} placeholder="e.g. HLP-ROYA-9X2F" />
            </>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <ArrowLeft size={18} color="#94a3b8" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.7 }]}
            onPress={step < 3 ? next : handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.nextBtnText}>{step < 3 ? 'Continue' : 'Register'}</Text>
                <ArrowRight size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Input Component
function InputField({ icon, label, value, onChange, placeholder, keyboard, secure, maxLen }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          keyboardType={keyboard || 'default'}
          secureTextEntry={secure}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          maxLength={maxLen}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  aura1: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(37, 99, 235, 0.1)' },
  scroll: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30, marginBottom: 24, position: 'relative' },
  progressDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1c2333',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1c2333', zIndex: 2,
  },
  progressDotActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  progressNum: { fontSize: 13, fontWeight: '800', color: '#64748b' },
  progressLine: { position: 'absolute', height: 3, backgroundColor: '#1c2333', left: '20%', right: '20%', top: 15, zIndex: 1, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 2 },
  formCard: { backgroundColor: '#0d1117', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1c2333' },
  errorBanner: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { fontSize: 13, color: '#f87171', fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#121622', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: '#1c2333' },
  input: { flex: 1, fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  catLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 10, marginTop: 4, letterSpacing: 0.5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#121622', borderWidth: 1, borderColor: '#1c2333' },
  catChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  catChipTextActive: { color: '#ffffff' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  backBtn: { flex: 0.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderRadius: 14, backgroundColor: '#121622', borderWidth: 1, borderColor: '#1c2333' },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#94a3b8' },
  nextBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#64748b' },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#60a5fa' },
});
