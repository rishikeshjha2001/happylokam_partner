import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { theme } from '../../src/constants/theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('partner_token');
      const response = await fetch('https://api.happylokam.com/api/v1/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.data || { name: 'Partner', email: 'partner@happylokam.com', referralCode: 'REF123', walletBalance: 0 });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('partner_token');
    router.replace('/login');
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#e11d48" style={{marginTop: 50}} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{profile?.name?.charAt(0) || 'P'}</Text>
        </View>
        <Text style={styles.businessName}>{profile?.name || 'Partner Business'}</Text>
        <Text style={styles.businessEmail}>{profile?.email || 'contact@example.com'}</Text>
      </View>

      <View style={styles.subscriptionCard}>
        <Text style={styles.subTitle}>Wallet Balance</Text>
        <Text style={styles.subPrice}>₹{profile?.walletBalance || 0}</Text>
        
        <Text style={[styles.subTitle, { marginTop: 16 }]}>Referral Code</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{profile?.referralCode || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Business Information</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Bank Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingItem, styles.lastSettingItem]} onPress={handleLogout}>
          <Text style={[styles.settingText, { color: theme.colors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  profileHeader: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.md },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  avatarText: { fontSize: 32, color: theme.colors.surface, fontWeight: 'bold' },
  businessName: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text },
  businessEmail: { color: theme.colors.textSecondary, marginTop: 4 },
  subscriptionCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border },
  subTitle: { fontSize: 16, color: theme.colors.textSecondary },
  subPrice: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginVertical: theme.spacing.sm },
  activeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, backgroundColor: theme.colors.success + '20', borderRadius: theme.borderRadius.full },
  activeBadgeText: { color: theme.colors.success, fontWeight: 'bold', fontSize: 12 },
  settingsSection: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md },
  settingItem: { padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  lastSettingItem: { borderBottomWidth: 0 },
  settingText: { fontSize: 16, color: theme.colors.text },
});
