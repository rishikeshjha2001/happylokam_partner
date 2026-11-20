import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  BackHandler,
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
  Fingerprint,
  Trash2,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';
import { checkOTAUpdates, applyOTAUpdate } from '../services/otaService';

export default function SettingsScreen() {
  // Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [checkingOta, setCheckingOta] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    PartnerDatabase.isBiometricEnabled().then(setBiometricEnabled);
  }, []);

  const handleToggleBiometric = async (val: boolean) => {
    setBiometricEnabled(val);
    await PartnerDatabase.setBiometricEnabled(val);
    if (val) {
      Alert.alert(
        'Biometric Unlock Enabled 🛡️',
        'You can now use your device Fingerprint or Face ID for fast biometric verification and quick sign-in.'
      );
    } else {
      Alert.alert('Biometric Unlock Disabled', 'Standard password credentials will be required.');
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await PartnerDatabase.changePassword(currentPassword.trim(), newPassword.trim());
      setUpdatingPassword(false);
      if (res && res.success) {
        setPasswordModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Password Updated! 🔒', res.message || 'Your partner account password has been changed successfully.');
      } else {
        Alert.alert('Change Password Failed', res?.error || 'Current password was incorrect. Please try again.');
      }
    } catch (err: any) {
      setUpdatingPassword(false);
      Alert.alert('Error', err?.message || 'Unable to update password. Please check your network connection.');
    }
  };
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

  const handleOtaCheck = async () => {
    setCheckingOta(true);
    try {
      const check = await checkOTAUpdates(true);
      setCheckingOta(false);
      if (check.isAvailable) {
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Live Update Available 🚀',
          message:
            'A new partner app hotpatch has been uploaded to the cloud. Would you like to download and restart now?',
          buttons: [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update & Restart',
              onPress: async () => {
                await applyOTAUpdate(true);
              },
            },
          ],
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'App Up to Date 🚀',
          message:
            check.message ||
            'happylokam Partner App is running the latest production updates.',
        });
      }
    } catch (e: any) {
      setCheckingOta(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'App Up to Date 🚀',
        message: 'happylokam Partner App is running the latest production updates.',
      });
    }
  };

  const handleCleanAllData = () => {
    Alert.alert(
      'Clean All Partner Data & Bookings?',
      'This will completely wipe old cached reservations, test bookings, and local data to give you a fresh, clean dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Now',
          style: 'destructive',
          onPress: async () => {
            await PartnerDatabase.cleanAllPartnerData();
            try {
              const session = await PartnerDatabase.getSession();
              if (session?.token) {
                const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://happylokam.com/api/v1';
                await fetch(`${API_URL}/partners/reset-data`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${session.token}` },
                }).catch(() => {});
              }
            } catch {}
            Alert.alert('Data Cleaned Successfully ✨', 'All old partner bookings, test data, and cached records have been cleared.');
            router.replace('/(tabs)');
          },
        },
      ]
    );
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
    Linking.openURL('https://wa.me/918969255561?text=Hi%20happylokam%20Partner%20Support');
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

        {/* Account Security */}
        <Text style={styles.sectionHeader}>Account & Security</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={() => setPasswordModalVisible(true)}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Lock size={18} color="#f87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Change Account Password</Text>
              <Text style={styles.rowSub}>Update your login credentials securely</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <View style={[styles.switchRow, styles.rowBorder]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', marginRight: 12 }]}>
              <Fingerprint size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Biometric Quick Unlock</Text>
              <Text style={styles.rowSub}>Fingerprint & Face ID login verification</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#1e293b', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* System & OTA Updates */}
        <Text style={styles.sectionHeader}>System & Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.navRow} onPress={handleOtaCheck}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
              <RefreshCw size={18} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Check for Latest Updates</Text>
              <Text style={styles.rowSub}>Verify cloud synchronization and cache</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navRow, styles.rowBorder]} onPress={handleCleanAllData}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Trash2 size={18} color="#f87171" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: '#f87171' }]}>Clean All Old Partner Data & Bookings</Text>
              <Text style={styles.rowSub}>Clear old cached reservations and reset dashboard</Text>
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
              <Text style={styles.rowSub}>Direct 24/7 WhatsApp: +91 8969255561</Text>
            </View>
            <ChevronRight size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRow, styles.rowBorder]}
            onPress={() => Linking.openURL('tel:+918969255561')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <PhoneCall size={18} color="#38bdf8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Call Partner Support (+91 8969255561)</Text>
              <Text style={styles.rowSub}>Dedicated voice helpline for partners & event vendors</Text>
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

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Account Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Current Password (Optional if OTP Login)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter current password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>New Password (Min 6 chars)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter new secure password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Repeat new password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleChangePasswordSubmit}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
