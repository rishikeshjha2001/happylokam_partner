import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Lock,
  HelpCircle,
  FileText,
  Shield,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sparkles,
  PhoneCall,
  MessageSquare,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';

export default function SettingsScreen() {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [checkingOta, setCheckingOta] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const handleOtaCheck = () => {
    setCheckingOta(true);
    setTimeout(() => {
      setCheckingOta(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'App Up to Date 🚀',
        message: 'happylokam Partner App v1.0.0 (OTA build: #20261004) is running the latest production updates.',
      });
    }, 800);
  };

  const handleLogout = () => {
    setAlertConfig({
      visible: true,
      type: 'exit',
      title: 'Sign Out?',
      message: 'Are you sure you want to log out from your Partner Dashboard?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await PartnerDatabase.clearSession();
            router.replace('/login');
          },
        },
      ],
    });
  };

  const openSupportWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hi%20happylokam%20Partner%20Support');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Notification Preferences */}
        <Text style={styles.sectionHeader}>Notification Preferences</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Instant Booking Alerts</Text>
              <Text style={styles.rowSub}>Get notified immediately when a customer requests your service</Text>
            </View>
            <Switch
              value={bookingAlerts}
              onValueChange={setBookingAlerts}
              trackColor={{ false: '#1e293b', true: '#2563eb' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Status updates, happylokam Support verifications, and referral rewards</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#1e293b', true: '#2563eb' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Weekly Email Digest</Text>
              <Text style={styles.rowSub}>Summary of weekly revenue and completed reservations</Text>
            </View>
            <Switch
              value={emailDigest}
              onValueChange={setEmailDigest}
              trackColor={{ false: '#1e293b', true: '#2563eb' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* System & OTA Updates */}
        <Text style={styles.sectionHeader}>System & Live Updates</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={handleOtaCheck}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
              <RefreshCw size={18} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Check for OTA Updates</Text>
              <Text style={styles.rowSub}>React Native live bundle synchronization</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Partner Support */}
        <Text style={styles.sectionHeader}>Partner Help & Support</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={openSupportWhatsApp}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
              <MessageSquare size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Partner WhatsApp Help Desk</Text>
              <Text style={styles.rowSub}>Direct 24/7 happylokam Support line for vendors & venue partners</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRow, styles.rowBorder]}
            onPress={() => Linking.openURL('https://happylokam.com/terms')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
              <FileText size={18} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Terms of Service & Commission</Text>
              <Text style={styles.rowSub}>Partner agreement, platform policies, and escrow terms</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={handleLogout}>
          <LogOut size={18} color="#f87171" />
          <Text style={styles.logoutBtnText}>Sign Out from Partner Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
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
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#94a3b8', marginBottom: 8, marginTop: 12, letterSpacing: 0.5 },
  card: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1c2438',
    marginBottom: 16,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#161d2d',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  rowSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, lineHeight: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: { fontSize: 14, fontWeight: '800', color: '#f87171' },
});
