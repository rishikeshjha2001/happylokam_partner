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
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  User,
  MapPin,
  DollarSign,
  Filter,
  CheckCheck,
  Ban,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerBooking } from '../../services/partnerDatabase';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import CustomAlert, { CustomAlertOptions } from '../../components/CustomAlert';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PartnerBooking[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
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

  const fetchBookings = useCallback(async () => {
    try {
      const session = await PartnerDatabase.getSession();
      if (!session) return;

      // Load cached bookings first
      const cached = await PartnerDatabase.getBookings();
      if (cached.length > 0) {
        setBookings(cached);
      } else {
        setBookings([]);
      }

      // Fetch from API with timeout
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${PARTNER_API}/bookings`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBookings(json.data);
          await PartnerDatabase.saveBookings(json.data);
        }
      } catch (netErr) {
        // Offline fallback
      }
    } catch (e) {
      console.log('Error in fetchBookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === activeFilter));
    }
  }, [bookings, activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleUpdateStatus = async (id: string, newStatus: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    const actionLabel = newStatus === 'CONFIRMED' ? 'accept' : newStatus === 'COMPLETED' ? 'complete' : 'decline';

    setAlertConfig({
      type: newStatus === 'CANCELLED' ? 'warning' : 'confirm',
      title: `Confirm Action`,
      message: `Are you sure you want to ${actionLabel} this customer reservation?`,
      confirmText: 'Yes, Proceed',
      cancelText: 'Back',
      onConfirm: async () => {
        try {
          setActionLoadingId(id);
          const session = await PartnerDatabase.getSession();
          if (session) {
            try {
              const res = await fetch(`${PARTNER_API}/bookings/${id}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.token}`,
                },
                body: JSON.stringify({ status: newStatus }),
              });
              const json = await res.json();
              if (json.success) {
                fetchBookings();
                return;
              }
            } catch (e) {}
          }

          // Local update fallback
          const updated = bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
          setBookings(updated);
          await PartnerDatabase.saveBookings(updated);

          setAlertConfig({
            type: 'success',
            title: 'Booking Updated',
            message: `Reservation status changed to ${newStatus}.`,
            confirmText: 'Done',
          });
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) {
      setAlertConfig({
        type: 'info',
        title: 'Phone Unavailable',
        message: 'Customer phone number is not available for this record.',
      });
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenBookingDetails = (id: string) => {
    router.push({
      pathname: '/booking-details',
      params: { id },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          bg: '#052e16',
          text: '#4ade80',
          border: '#15803d',
          label: 'Confirmed',
          icon: <CheckCircle size={12} color="#4ade80" />,
        };
      case 'COMPLETED':
        return {
          bg: '#1e1b4b',
          text: '#818cf8',
          border: '#4338ca',
          label: 'Completed',
          icon: <CheckCheck size={12} color="#818cf8" />,
        };
      case 'CANCELLED':
        return {
          bg: '#450a0a',
          text: '#f87171',
          border: '#b91c1c',
          label: 'Cancelled',
          icon: <XCircle size={12} color="#f87171" />,
        };
      default:
        return {
          bg: '#422006',
          text: '#fbbf24',
          border: '#b45309',
          label: 'Pending Approval',
          icon: <Clock size={12} color="#fbbf24" />,
        };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Customer Bookings</Text>
          <Text style={styles.headerSub}>Manage your event reservations & clients</Text>
        </View>
        
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => {
            const isSelected = activeFilter === f;
            const count = f === 'ALL' ? bookings.length : bookings.filter((b) => b.status === f).length;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loaderText}>Loading bookings...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={52} color="#334155" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'ALL'
                ? "You haven't received any customer bookings yet. They will appear here once customers book your services."
                : `There are no ${activeFilter.toLowerCase()} bookings at the moment.`}
            </Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const badge = getStatusBadge(b.status);
            const isPending = b.status === 'PENDING';
            const isConfirmed = b.status === 'CONFIRMED';
            const isActionLoading = actionLoadingId === b.id;

            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingCard}
                activeOpacity={0.9}
                onPress={() => handleOpenBookingDetails(b.id)}
              >
                {/* Top Row: Customer Info & Status */}
                <View style={styles.cardTop}>
                  <View style={styles.customerInfo}>
                    <View style={styles.avatar}>
                      <User size={18} color="#93c5fd" />
                    </View>
                    <View>
                      <Text style={styles.customerName}>{b.user?.name || 'Customer'}</Text>
                      <Text style={styles.bookingDate}>
                        📅 {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    {badge.icon}
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Details Box */}
                <View style={styles.detailsBox}>
                  {b.venue?.name ? (
                    <View style={styles.detailRow}>
                      <MapPin size={14} color="#94a3b8" />
                      <Text style={styles.detailText}>{b.venue.name}</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <DollarSign size={14} color="#60a5fa" />
                    <Text style={styles.priceText}>
                      ₹{b.totalAmount.toLocaleString('en-IN')}{' '}
                      <Text style={styles.paymentStatusText}>
                        ({b.paymentStatus || 'Advance Verified'})
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {b.user?.phone ? (
                    <TouchableOpacity
                      style={styles.callBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCallCustomer(b.user?.phone)}
                    >
                      <Phone size={13} color="#60a5fa" />
                      <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    activeOpacity={0.8}
                    onPress={() => handleOpenBookingDetails(b.id)}
                  >
                    <Text style={styles.detailsBtnText}>View Details</Text>
                    <ChevronRight size={13} color="#94a3b8" />
                  </TouchableOpacity>

                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#3b82f6" style={{ marginLeft: 12 }} />
                  ) : (
                    <>
                      {isPending ? (
                        <>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnConfirm]}
                            onPress={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                          >
                            <CheckCircle size={13} color="#ffffff" />
                            <Text style={styles.btnActionText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnReject]}
                            onPress={() => handleUpdateStatus(b.id, 'CANCELLED')}
                          >
                            <Ban size={13} color="#f87171" />
                            <Text style={[styles.btnActionText, { color: '#f87171' }]}>Decline</Text>
                          </TouchableOpacity>
                        </>
                      ) : null}

                      {isConfirmed ? (
                        <TouchableOpacity
                          style={[styles.btnAction, styles.btnComplete]}
                          onPress={() => handleUpdateStatus(b.id, 'COMPLETED')}
                        >
                          <CheckCheck size={13} color="#ffffff" />
                          <Text style={styles.btnActionText}>Complete</Text>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Exit Modal & Custom Alert */}
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
  headerWalletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#3b82f640',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  headerWalletText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60a5fa',
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: '#070a12',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
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
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  bookingCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  bookingDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBox: {
    backgroundColor: '#070a12',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60a5fa',
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 14,
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 'auto',
  },
  callBtnText: {
    fontSize: 12,
    color: '#60a5fa',
    fontWeight: '600',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnConfirm: {
    backgroundColor: '#16a34a',
  },
  btnReject: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  btnComplete: {
    backgroundColor: '#4f46e5',
  },
  btnActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});
