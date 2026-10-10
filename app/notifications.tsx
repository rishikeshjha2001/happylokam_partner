import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Gift,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import CustomAlert from '../components/CustomAlert';

interface NotificationItem {
  id: string;
  type: 'BOOKING' | 'APPROVAL' | 'REFERRAL' | 'SYSTEM';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'BOOKING',
    title: 'New Booking Request! 🎉',
    message: 'Pooja Reddy requested a booking for Grand Royal Ballroom on 18 Oct 2026 (₹92,250).',
    time: '10 mins ago',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'REFERRAL',
    title: 'Referral Bonus Credited! 💰',
    message: '₹500 referral reward added to your wallet for referring Royal Caterers.',
    time: '2 hours ago',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'APPROVAL',
    title: 'Service Approved by Admin ✅',
    message: 'Your service "Deluxe Multi-Cuisine Catering" has been verified and is now live.',
    time: 'Yesterday',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'SYSTEM',
    title: 'Welcome to Happylokam Partner 🚀',
    message: 'Complete your business KYC and GST verification to unlock higher booking visibility.',
    time: '3 days ago',
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const filtered = notifications.filter((n) => (filter === 'UNREAD' ? !n.isRead : true));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    setAlertConfig({
      visible: true,
      title: 'All Caught Up! ✨',
      message: 'All notifications have been marked as read.',
    });
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BOOKING':
        return <CalendarCheck size={20} color="#60a5fa" />;
      case 'REFERRAL':
        return <Gift size={20} color="#34d399" />;
      case 'APPROVAL':
        return <CheckCircle2 size={20} color="#fbbf24" />;
      default:
        return <Sparkles size={20} color="#a78bfa" />;
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
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All updates are read'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'UNREAD' && styles.filterChipActive]}
          onPress={() => setFilter('UNREAD')}
        >
          <Text style={[styles.filterText, filter === 'UNREAD' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You are all caught up with your business activity.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              onPress={() => {
                setNotifications(
                  notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                if (item.type === 'BOOKING') router.push('/(tabs)/bookings');
                else if (item.type === 'REFERRAL') router.push('/referrals');
                else if (item.type === 'APPROVAL') router.push('/(tabs)/services');
              }}
            >
              <View style={styles.iconBox}>{getIcon(item.type)}</View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <View style={styles.cardFooter}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type="success"
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  markReadText: { fontSize: 12, fontWeight: '700', color: '#60a5fa' },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#161d2d',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterTextActive: { color: '#ffffff', fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { paddingVertical: 80, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 260 },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1c2438',
    gap: 14,
  },
  notifCardUnread: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#161f33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8' },
  cardMessage: { fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  timeText: { fontSize: 11, color: '#64748b' },
});
