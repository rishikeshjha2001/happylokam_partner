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
  ChevronRight,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerSession, DashboardStats } from '../../services/partnerDatabase';
import ExitConfirmModal from '../../components/ExitConfirmModal';

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

  const loadData = useCallback(async () => {
    try {
      const s = await PartnerDatabase.getSession();
      setSession(s);
      if (!s?.token) {
        setLoading(false);
        return;
      }

      // Initial empty stats
      const defaultStats: DashboardStats = {
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalServices: 0,
        activeServices: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
      };

      setStats(defaultStats);
      setRecentBookings([]);

      // Fast network fetch if live
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${PARTNER_API}/dashboard`, {
          headers: { Authorization: `Bearer ${s.token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
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
            <Text style={styles.name}>{session?.businessName || session?.name || 'Partner Account'}</Text>
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
            <Text style={styles.hlpText}>{session?.hlpId || 'HLP Pending'}</Text>
          </View>
          <ChevronRight size={16} color="#64748b" />
        </TouchableOpacity>

        {/* Revenue Cards */}
        <View style={styles.revenueRow}>
          <TouchableOpacity
            style={[styles.revenueCard, { backgroundColor: '#0f1a2e' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={styles.revenueCardHeader}>
              <View style={styles.revenueIconBox}>
                <IndianRupee size={16} color="#60a5fa" />
              </View>
              <ArrowUpRight size={16} color="#60a5fa" />
            </View>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueAmount}>
              ₹{(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.revenueCard, { backgroundColor: '#0d1a17' }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/bookings')}
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
              ₹{(stats?.monthlyRevenue ?? 0).toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={CalendarCheck}
            label="Total Bookings"
            value={stats?.totalBookings ?? 0}
            color="#60a5fa"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <StatCard
            icon={Clock}
            label="Pending Action"
            value={stats?.pendingBookings ?? 0}
            color="#fbbf24"
            onPress={() => router.push('/(tabs)/bookings')}
          />
          <StatCard
            icon={Package}
            label="Services"
            value={stats?.totalServices ?? 0}
            color="#a78bfa"
            onPress={() => router.push('/(tabs)/services')}
          />
          <StatCard
            icon={Star}
            label="Active Listings"
            value={stats?.activeServices ?? 0}
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
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Briefcase size={20} color="#c084fc" />
            </View>
            <Text style={styles.actionText}>My Services</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/referrals')}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Gift size={20} color="#fbbf24" />
            </View>
            <Text style={styles.actionText}>Refer & Earn</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length === 0 ? (
          <View style={{ backgroundColor: '#0f172a', borderRadius: 16, padding: 24, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#1e293b' }}>
            <CalendarCheck size={28} color="#64748b" />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 10 }}>No Recent Bookings</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4 }}>New customer reservations and bookings will appear here in real-time.</Text>
          </View>
        ) : recentBookings.map((b: any) => (
          <TouchableOpacity
            key={b.id}
            style={styles.bookingCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/booking-details', params: { id: b.id } })}
          >
            <View style={styles.bookingLeft}>
              <Text style={styles.bookingCustomer}>{b.user?.name || 'Customer'}</Text>
              <Text style={styles.bookingVenue}>{b.venue?.name || b.service?.name || 'Booked Service'}</Text>
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
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
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
});
