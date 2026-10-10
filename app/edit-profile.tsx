import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Sparkles,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';

export default function EditProfileScreen() {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [categories, setCategories] = useState('');
  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      const session = await PartnerDatabase.getSession();
      if (session) {
        setBusinessName(session.businessName || session.name || '');
        setOwnerName(session.ownerName || session.name || '');
        setEmail(session.email || '');
        setPhone(session.phone || '');
        setLocation(session.location || 'Hyderabad');
        setCategories(session.categories?.join(', ') || 'Venues, Catering');
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!businessName.trim() || !ownerName.trim() || !phone.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please fill in your Business Name, Owner Name, and Contact Phone.',
      });
      return;
    }

    setSaving(true);
    setTimeout(async () => {
      const session = await PartnerDatabase.getSession();
      if (session) {
        session.businessName = businessName.trim();
        session.name = businessName.trim();
        session.ownerName = ownerName.trim();
        session.phone = phone.trim();
        session.location = location.trim();
        session.categories = categories
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        await PartnerDatabase.saveSession(session);
      }

      setSaving(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Profile Updated! ✨',
        message: 'Your partner business information has been successfully updated.',
        onClose: () => router.back(),
      });
    }, 700);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Business Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Business Name */}
        <Text style={styles.label}>Business / Brand Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Royal Palace Events"
          placeholderTextColor="#64748b"
          value={businessName}
          onChangeText={setBusinessName}
        />

        {/* Owner Name */}
        <Text style={styles.label}>Owner / Managing Director Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Vikram Reddy"
          placeholderTextColor="#64748b"
          value={ownerName}
          onChangeText={setOwnerName}
        />

        {/* Email */}
        <Text style={styles.label}>Official Business Email</Text>
        <TextInput
          style={[styles.input, { opacity: 0.8 }]}
          placeholder="e.g. partner@happylokam.com"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Phone */}
        <Text style={styles.label}>Customer Contact Phone *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. +91 98765 43210"
          placeholderTextColor="#64748b"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Operating Location */}
        <Text style={styles.label}>Operating City & Primary Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jubilee Hills, Hyderabad"
          placeholderTextColor="#64748b"
          value={location}
          onChangeText={setLocation}
        />

        {/* Categories */}
        <Text style={styles.label}>Service Categories (Comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Venues, Catering, Decoration"
          placeholderTextColor="#64748b"
          value={categories}
          onChangeText={setCategories}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          const cb = alertConfig.onClose;
          setAlertConfig({ visible: false, title: '', message: '' });
          if (cb) cb();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161d2d',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#0d1117',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#1c2438',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
