import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
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
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';

interface ReferredPartner {
  id: string;
  name: string;
  category: string;
  joinedDate: string;
  status: 'VERIFIED' | 'PENDING';
  reward: number;
}

const SAMPLE_REFERRED: ReferredPartner[] = [
  {
    id: 'ref-1',
    name: 'Elite Decorators & Florists',
    category: 'Decoration',
    joinedDate: '01 Oct 2026',
    status: 'VERIFIED',
    reward: 500,
  },
  {
    id: 'ref-2',
    name: 'Royal Heritage Caterers',
    category: 'Catering',
    joinedDate: '28 Sep 2026',
    status: 'VERIFIED',
    reward: 500,
  },
  {
    id: 'ref-3',
    name: 'Pixel Perfect Photography',
    category: 'Photography',
    joinedDate: '20 Sep 2026',
    status: 'VERIFIED',
    reward: 500,
  },
  {
    id: 'ref-4',
    name: 'SoundWaves DJ & Lights',
    category: 'DJ & Music',
    joinedDate: 'Yesterday',
    status: 'PENDING',
    reward: 500,
  },
];

export default function ReferralsScreen() {
  const [code, setCode] = useState('HLPROYAL89');
  const [referrals, setReferrals] = useState<ReferredPartner[]>(SAMPLE_REFERRED);
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

  useEffect(() => {
    (async () => {
      const session = await PartnerDatabase.getSession();
      if (session?.referralCode) setCode(session.referralCode);
    })();
  }, []);

  const totalBonusEarned = referrals
    .filter((r) => r.status === 'VERIFIED')
    .reduce((sum, r) => sum + r.reward, 0);

  const handleCopy = async () => {
    try {
      await Share.share({
        title: 'Partner Referral Code',
        message: code,
      });
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Referral Code Copied! 📋',
        message: `Your code ${code} is ready to share with your business network.`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://happylokam.com/partner/signup?ref=${code}`;
      await Share.share({
        title: 'Join Happylokam Partner Network',
        message: `Hey! Grow your event bookings and venue rentals on Happylokam. Use my partner invite code: ${code}\nSign up here: ${shareUrl}`,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Referral Program</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Referral Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Gift size={28} color="#60a5fa" />
          </View>
          <Text style={styles.heroTitle}>Invite Partners & Earn ₹500</Text>
          <Text style={styles.heroSub}>
            Every time a venue, caterer, decorator, or photographer registers with your invite code, you receive ₹500 in your wallet after their first verification.
          </Text>

          {/* Referral Code Box */}
          <View style={styles.codeContainer}>
            <View>
              <Text style={styles.codeLabel}>YOUR UNIQUE PARTNER CODE</Text>
              <Text style={styles.codeText}>{code}</Text>
            </View>
            <View style={styles.codeActionRow}>
              <TouchableOpacity style={styles.copyBtn} activeOpacity={0.8} onPress={handleCopy}>
                <Copy size={16} color="#60a5fa" />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare}>
                <Share2 size={16} color="#ffffff" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Users size={18} color="#60a5fa" />
            <Text style={styles.statValue}>{referrals.length}</Text>
            <Text style={styles.statLabel}>Total Invited</Text>
          </View>
          <View style={styles.statBox}>
            <CheckCircle2 size={18} color="#34d399" />
            <Text style={styles.statValue}>
              {referrals.filter((r) => r.status === 'VERIFIED').length}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp size={18} color="#fbbf24" />
            <Text style={styles.statValue}>₹{totalBonusEarned}</Text>
            <Text style={styles.statLabel}>Bonus Earned</Text>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Share your Partner Code</Text>
              <Text style={styles.stepDesc}>Send your invite link to fellow event vendors & venues.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Vendor Registers</Text>
              <Text style={styles.stepDesc}>They create an account entering your referral code.</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Earn ₹500 Bonus</Text>
              <Text style={styles.stepDesc}>₹500 is directly credited to your Happylokam Wallet.</Text>
            </View>
          </View>
        </View>

        {/* Referred Partners List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Invited Partners ({referrals.length})</Text>
        </View>

        {referrals.map((item) => (
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
        ))}
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
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  heroSub: { fontSize: 13, color: '#94a3b8', marginTop: 6, lineHeight: 19 },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  codeLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  codeText: { fontSize: 22, fontWeight: '900', color: '#60a5fa', letterSpacing: 1.5, marginTop: 2 },
  codeActionRow: { flexDirection: 'row', gap: 8 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161f30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222f47',
  },
  copyBtnText: { fontSize: 13, fontWeight: '700', color: '#60a5fa' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1,
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
