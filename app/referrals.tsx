import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Gift,
  Copy,
  Share2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  QrCode,
  IndianRupee,
  CalendarCheck,
  ExternalLink,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';
import { PARTNER_API } from '../constants/api';

interface ReferredPartner {
  id: string;
  name: string;
  category: string;
  joinedDate: string;
  status: 'VERIFIED' | 'PENDING';
  reward: number;
}

interface ReferralBooking {
  id: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

export default function ReferralsScreen() {
  const [code, setCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [referrals, setReferrals] = useState<ReferredPartner[]>([]);
  const [bookings, setBookings] = useState<ReferralBooking[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [bookingRevenue, setBookingRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const loadReferrals = async () => {
    try {
      const session = await PartnerDatabase.getSession();
      if (!session?.token) {
        setLoading(false);
        return;
      }

      const partnerCode = session.referralCode || `HLP-${session.hlpId.replace(/[^a-zA-Z0-9]/g, '')}`;
      setCode(partnerCode);
      const link = `https://happylokam.com/partner/signup?ref=${partnerCode}`;
      setReferralLink(link);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`);

      const res = await fetch(`${PARTNER_API}/referrals`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setCode(d.referralCode || partnerCode);
          setReferralLink(d.referralLink || link);
          if (d.qrCodeUrl) setQrCodeUrl(d.qrCodeUrl);
          setReferrals(d.referredPartners || []);
          setBookings(d.referralBookings || []);
          setWalletBalance(d.walletBalance || 0);
          setTotalEarnings(d.referralBonusEarned || 0);
          setBookingRevenue(d.bookingRevenueGenerated || 0);
        }
      }
    } catch (e) {
      console.error('Error loading referrals:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const totalBonusEarned = referrals
    .filter((r) => r.status === 'VERIFIED')
    .reduce((sum, r) => sum + r.reward, 0);

  const handleCopyLink = async () => {
    try {
      await Share.share({
        title: 'HappyLokam Partner Invite Link',
        message: referralLink,
      });
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Referral Link Copied! 🔗',
        message: `Your referral link has been copied.`,
      });
    } catch (e) {}
  };

  const handleCopyCode = async () => {
    try {
      await Share.share({
        title: 'HappyLokam Partner Referral Code',
        message: code,
      });
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Referral Code Copied! 📋',
        message: `Your code ${code} is ready to share.`,
      });
    } catch (e) {}
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Join HappyLokam Partner Network',
        message: `🚀 Grow your event bookings and venue rentals on HappyLokam!\n\nUse my partner invite code: *${code}*\n\n👉 Sign up here: ${referralLink}`,
      });
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Referral & QR</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
          <Share2 size={18} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReferrals();
            }}
            tintColor="#2563eb"
          />
        }
      >
        {/* Referral QR Code Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.qrHeaderRow}>
            <View style={styles.heroIconBox}>
              <QrCode size={24} color="#60a5fa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Your Referral QR Code</Text>
              <Text style={styles.heroSub}>Scan or share to invite partners & customers</Text>
            </View>
          </View>

          {/* QR Box */}
          <View style={styles.qrWrapper}>
            {qrCodeUrl ? (
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            )}
            <View style={styles.qrBadge}>
              <ShieldCheck size={14} color="#34d399" />
              <Text style={styles.qrBadgeText}>VERIFIED PARTNER QR</Text>
            </View>
          </View>

          {/* Referral Code Box */}
          <View style={styles.codeContainer}>
            <View>
              <Text style={styles.codeLabel}>YOUR INVITE CODE</Text>
              <Text style={styles.codeText}>{code || 'HLP-PRO-8923'}</Text>
            </View>
            <View style={styles.codeActionRow}>
              <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8} onPress={handleCopyCode}>
                <Copy size={16} color="#60a5fa" />
                <Text style={styles.copyBtnText}>Copy Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare}>
                <Share2 size={16} color="#ffffff" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Direct Link Box */}
          <TouchableOpacity style={styles.linkBox} activeOpacity={0.8} onPress={handleCopyLink}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>DIRECT REGISTRATION LINK</Text>
              <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
            </View>
            <ExternalLink size={16} color="#60a5fa" />
          </TouchableOpacity>
        </View>

        {/* Stats 4-Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Users size={18} color="#60a5fa" />
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Invited Partners</Text>
          </View>

          <View style={styles.statBox}>
            <CheckCircle2 size={18} color="#34d399" />
            <Text style={styles.statValue}>
              {referrals.filter((r) => r.status === 'VERIFIED').length}
            </Text>
            <Text style={styles.statLabel}>Verified Partners</Text>
          </View>

          <View style={styles.statBox}>
            <TrendingUp size={18} color="#fbbf24" />
            <Text style={styles.statValue}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Bonus Credited</Text>
          </View>

          <View style={styles.statBox}>
            <CalendarCheck size={18} color="#c084fc" />
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Code Bookings</Text>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howSection}>
          <Text style={styles.sectionTitle}>How Referral Program Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Share QR Code or Link</Text>
              <Text style={styles.stepDesc}>Send your unique QR code or link to fellow caterers, venues & decorators.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Vendor Signs Up</Text>
              <Text style={styles.stepDesc}>They register on HappyLokam using your referral code.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Earn ₹500 Bonus</Text>
              <Text style={styles.stepDesc}>₹500 is directly credited to your HappyLokam Wallet on verification.</Text>
            </View>
          </View>
        </View>

        {/* Referred Partners List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Referred Partners ({referrals.length})</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ marginVertical: 20 }} />
        ) : referrals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Users size={32} color="#475569" />
            <Text style={styles.emptyTitle}>No partners registered yet</Text>
            <Text style={styles.emptySub}>Share your invite code or QR code to earn ₹500 for every vendor who joins!</Text>
          </View>
        ) : (
          referrals.map((item) => (
            <View key={item.id} style={styles.partnerCard}>
              <View style={styles.partnerIconBox}>
                <Users size={20} color="#94a3b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>{item.name}</Text>
                <Text style={styles.partnerCat}>{item.category} • Joined {item.joinedDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rewardText}>+₹{item.reward}</Text>
                <View
                  style={[
                    styles.partnerBadge,
                    {
                      backgroundColor:
                        item.status === 'VERIFIED'
                          ? 'rgba(52, 211, 153, 0.12)'
                          : 'rgba(251, 191, 36, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.partnerBadgeText,
                      { color: item.status === 'VERIFIED' ? '#34d399' : '#fbbf24' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Customer Bookings via Code List */}
        {bookings.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Customer Bookings via Code ({bookings.length})</Text>
            </View>

            {bookings.map((b) => (
              <View key={b.id} style={styles.partnerCard}>
                <View style={[styles.partnerIconBox, { backgroundColor: 'rgba(192, 132, 252, 0.15)' }]}>
                  <CalendarCheck size={20} color="#c084fc" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{b.customerName}</Text>
                  <Text style={styles.partnerCat}>Booked on {b.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rewardText, { color: '#ffffff' }]}>₹{(b.amount || 0).toLocaleString('en-IN')}</Text>
                  <View style={[styles.partnerBadge, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                    <Text style={[styles.partnerBadgeText, { color: '#34d399' }]}>{b.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
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
  heroCard: {
    backgroundColor: '#0d1117',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#ffffff' },
  heroSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    alignSelf: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  qrImage: {
    width: 190,
    height: 190,
    borderRadius: 12,
  },
  qrLoadingBox: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  qrBadgeText: { fontSize: 10, fontWeight: '800', color: '#34d399', letterSpacing: 0.8 },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  codeText: { fontSize: 18, fontWeight: '900', color: '#60a5fa', letterSpacing: 1.2, marginTop: 2 },
  codeActionRow: { flexDirection: 'row', gap: 6 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161f30',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222f47',
  },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: '#60a5fa' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0e17',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  linkLabel: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 0.6 },
  linkText: { fontSize: 12, fontWeight: '600', color: '#93c5fd', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statBox: {
    width: '48%',
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1c2438',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  howSection: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1c2438',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 14 },
  sectionHeader: { marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  stepDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2, lineHeight: 16 },
  emptyCard: {
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1c2438',
    gap: 8,
    marginVertical: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1c2438',
    gap: 12,
  },
  partnerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#161f30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  partnerCat: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  rewardText: { fontSize: 14, fontWeight: '800', color: '#34d399' },
  partnerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  partnerBadgeText: { fontSize: 10, fontWeight: '700' },
});
