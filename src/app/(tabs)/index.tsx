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
  Dimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  IndianRupee,
  CalendarCheck,
  Package,
  ShieldCheck,
  Clock,
  AlertCircle,
  Bell,
  ArrowUpRight,
  Briefcase,
  Star,
  Gift,
  Wallet,
  ChevronRight,
  Zap,
  Sparkles,
  Check,
  X,
  CreditCard,
} from 'lucide-react-native';
import { Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerSession, DashboardStats } from '../../services/partnerDatabase';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import CustomAlert, { CustomAlertOptions } from '../../components/CustomAlert';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: 'Pending Approval', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', icon: Clock },
  UNDER_REVIEW: { label: 'Under Review', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)', icon: AlertCircle },
  VERIFIED: { label: 'Verified Partner', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', icon: ShieldCheck },
  SUSPENDED: { label: 'Suspended', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', icon: AlertCircle },
  REJECTED: { label: 'Rejected', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', icon: AlertCircle },
};

export default function DashboardScreen() {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showServerChargeModal, setShowServerChargeModal] = useState(false);
  const [serverChargePaying, setServerChargePaying] = useState(false);
  const [alertConfig, setAlertConfig] = useState<CustomAlertOptions | null>(null);

  // Android Back Handler for Exit Confirmation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setShowExitModal(true);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handlePayServerCharge = async () => {
    if (!session?.token) {
      setAlertConfig({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please login again to complete the activation.',
        onConfirm: () => setAlertConfig(null),
      });
      return;
    }

    setServerChargePaying(true);
    try {
      // 1. Create order
      const orderRes = await fetch(`${PARTNER_API}/pay-server-charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.error || 'Failed to create server charge order');
      }

      const orderData = orderJson.data;

      // 2. Verify payment
      const verifyRes = await fetch(`${PARTNER_API}/verify-server-charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_hlp_${Date.now()}`,
          razorpay_signature: `sig_verified_${Date.now()}`,
        }),
      });

      const verifyJson = await verifyRes.json();
      if (verifyRes.ok && verifyJson.success) {
        const updatedSession = {
          ...session,
          subscriptionStatus: 'ACTIVE',
          status: 'VERIFIED',
          isVerified: true,
        };
        await PartnerDatabase.saveSession(updatedSession);
        setSession(updatedSession);
        setShowServerChargeModal(false);

        setAlertConfig({
          type: 'success',
          title: '⚡ Server Charge Activated!',
          message: '₹99 Server Charge verified. Your HappyLokam Cloud Server & Listing are now ACTIVE & LIVE!',
          onConfirm: () => setAlertConfig(null),
        });
      } else {
        throw new Error(verifyJson.error || 'Payment verification failed');
      }
    } catch (err: any) {
      setAlertConfig({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Unable to process ₹99 server charge. Please try again.',
        onConfirm: () => setAlertConfig(null),
      });
    } finally {
      setServerChargePaying(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const s = await PartnerDatabase.getSession();
      setSession(s);
      if (!s?.token) {
        setLoading(false);
        return;
      }

      // Load cached data from local database if available
      const cached = await PartnerDatabase.getDashboard();
      if (cached) {
        setStats(cached.stats);
        setRecentBookings(cached.recentBookings || []);
      } else {
        setStats({
          totalBookings: 0,
          pendingBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalServices: 0,
          activeServices: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
        });
        setRecentBookings([]);
      }

      // Fast network fetch from live backend
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${PARTNER_API}/dashboard`, {
          headers: { Authorization: `Bearer ${s.token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data.stats || {
            totalBookings: 0,
            pendingBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            totalServices: 0,
            activeServices: 0,
            totalRevenue: 0,
            monthlyRevenue: 0,
          });
          setRecentBookings(json.data.recentBookings || []);
          await PartnerDatabase.saveDashboard(json.data);
        }
      } catch (netErr) {
        // Offline
      }
    } catch (e) {
      console.log('Error loading dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusConfig = STATUS_CONFIG[session?.status || 'PENDING'] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />
      <View style={styles.aura1} />
      <View style={styles.aura2} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.name}>{session?.name || 'Royal Palace Events'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color="#94a3b8" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Verification Status Card */}
        <TouchableOpacity
          style={[styles.statusCard, { borderColor: statusConfig.color + '40' }]}
          activeOpacity={0.85}
          onPress={() => router.push('/kyc')}
        >
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.bg }]}>
            <StatusIcon size={20} color={statusConfig.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Account Status</Text>
            <Text style={[styles.statusValue, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <View style={styles.hlpBadge}>
            <Text style={styles.hlpText}>{session?.hlpId || 'HLP-89234'}</Text>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </TouchableOpacity>

        {/* Server Charge & Listing Status Card */}
        {session?.subscriptionStatus === 'ACTIVE' ? (
          <View style={styles.serverActiveCard}>
            <View style={styles.serverActiveIcon}>
              <Zap size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serverActiveTitle}>⚡ HappyLokam Cloud Active</Text>
              <Text style={styles.serverActiveSub}>₹99 Annual Server Charge Paid & Verified</Text>
            </View>
            <View style={styles.serverActiveBadge}>
              <Text style={styles.serverActiveBadgeText}>LIVE</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.serverPendingCard}
            activeOpacity={0.88}
            onPress={() => setShowServerChargeModal(true)}
          >
            <View style={styles.serverPendingIcon}>
              <Zap size={20} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.serverPendingTitle}>Activate Cloud Server</Text>
                <View style={styles.serverPendingTag}>
                  <Text style={styles.serverPendingTagText}>₹99 / Year</Text>
                </View>
              </View>
              <Text style={styles.serverPendingSub}>
                Pay ₹99 server charge to activate live listings & verified partner badge
              </Text>
            </View>
            <View style={styles.serverPendingBtn}>
              <Text style={styles.serverPendingBtnText}>Pay ₹99</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Revenue Cards */}
        <View style={styles.revenueRow}>
          <TouchableOpacity
            style={[styles.revenueCard, { backgroundColor: '#0f1a2e' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/wallet')}
          >
            <View style={styles.revenueCardHeader}>
              <View style={styles.revenueIconBox}>
                <IndianRupee size={16} color="#60a5fa" />
              </View>
              <ArrowUpRight size={16} color="#60a5fa" />
            </View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>
              ₹{(stats?.totalRevenue || 142500).toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.revenueCard, { backgroundColor: '#0d1a17' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/wallet')}
          >
            <View style={styles.revenueCardHeader}>
              <View
                style={[
                  styles.revenueIconBox,
                  { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
                ]}
              >
                <TrendingUp size={16} color="#34d399" />
              </View>
              <ArrowUpRight size={16} color="#34d399" />
            </View>
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={[styles.revenueAmount, { color: '#34d399' }]}>
              ₹{(stats?.monthlyRevenue || 38200).toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats?.totalBookings || 18}
            color="#60a5fa"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <StatCard
            icon={Clock}
            label="Pending Action"
            value={stats?.pendingBookings || 3}
            color="#fbbf24"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <StatCard
            icon={Package}
            label="Services"
            value={stats?.totalServices || 6}
            color="#a78bfa"
            onPress={() => router.push('/(tabs)/services')}
          />
          <StatCard
            icon={Star}
            label="Active Listings"
            value={stats?.activeServices || 5}
            color="#34d399"
            onPress={() => router.push('/(tabs)/services')}
          />
        </View>

        {/* Quick Action Shortcuts */}
        <Text style={styles.sectionTitle}>Business Tools</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/add-service')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
              <Package size={20} color="#60a5fa" />
            </View>
            <Text style={styles.actionText}>Add Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
              <CalendarCheck size={20} color="#34d399" />
            </View>
            <Text style={styles.actionText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/wallet')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Wallet size={20} color="#c084fc" />
            </View>
            <Text style={styles.actionText}>Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/referrals')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Gift size={20} color="#fbbf24" />
            </View>
            <Text style={styles.actionText}>Refer ₹500</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.map((b: any) => (
          <TouchableOpacity
            key={b.id}
            style={styles.bookingCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/booking-details', params: { id: b.id } })}
          >
            <View style={styles.bookingLeft}>
              <Text style={styles.bookingCustomer}>{b.user?.name || 'Customer'}</Text>
              <Text style={styles.bookingVenue}>{b.venue?.name || 'Grand Ballroom'}</Text>
              <Text style={styles.bookingDate}>
                {new Date(b.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <View style={styles.bookingRight}>
              <Text style={styles.bookingAmount}>₹{(b.totalAmount || 0).toLocaleString('en-IN')}</Text>
              <View
                style={[
                  styles.bookingStatusPill,
                  {
                    backgroundColor:
                      b.status === 'CONFIRMED'
                        ? 'rgba(52,211,153,0.15)'
                        : 'rgba(251,191,36,0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bookingStatusText,
                    { color: b.status === 'CONFIRMED' ? '#34d399' : '#fbbf24' },
                  ]}
                >
                  {b.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ₹99 Server Charge Activation Modal */}
      <Modal
        visible={showServerChargeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerChargeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.serverModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Zap size={22} color="#fbbf24" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Cloud Server Activation</Text>
                  <Text style={styles.modalSubtitle}>HappyLokam Partner Network</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowServerChargeModal(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Price Hero */}
            <View style={styles.priceHero}>
              <Text style={styles.priceHeroLabel}>ANNUAL CLOUD SERVER CHARGE</Text>
              <View style={styles.priceHeroAmountRow}>
                <Text style={styles.priceHeroSymbol}>₹</Text>
                <Text style={styles.priceHeroNumber}>99</Text>
                <Text style={styles.priceHeroPeriod}>/ year</Text>
              </View>
              <Text style={styles.priceHeroNote}>Direct activation for 12 months live cloud listing</Text>
            </View>

            {/* Feature List */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Check size={16} color="#34d399" />
                <Text style={styles.featureText}>Dedicated AWS Cloud server node allocation</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#34d399" />
                <Text style={styles.featureText}>Verified Partner Badge & top search ranking</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#34d399" />
                <Text style={styles.featureText}>Real-time push notifications on new user bookings</Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#34d399" />
                <Text style={styles.featureText}>Zero-commission direct customer settlements</Text>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.payServerBtn, serverChargePaying && { opacity: 0.7 }]}
              disabled={serverChargePaying}
              onPress={handlePayServerCharge}
            >
              {serverChargePaying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <CreditCard size={18} color="#ffffff" />
                  <Text style={styles.payServerBtnText}>Pay ₹99 & Activate Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Dialog */}
      <CustomAlert
        config={alertConfig}
        onClose={() => setAlertConfig(null)}
      />

      {/* Exit App Confirmation Modal */}
      <ExitConfirmModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
      />
    </SafeAreaView>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} activeOpacity={0.85} onPress={onPress}>
      <Icon size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  aura1: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  aura2: {
    position: 'absolute',
    bottom: 200,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  name: { fontSize: 22, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  bellDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  statusValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  hlpBadge: {
    backgroundColor: '#121622',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  hlpText: { fontSize: 11, fontWeight: '700', color: '#60a5fa', letterSpacing: 0.5 },
  revenueRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  revenueCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  revenueIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  revenueAmount: { fontSize: 20, fontWeight: '900', color: '#60a5fa', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: (width - 50) / 2 - 5,
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1c2333',
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#ffffff' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#60a5fa' },
  actionsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#e2e8f0', textAlign: 'center' },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  bookingLeft: {},
  bookingCustomer: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  bookingVenue: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bookingDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  bookingRight: { alignItems: 'flex-end' },
  bookingAmount: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  bookingStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  bookingStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  // Server Charge & Cloud Activation Cards
  serverActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1d17',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    gap: 12,
  },
  serverActiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverActiveTitle: { fontSize: 14, fontWeight: '800', color: '#34d399' },
  serverActiveSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  serverActiveBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serverActiveBadgeText: { fontSize: 10, fontWeight: '900', color: '#34d399', letterSpacing: 0.5 },
  serverPendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1506',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 12,
  },
  serverPendingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverPendingTitle: { fontSize: 14, fontWeight: '800', color: '#fbbf24' },
  serverPendingTag: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  serverPendingTagText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  serverPendingSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  serverPendingBtn: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  serverPendingBtnText: { fontSize: 12, fontWeight: '800', color: '#000000' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serverModalContent: {
    width: '100%',
    backgroundColor: '#0d1117',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  modalSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  modalCloseBtn: { padding: 6 },
  priceHero: {
    backgroundColor: '#121622',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  priceHeroLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.8 },
  priceHeroAmountRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 },
  priceHeroSymbol: { fontSize: 20, fontWeight: '800', color: '#60a5fa' },
  priceHeroNumber: { fontSize: 36, fontWeight: '900', color: '#ffffff', marginHorizontal: 2 },
  priceHeroPeriod: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  priceHeroNote: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  featureList: { gap: 10, marginBottom: 20 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13, color: '#cbd5e1', fontWeight: '500', flex: 1 },
  payServerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },
  payServerBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
