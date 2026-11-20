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
  Linking,
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
  Sparkles,
  Calendar,
  Users,
  Utensils,
  Phone,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerSession, DashboardStats, PartnerBooking } from '../../services/partnerDatabase';
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
  const [recentBookings, setRecentBookings] = useState<PartnerBooking[]>([]);
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

      // 1. Instant live stats directly from local database
      const liveStats = await PartnerDatabase.getLiveDashboardStats();
      const allBookings = await PartnerDatabase.getBookings();
      setStats(liveStats);
      setRecentBookings(allBookings.slice(0, 6));

      // Fast network fetch if live to sync server data
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${PARTNER_API}/dashboard`, {
          headers: { Authorization: `Bearer ${s.token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.stats && (json.data.stats.totalBookings > 0 || liveStats.totalBookings === 0)) {
            setStats(json.data.stats);
          }
          if (Array.isArray(json.data.recentBookings) && json.data.recentBookings.length > 0) {
            const combined = [...json.data.recentBookings, ...allBookings];
            const dedupMap = new Map();
            combined.forEach((b: any) => { if (b?.id) dedupMap.set(b.id, b); });
            setRecentBookings(Array.from(dedupMap.values()).slice(0, 6));
          }
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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

        {/* Next Upcoming Celebration Schedule Card */}
        {(() => {
          const upcomingBooking = recentBookings.find((b: any) => {
            const status = (b.status || '').toUpperCase();
            return status === 'CONFIRMED' || status === 'PENDING' || status === 'CHECKED_IN';
          }) || (recentBookings.length > 0 ? recentBookings[0] : null);

          if (!upcomingBooking) return null;

          const totalPlates = upcomingBooking.platesCount || ((upcomingBooking.vegPlatesCount || 0) + (upcomingBooking.nonVegPlatesCount || 0));

          return (
            <View style={styles.upcomingCelebrationCard}>
              <View style={styles.upcomingHeaderRow}>
                <View style={styles.upcomingTagBadge}>
                  <Sparkles size={11} color="#f43f5e" />
                  <Text style={styles.upcomingTagBadgeText}>NEXT UPCOMING CELEBRATION</Text>
                </View>
                <View style={styles.upcomingDateBadge}>
                  <Calendar size={12} color="#38bdf8" />
                  <Text style={styles.upcomingDateBadgeText}>
                    {upcomingBooking.bookingDate || upcomingBooking.date || 'Scheduled'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/booking-details', params: { id: upcomingBooking.id } })}
              >
                <Text style={styles.upcomingTitle} numberOfLines={1}>
                  {upcomingBooking.serviceName || upcomingBooking.venue?.name || 'Celebration Event'}
                </Text>
                <Text style={styles.upcomingCustomer}>
                  Customer: <Text style={{ color: '#ffffff', fontWeight: '800' }}>{upcomingBooking.customerName || upcomingBooking.user?.name || 'Celebration Guest'}</Text>
                </Text>

                {/* Badges Row: Celebration Theme & Attendance */}
                <View style={styles.upcomingMetaRow}>
                  <View style={styles.upcomingMetaPill}>
                    <Text style={styles.upcomingMetaPillText}>
                      🎉 {upcomingBooking.celebrationType?.replace(/_/g, ' ') || 'CELEBRATION'}
                    </Text>
                  </View>
                  <View style={styles.upcomingMetaPill}>
                    <Users size={12} color="#60a5fa" />
                    <Text style={styles.upcomingMetaPillText}>
                      {upcomingBooking.guestCount || 50} Guests
                    </Text>
                  </View>
                  {Boolean(totalPlates) && (
                    <View style={styles.upcomingMetaPill}>
                      <Utensils size={12} color="#4ade80" />
                      <Text style={styles.upcomingMetaPillText}>
                        {totalPlates} Plates
                      </Text>
                    </View>
                  )}
                  <View style={[styles.upcomingMetaPill, { borderColor: '#38bdf8' }]}>
                    <Text style={[styles.upcomingMetaPillText, { color: '#38bdf8' }]}>
                      {upcomingBooking.bookingDays ? `${upcomingBooking.bookingDays} Day(s)` : 'Full Event'}
                    </Text>
                  </View>
                </View>

                {/* Veg vs Non-Veg Plates Banner */}
                {Boolean((upcomingBooking.vegPlatesCount && upcomingBooking.vegPlatesCount > 0) || (upcomingBooking.nonVegPlatesCount && upcomingBooking.nonVegPlatesCount > 0)) && (
                  <View style={styles.upcomingPlatesSplitRow}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#4ade80' }}>
                      🟢 {upcomingBooking.vegPlatesCount || 0} Veg Plates
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#f87171' }}>
                      🔴 {upcomingBooking.nonVegPlatesCount || 0} Non-Veg Plates
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#38bdf8' }}>
                      ₹{(upcomingBooking.totalAmount || upcomingBooking.baseAmount || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Quick Contact & Details CTA */}
              <View style={styles.upcomingActionRow}>
                <TouchableOpacity
                  style={styles.upcomingCallBtn}
                  onPress={() => {
                    const phone = upcomingBooking.customerPhone || upcomingBooking.user?.phone;
                    if (phone) Linking.openURL(`tel:${phone}`);
                  }}
                >
                  <Phone size={13} color="#ffffff" />
                  <Text style={styles.upcomingCallBtnText}>Call Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.upcomingWaBtn}
                  onPress={() => {
                    const rawPhone = upcomingBooking.customerPhone || upcomingBooking.user?.phone;
                    const phone = rawPhone?.replace(/[^0-9]/g, '');
                    if (phone) {
                      const msg = encodeURIComponent(`Hello ${upcomingBooking.customerName || upcomingBooking.user?.name || 'Customer'}, regarding your upcoming event for ${upcomingBooking.serviceName || 'happylokam Service'} on ${upcomingBooking.bookingDate || upcomingBooking.date}...`);
                      Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
                    }
                  }}
                >
                  <MessageSquare size={13} color="#22c55e" />
                  <Text style={styles.upcomingWaBtnText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.upcomingDetailBtn}
                  onPress={() => router.push({ pathname: '/booking-details', params: { id: upcomingBooking.id } })}
                >
                  <Text style={styles.upcomingDetailBtnText}>View Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

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
        ) : recentBookings.map((b: any) => {
          const totalPlates = b.platesCount || ((b.vegPlatesCount || 0) + (b.nonVegPlatesCount || 0));
          return (
            <TouchableOpacity
              key={b.id}
              style={styles.bookingCard}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/booking-details', params: { id: b.id } })}
            >
              <View style={styles.bookingLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={styles.bookingCustomer}>{b.customerName || b.user?.name || 'Customer'}</Text>
                  {b.celebrationType ? (
                    <View style={styles.miniCelebPill}>
                      <Text style={styles.miniCelebPillText}>
                        {b.celebrationType.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.bookingVenue}>{b.serviceName || b.venue?.name || 'Celebration Service'}</Text>
                <Text style={styles.bookingDate}>
                  📅 Event: {b.bookingDate || b.date || new Date(b.createdAt).toLocaleDateString('en-IN')}
                  {totalPlates ? ` • ${totalPlates} Plates` : (b.guestCount ? ` • ${b.guestCount} Guests` : '')}
                </Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>₹{(b.totalAmount || b.baseAmount || 0).toLocaleString('en-IN')}</Text>
                <View
                  style={[
                    styles.bookingStatusPill,
                    {
                      backgroundColor:
                        b.status === 'CONFIRMED'
                          ? 'rgba(52,211,153,0.15)'
                          : b.status === 'COMPLETED'
                          ? 'rgba(96,165,250,0.15)'
                          : 'rgba(251,191,36,0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bookingStatusText,
                      {
                        color:
                          b.status === 'CONFIRMED'
                            ? '#34d399'
                            : b.status === 'COMPLETED'
                            ? '#60a5fa'
                            : '#fbbf24',
                      },
                    ]}
                  >
                    {b.status || 'PENDING'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

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
  bookingLeft: { flex: 1, paddingRight: 8 },
  bookingCustomer: { fontSize: 15, fontWeight: '700', color: '#e2e8f0' },
  bookingVenue: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bookingDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  bookingRight: { alignItems: 'flex-end' },
  bookingAmount: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  bookingStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  bookingStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  upcomingCelebrationCard: {
    backgroundColor: '#0c1527',
    borderWidth: 1.5,
    borderColor: '#1d4ed8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  upcomingTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  upcomingTagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 0.5,
  },
  upcomingDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingDateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  upcomingCustomer: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  upcomingMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#131e36',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  upcomingMetaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  upcomingPlatesSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#070b14',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  upcomingActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upcomingCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    borderRadius: 8,
  },
  upcomingCallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  upcomingWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingVertical: 9,
    borderRadius: 8,
  },
  upcomingWaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
  },
  upcomingDetailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  miniCelebPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniCelebPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
});
