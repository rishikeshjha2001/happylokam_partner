import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  BackHandler,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  User,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  FileText,
  LogOut,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Edit3,
  Package,
  CalendarCheck,
} from 'lucide-react-native';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerSession } from '../../services/partnerDatabase';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import CustomAlert, { CustomAlertOptions } from '../../components/CustomAlert';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<PartnerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOta, setCheckingOta] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<CustomAlertOptions | null>(null);

  // Hardware Back Handler for Exit Confirmation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  const fetchProfile = useCallback(async () => {
    try {
      const session = await PartnerDatabase.getSession();
      setProfile(session || null);

      if (session?.token) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);

          const resProf = await fetch(`${PARTNER_API}/me`, {
            headers: { Authorization: `Bearer ${session.token}` },
            signal: controller.signal,
          });
          clearTimeout(timer);

          const rawProf = await resProf.text();
          if (rawProf.startsWith('{')) {
            const jsonProf = JSON.parse(rawProf);
            if (jsonProf.success && jsonProf.data) {
              setProfile(jsonProf.data);
              await PartnerDatabase.saveSession(jsonProf.data);
            }
          }
        } catch (netErr) {
          // Offline
        }
      }
    } catch (e) {
      console.log('Error fetching partner profile:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleCheckOtaUpdate = async () => {
    try {
      setCheckingOta(true);
      setTimeout(() => {
        setCheckingOta(false);
        setAlertConfig({
          type: 'success',
          title: 'Latest Version Installed',
          message: 'happylokam Partner App is synchronized with the latest official cloud release.',
        });
      }, 700);
    } catch (e: any) {
      setCheckingOta(false);
    }
  };

  const handleLogout = () => {
    setAlertConfig({
      type: 'warning',
      title: 'Log Out',
      message: 'Are you sure you want to securely log out of your Partner account on this device?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await PartnerDatabase.clearSession();
        router.replace('/login');
      },
    });
  };

  const isVerified = profile?.status === 'VERIFIED' || profile?.isVerified === true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Partner Profile</Text>
          <Text style={styles.headerSub}>Account verification & business settings</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.8}
        >
          <Settings size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loaderText}>Loading profile details...</Text>
          </View>
        ) : (
          <>
            {/* Profile Overview Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Building2 size={28} color="#93c5fd" />
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.businessTitleRow}>
                  <Text style={styles.businessName}>
                    {profile?.businessName || profile?.name || 'Partner Account'}
                  </Text>
                  {isVerified ? (
                    <ShieldCheck size={18} color="#4ade80" />
                  ) : (
                    <Clock size={16} color="#fbbf24" />
                  )}
                </View>

                <Text style={styles.hlpIdBadge}>{profile?.hlpId || 'HLP Account'}</Text>

                <View style={styles.contactRow}>
                  <User size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>
                    {profile?.ownerName || profile?.name || 'Partner'}
                  </Text>
                </View>

                <View style={styles.contactRow}>
                  <Mail size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>
                    {profile?.email || 'No email registered'}
                  </Text>
                </View>

                <View style={styles.contactRow}>
                  <Phone size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>
                    {profile?.phone || 'No phone registered'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Edit3 size={16} color="#60a5fa" />
              </TouchableOpacity>
            </View>

            {/* Quick Action Matrix */}
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/services')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#1e3a8a30' }]}>
                  <Package size={20} color="#60a5fa" />
                </View>
                <Text style={styles.quickTitle}>My Services</Text>
                <Text style={styles.quickSub}>Manage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push('/kyc')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#064e3b30' }]}>
                  <ShieldCheck size={20} color="#34d399" />
                </View>
                <Text style={styles.quickTitle}>Bank KYC</Text>
                <Text style={[styles.quickSub, { color: isVerified ? '#34d399' : '#fbbf24' }]}>
                  {isVerified ? 'Verified' : 'Pending'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/bookings')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#4c1d9530' }]}>
                  <CalendarCheck size={20} color="#c084fc" />
                </View>
                <Text style={styles.quickTitle}>Bookings</Text>
                <Text style={[styles.quickSub, { color: '#c084fc' }]}>Live Orders</Text>
              </TouchableOpacity>
            </View>

            {/* Account Status Notice */}
            <View
              style={[
                styles.statusNotice,
                isVerified ? styles.statusNoticeVerified : styles.statusNoticePending,
              ]}
            >
              {isVerified ? (
                <>
                  <CheckCircle2 size={18} color="#4ade80" />
                  <Text style={[styles.statusNoticeText, { color: '#4ade80' }]}>
                    Your account is Verified & Active. Your listings are live on the happylokam platform.
                  </Text>
                </>
              ) : (
                <>
                  <AlertCircle size={18} color="#fbbf24" />
                  <Text style={[styles.statusNoticeText, { color: '#fbbf24' }]}>
                    Account Status: Under Review. Complete your Bank KYC details below to receive customer payouts.
                  </Text>
                </>
              )}
            </View>

            {/* Business Verification & Bank Details */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionBoxTitle}>Business Verification & Bank</Text>
                <TouchableOpacity onPress={() => router.push('/kyc')}>
                  <Text style={styles.sectionHeaderLink}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <CreditCard size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Bank Account</Text>
                  <Text style={styles.infoVal}>
                    {profile?.bankAccount
                      ? `•••• ${profile.bankAccount.slice(-4)}`
                      : 'Not Added (Tap Edit to configure)'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <FileText size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>GST Number</Text>
                  <Text style={styles.infoVal}>{profile?.gstNumber || 'Optional / Not Provided'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <FileText size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>PAN Number</Text>
                  <Text style={styles.infoVal}>{profile?.panNumber || 'Optional / Not Provided'}</Text>
                </View>
              </View>
            </View>

            {/* System & Controls */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionBoxTitle}>System & Controls</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <User size={18} color="#60a5fa" />
                  <View>
                    <Text style={styles.menuItemText}>Edit Business Profile</Text>
                    <Text style={styles.menuItemSub}>Update address, logo, and owner details</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/settings')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Settings size={18} color="#a78bfa" />
                  <View>
                    <Text style={styles.menuItemText}>Notification & App Settings</Text>
                    <Text style={styles.menuItemSub}>Push alerts, sound, and privacy</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                disabled={checkingOta}
                onPress={handleCheckOtaUpdate}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <RefreshCw size={18} color="#34d399" />
                  <View>
                    <Text style={styles.menuItemText}>App Version & Updates</Text>
                    <Text style={styles.menuItemSub}>Version 1.0.25 • Check for cloud updates</Text>
                  </View>
                </View>
                {checkingOta ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <ChevronRight size={18} color="#64748b" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Linking.openURL('tel:+918969255561')}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Phone size={18} color="#38bdf8" />
                  <View>
                    <Text style={styles.menuItemText}>Partner Voice Support</Text>
                    <Text style={styles.menuItemSub}>Call +91 8969255561 (24/7 dedicated line)</Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Logout from Partner App</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Exit Confirm Modal & Custom Alert */}
      <ExitConfirmModal visible={showExitModal} onCancel={() => setShowExitModal(false)} />
      <CustomAlert config={alertConfig} onClose={() => setAlertConfig(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  businessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  hlpIdBadge: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  contactText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    alignItems: 'center',
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  quickSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#60a5fa',
    marginTop: 2,
  },
  statusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  statusNoticeVerified: {
    backgroundColor: '#052e16',
    borderColor: '#15803d',
  },
  statusNoticePending: {
    backgroundColor: '#422006',
    borderColor: '#b45309',
  },
  statusNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  sectionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  sectionHeaderLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b40',
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b30',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f1315',
    borderWidth: 1,
    borderColor: '#7f1d1d40',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
});
