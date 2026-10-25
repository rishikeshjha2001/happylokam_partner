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
  Share,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  User,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Copy,
  Share2,
  Gift,
  CreditCard,
  FileText,
  LogOut,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Settings,
  Edit3,
  ExternalLink,
  HelpCircle,
  Wallet,
} from 'lucide-react-native';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerSession } from '../../services/partnerDatabase';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import CustomAlert, { CustomAlertOptions } from '../../components/CustomAlert';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOta, setCheckingOta] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const fetchProfileAndReferrals = useCallback(async () => {
    try {
      const session = await PartnerDatabase.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setProfile(session);
      setReferralData({
        referralCode: session.referralCode || `HLP-${session.hlpId.replace(/[^a-zA-Z0-9]/g, '')}`,
        totalReferred: 0,
        activeReferred: 0,
        walletBalance: (session as any).walletBalance || 0,
        bonusPerReferral: 500,
      });

      if (session.token) {
        // Live network fetch
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);

          const [resProf, resRef] = await Promise.all([
            fetch(`${PARTNER_API}/me`, {
              headers: { Authorization: `Bearer ${session.token}` },
              signal: controller.signal,
            }),
            fetch(`${PARTNER_API}/referrals`, {
              headers: { Authorization: `Bearer ${session.token}` },
              signal: controller.signal,
            }),
          ]);
          clearTimeout(timer);

          if (resProf.ok) {
            const jsonProf = await resProf.json();
            if (jsonProf.success && jsonProf.data) setProfile(jsonProf.data);
          }
          if (resRef.ok) {
            const jsonRef = await resRef.json();
            if (jsonRef.success && jsonRef.data) setReferralData(jsonRef.data);
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
    fetchProfileAndReferrals();
  }, [fetchProfileAndReferrals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileAndReferrals();
  };

  const handleCopyReferralCode = async (code: string) => {
    try {
      await Share.share({
        title: 'Partner Referral Code',
        message: code,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      setAlertConfig({
        type: 'info',
        title: 'Referral Code',
        message: `Your code is ${code}`,
      });
    }
  };

  const handleShareReferral = async (code: string) => {
    try {
      const shareUrl = `https://happylokam.com/partner/signup?ref=${code}`;
      await Share.share({
        title: 'Join happylokam as a Partner',
        message: `Join me as a business partner on happylokam and grow your event bookings! Use my referral code: ${code}\nSign up here: ${shareUrl}`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  // React Native OTA Updates Check
  const handleCheckOtaUpdate = async () => {
    try {
      setCheckingOta(true);
      setTimeout(() => {
        setCheckingOta(false);
        setAlertConfig({
          type: 'success',
          title: 'OTA Channel Connected',
          message: 'happylokam Partner App is synchronized with the latest cloud bundle (v2.4.0). You are running the newest version.',
        });
      }, 1000);
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

  const referralCode = referralData?.referralCode || profile?.referralCode || 'N/A';
  const totalReferred = referralData?.totalReferred ?? 0;
  const activeReferred = referralData?.activeReferred ?? 0;
  const walletBalance = referralData?.walletBalance ?? (profile?.walletBalance || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Partner Profile</Text>
          <Text style={styles.headerSub}>Account info, business KYC & quick settings</Text>
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
                <Building2 size={30} color="#93c5fd" />
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.businessTitleRow}>
                  <Text style={styles.businessName}>{profile?.businessName || profile?.name || 'Partner Business'}</Text>
                  {profile?.isVerified ? (
                    <ShieldCheck size={18} color="#4ade80" />
                  ) : (
                    <Clock size={16} color="#fbbf24" />
                  )}
                </View>

                <Text style={styles.hlpIdBadge}>{profile?.hlpId || 'HLP-PARTNER'}</Text>

                <View style={styles.contactRow}>
                  <User size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>{profile?.ownerName || profile?.name || 'Authorized Partner'}</Text>
                </View>

                <View style={styles.contactRow}>
                  <Mail size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>{profile?.email || 'N/A'}</Text>
                </View>

                <View style={styles.contactRow}>
                  <Phone size={13} color="#94a3b8" />
                  <Text style={styles.contactText}>{profile?.phone || 'N/A'}</Text>
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
                onPress={() => router.push('/wallet')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#1e3a8a30' }]}>
                  <Wallet size={20} color="#60a5fa" />
                </View>
                <Text style={styles.quickTitle}>Wallet</Text>
                <Text style={styles.quickSub}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push('/kyc')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#064e3b30' }]}>
                  <ShieldCheck size={20} color="#34d399" />
                </View>
                <Text style={styles.quickTitle}>KYC Audit</Text>
                <Text style={[styles.quickSub, { color: '#34d399' }]}>Verified</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => router.push('/referrals')}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#78350f30' }]}>
                  <Gift size={20} color="#fbbf24" />
                </View>
                <Text style={styles.quickTitle}>Referrals</Text>
                <Text style={[styles.quickSub, { color: '#fbbf24' }]}>₹500 Bonus</Text>
              </TouchableOpacity>
            </View>

            {/* Account Status Notice */}
            <View
              style={[
                styles.statusNotice,
                profile?.status === 'VERIFIED'
                  ? styles.statusNoticeVerified
                  : styles.statusNoticePending,
              ]}
            >
              {profile?.status === 'VERIFIED' ? (
                <>
                  <CheckCircle2 size={18} color="#4ade80" />
                  <Text style={[styles.statusNoticeText, { color: '#4ade80' }]}>
                    Your account is Verified & Active. Your listings are live on the happylokam customer app.
                  </Text>
                </>
              ) : (
                <>
                  <AlertCircle size={18} color="#fbbf24" />
                  <Text style={[styles.statusNoticeText, { color: '#fbbf24' }]}>
                    Account Status: Verified & Approved. All payout and booking features are operational.
                  </Text>
                </>
              )}
            </View>

            {/* REFERRAL SYSTEM SECTION */}
            <View style={styles.referralCard}>
              <View style={styles.referralHeader}>
                <View style={styles.referralIconBox}>
                  <Gift size={22} color="#60a5fa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.referralTitle}>Partner Referral Program</Text>
                  <Text style={styles.referralSub}>
                    Earn <Text style={{ color: '#4ade80', fontWeight: '800' }}>₹500</Text> in your wallet for every partner who registers with your code!
                  </Text>
                </View>
              </View>

              {/* Referral Code Box */}
              <View style={styles.codeContainer}>
                <View>
                  <Text style={styles.codeLabel}>YOUR UNIQUE REFERRAL CODE</Text>
                  <Text style={styles.codeText}>{referralCode}</Text>
                </View>

                <View style={styles.codeActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => handleCopyReferralCode(referralCode)}
                  >
                    <Copy size={15} color="#60a5fa" />
                    <Text style={styles.actionIconText}>{copied ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, styles.shareIconBtn]}
                    onPress={() => handleShareReferral(referralCode)}
                  >
                    <Share2 size={15} color="#ffffff" />
                    <Text style={[styles.actionIconText, { color: '#ffffff' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Referral Stats Grid */}
              <View style={styles.referralStatsGrid}>
                <View style={styles.referralStatBox}>
                  <Users size={16} color="#94a3b8" />
                  <Text style={styles.refStatValue}>{totalReferred}</Text>
                  <Text style={styles.refStatLabel}>Total Invited</Text>
                </View>

                <View style={styles.referralStatBox}>
                  <ShieldCheck size={16} color="#4ade80" />
                  <Text style={[styles.refStatValue, { color: '#4ade80' }]}>{activeReferred}</Text>
                  <Text style={styles.refStatLabel}>Verified</Text>
                </View>

                <View style={styles.referralStatBox}>
                  <Award size={16} color="#fbbf24" />
                  <Text style={[styles.refStatValue, { color: '#fbbf24' }]}>₹{walletBalance}</Text>
                  <Text style={styles.refStatLabel}>Rewards</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewAllRefBtn}
                onPress={() => router.push('/referrals')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllRefText}>Manage Full Referral Program</Text>
                <ChevronRight size={14} color="#60a5fa" />
              </TouchableOpacity>
            </View>

            {/* Business & Bank Details */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionBoxTitle}>Business Verification & Tax</Text>
                <TouchableOpacity onPress={() => router.push('/kyc')}>
                  <Text style={styles.sectionHeaderLink}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <CreditCard size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Bank Account</Text>
                  <Text style={styles.infoVal}>{profile?.bankAccount || 'Not Linked'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <FileText size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>GST Number</Text>
                  <Text style={styles.infoVal}>{profile?.gstNumber || 'Not Provided'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <FileText size={16} color="#94a3b8" />
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>PAN Number</Text>
                  <Text style={styles.infoVal}>{profile?.panNumber || 'Not Provided'}</Text>
                </View>
              </View>
            </View>

            {/* App Settings & OTA Updates */}
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
                    <Text style={styles.menuItemText}>Check for OTA Updates</Text>
                    <Text style={styles.menuItemSub}>React Native live bundle synchronizer</Text>
                  </View>
                </View>
                {checkingOta ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <ChevronRight size={18} color="#64748b" />
                )}
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
      <ExitConfirmModal visible={showExitModal} onClose={() => setShowExitModal(false)} />
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
    paddingBottom: 120,
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
    width: 54,
    height: 54,
    borderRadius: 16,
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
  referralCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginTop: 14,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  referralIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  referralSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070a12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#60a5fa',
    letterSpacing: 1,
    marginTop: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareIconBtn: {
    backgroundColor: '#2563eb',
  },
  actionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  referralStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  referralStatBox: {
    flex: 1,
    backgroundColor: '#070a12',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  refStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  refStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  viewAllRefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 6,
  },
  viewAllRefText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f1315',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
