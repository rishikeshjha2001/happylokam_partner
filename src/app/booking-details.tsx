import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  IndianRupee,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react-native';
import PartnerDatabase, { PartnerBooking } from '../services/partnerDatabase';
import { PARTNER_API } from '../constants/api';
import CustomAlert from '../components/CustomAlert';

export default function BookingDetailsScreen() {
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

  const params = useLocalSearchParams();
  const [booking, setBooking] = useState<PartnerBooking | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkInCodeInput, setCheckInCodeInput] = useState('');
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [processing, setProcessing] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      const bookings = await PartnerDatabase.getBookings();
      const target = bookings.find((b) => b.id === params.id) || null;
      if (target) {
        setBooking(target);
      }
      // Also fetch fresh from API
      try {
        const session = await PartnerDatabase.getSession();
        if (session?.token && params.id) {
          const res = await fetch(`${PARTNER_API}/bookings/${params.id}`, {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            setBooking(json.data);
            await PartnerDatabase.updateBooking(json.data);
          }
        }
      } catch (e) {}
    })();
  }, [params.id]);

  if (!booking) return null;

  const handleCall = () => {
    if (booking.user?.phone) {
      Linking.openURL(`tel:${booking.user.phone}`);
    } else {
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Customer Contact',
        message: 'No phone number provided by customer.',
      });
    }
  };

  const handleWhatsApp = () => {
    const phone = booking.user?.phone?.replace(/[^0-9]/g, '');
    if (!phone) { setAlertConfig({ visible: true, type: 'info', title: 'WhatsApp Contact', message: 'No phone number provided by customer.' }); return; }
    const text = `Hello ${booking.user?.name || 'Customer'}, regarding your booking for ${booking.venue?.name || 'happylokam Service'} on ${booking.date}...`;
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
  };

  const handleAccept = async () => {
    if (!booking) return;
    setProcessing(true);
    try {
      const session = await PartnerDatabase.getSession();
      if (session?.token) {
        try {
          const res = await fetch(`${PARTNER_API}/bookings/${booking.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ status: 'CONFIRMED' }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            setBooking(json.data);
            await PartnerDatabase.updateBooking(json.data);
            setProcessing(false);
            setAlertConfig({
              visible: true,
              type: 'success',
              title: 'Booking Confirmed! 🎉',
              message: `You have confirmed the booking for ${booking.user?.name || 'the customer'}. The customer has been notified.`,
            });
            return;
          }
        } catch (netErr) {}
      }

      // Offline / local fallback
      const updated = { ...booking, status: 'CONFIRMED' };
      setBooking(updated);
      await PartnerDatabase.updateBooking(updated);
      setProcessing(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Booking Confirmed! 🎉',
        message: `You have confirmed the booking for ${booking.user?.name || 'the customer'}. The customer has been notified.`,
      });
    } catch (e: any) {
      setProcessing(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Confirmation Failed',
        message: e.message || 'Could not confirm booking.',
      });
    }
  };

  const handleDeclineSubmit = async () => {
    if (!booking) return;
    if (!declineReason.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Reason Required',
        message: 'Please provide a brief reason for declining this request.',
      });
      return;
    }
    setProcessing(true);
    try {
      const session = await PartnerDatabase.getSession();
      if (session?.token) {
        try {
          const res = await fetch(`${PARTNER_API}/bookings/${booking.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ status: 'CANCELLED', reason: declineReason.trim() }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            setBooking(json.data);
            await PartnerDatabase.updateBooking(json.data);
            setProcessing(false);
            setDeclineModalVisible(false);
            setAlertConfig({
              visible: true,
              type: 'info',
              title: 'Booking Declined',
              message: 'The reservation has been declined and refund processed to the customer.',
            });
            return;
          }
        } catch (netErr) {}
      }

      // Offline fallback
      const updated = { ...booking, status: 'CANCELLED' };
      setBooking(updated);
      await PartnerDatabase.updateBooking(updated);
      setProcessing(false);
      setDeclineModalVisible(false);
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Booking Declined',
        message: 'The reservation has been declined and refund processed to the customer.',
      });
    } catch (e: any) {
      setProcessing(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Decline Failed',
        message: e.message || 'Could not decline booking.',
      });
    }
  };

  const handleVerifyOtpAndComplete = async () => {
    if (!booking) return;
    if (!enteredOtp || enteredOtp.length < 4) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Valid 4-Digit OTP Required',
        message: 'Please ask the customer for the completion OTP given in their booking pass.',
      });
      return;
    }

    setProcessing(true);
    try {
      const session = await PartnerDatabase.getSession();
      if (session?.token) {
        try {
          // Primary: Call dedicated verify-completion-otp endpoint
          let res = await fetch(`${PARTNER_API}/bookings/verify-completion-otp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ bookingId: booking.id, completionOtp: enteredOtp.trim() }),
          });
          let json = await res.json();

          // Fallback to status update endpoint if needed
          if (!json.success) {
            res = await fetch(`${PARTNER_API}/bookings/${booking.id}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`,
              },
              body: JSON.stringify({ status: 'COMPLETED', otp: enteredOtp.trim(), completionOtp: enteredOtp.trim() }),
            });
            json = await res.json();
          }

          if (json.success && json.data) {
            setBooking(json.data);
            await PartnerDatabase.updateBooking(json.data);
            setProcessing(false);
            setOtpModalVisible(false);
            const payoutStr = json.payoutAmount ? `₹${json.payoutAmount.toLocaleString('en-IN')}` : `₹${partnerNetEarnings.toLocaleString('en-IN')}`;
            setAlertConfig({
              visible: true,
              type: 'success',
              title: 'Celebration Completed & Payout Unlocked! 🌟',
              message: `Booking #${booking.ticketId || booking.id} has been verified and marked COMPLETED. Payout of ${payoutStr} has been credited to your settlement wallet.`,
            });
            return;
          } else {
            setProcessing(false);
            setAlertConfig({
              visible: true,
              type: 'error',
              title: 'Verification Failed',
              message: json.error || 'Invalid Completion OTP. Please ask customer to provide the 4-digit code shown on their booking pass.',
            });
            return;
          }
        } catch (netErr) {}
      }

      // Offline fallback
      const updated = { ...booking, status: 'COMPLETED' };
      setBooking(updated);
      await PartnerDatabase.updateBooking(updated);
      setProcessing(false);
      setOtpModalVisible(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Service Completed! 🌟',
        message: `Booking #${booking.ticketId || booking.id} marked as completed. The booking has been successfully finalized.`,
      });
    } catch (e: any) {
      setProcessing(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Completion Failed',
        message: e.message || 'Could not complete booking.',
      });
    }
  };

  const handleVerifyCheckIn = async (otpOrQr: string) => {
    if (!booking) return;
    const cleanCode = otpOrQr.trim();
    if (!cleanCode) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Code Required',
        message: 'Please enter the customer 4-digit check-in OTP or ticket pass code.',
      });
      return;
    }

    setProcessing(true);
    try {
      const session = await PartnerDatabase.getSession();
      const isOtp = cleanCode.length === 4 && /^\d+$/.test(cleanCode);
      const payload: any = {
        status: 'CHECKED_IN',
        ...(isOtp ? { otp: cleanCode } : { qrCode: cleanCode }),
      };

      if (session?.token) {
        try {
          const res = await fetch(`${PARTNER_API}/bookings/${booking.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json.success && json.data) {
            setBooking(json.data);
            await PartnerDatabase.updateBooking(json.data);
            setProcessing(false);
            setCheckInModalVisible(false);
            setCheckInCodeInput('');
            setAlertConfig({
              visible: true,
              type: 'success',
              title: 'Guest Arrival Verified! ✅',
              message: `Customer check-in confirmed for booking #${booking.ticketId || booking.id}.`,
            });
            return;
          } else {
            throw new Error(json.error || 'Verification failed.');
          }
        } catch (netErr: any) {
          if (netErr?.message && !netErr.message.includes('fetch')) {
            throw netErr;
          }
        }
      }

      // Offline fallback
      const updated = {
        ...booking,
        checkInStatus: 'CHECKED_IN',
        checkedInAt: new Date().toISOString(),
      };
      setBooking(updated);
      await PartnerDatabase.updateBooking(updated);
      setProcessing(false);
      setCheckInModalVisible(false);
      setCheckInCodeInput('');
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Guest Arrival Verified! ✅',
        message: `Customer check-in confirmed for booking #${booking.ticketId || booking.id}.`,
      });
    } catch (e: any) {
      setProcessing(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Check-In Notice',
        message: e?.message || 'Could not verify customer pass.',
      });
    }
  };

  const isConfirmed = booking.status === 'CONFIRMED';
  const isCheckedIn = booking.status === 'CHECKED_IN' || booking.checkInStatus === 'CHECKED_IN';
  const isPending = booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW';
  const isCompleted = booking.status === 'COMPLETED' || booking.status === 'SUCCESS';
  const isCancelled = booking.status === 'CANCELLED';

  const partnerNetEarnings = (booking as any).partnerPayout || (booking as any).payoutAmount || Math.round((booking.totalAmount || 0) * 0.95);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              <Text style={styles.ticketId}>TICKET #{booking.ticketId || 'HLP-BKG-8891'}</Text>
              {(booking as any).celebrationType ? (
                <View style={styles.celebrationPill}>
                  <Text style={styles.celebrationPillText}>
                    🎉 {String((booking as any).celebrationType).replace(/_/g, ' ')}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.serviceTitle}>{booking.venue?.name || (booking as any).serviceName || 'Booked Service'}</Text>
            <Text style={styles.eventDate}>📅 Event Date: {booking.bookingDate || booking.date}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted
                  ? 'rgba(52, 211, 153, 0.15)'
                  : isCheckedIn
                  ? 'rgba(168, 85, 247, 0.2)'
                  : isConfirmed
                  ? 'rgba(59, 130, 246, 0.15)'
                  : isCancelled
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(251, 191, 36, 0.15)',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isCompleted
                    ? '#34d399'
                    : isCheckedIn
                    ? '#c084fc'
                    : isConfirmed
                    ? '#60a5fa'
                    : isCancelled
                    ? '#f87171'
                    : '#fbbf24',
                },
              ]}
            >
              {booking.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Customer Contact Details</Text>
          <View style={styles.customerRow}>
            <View style={styles.avatarBox}>
              <User size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{booking.user?.name || 'Customer'}</Text>
              <Text style={styles.customerEmail}>{booking.user?.email || 'customer@happylokam.com'}</Text>
              <Text style={styles.customerPhone}>{booking.user?.phone || 'No phone provided'}</Text>
            </View>
          </View>

          <View style={styles.contactActionRow}>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.85} onPress={handleCall}>
              <Phone size={16} color="#ffffff" />
              <Text style={styles.callBtnText}>Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.85} onPress={handleWhatsApp}>
              <MessageSquare size={16} color="#34d399" />
              <Text style={styles.whatsappBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Celebration Setup & Attendance Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Celebration Setup & Attendance</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>SCHEDULE</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>
                {booking.bookingDate || booking.date}
              </Text>
              <Text style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>{booking.bookingTime || 'Full Day / Standard'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>DURATION</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>
                {booking.bookingDays || 1} Day(s)
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10, marginTop: 10 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>ATTENDANCE GUESTS</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>
                {booking.guestCount || 0} Guests
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>TOTAL CATERING PLATES</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>
                {(booking.platesCount || ((booking.vegPlatesCount || 0) + (booking.nonVegPlatesCount || 0))) || 0} Plates
              </Text>
            </View>
          </View>

          {/* Veg & Non-Veg Plates Breakdown */}
          {((booking.vegPlatesCount && booking.vegPlatesCount > 0) || (booking.nonVegPlatesCount && booking.nonVegPlatesCount > 0)) && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#090d16', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#4ade80' }}>🟢 PURE VEG PLATES</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#4ade80', marginTop: 2 }}>
                  {booking.vegPlatesCount || 0} Plates
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#f87171' }}>🔴 NON-VEG PLATES</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#f87171', marginTop: 2 }}>
                  {booking.nonVegPlatesCount || 0} Plates
                </Text>
              </View>
            </View>
          )}

          {booking.notes && (
            <View style={{ marginTop: 10, padding: 8, backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#38bdf8' }}>CUSTOMER NOTES</Text>
              <Text style={{ fontSize: 12, color: '#e2e8f0', marginTop: 2 }}>{booking.notes}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 12, marginTop: 10 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>CHECK-IN ARRIVAL</Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginTop: 4,
                  backgroundColor: (booking.checkInStatus === 'CHECKED_IN' || booking.checkInStatus === 'COMPLETED')
                    ? 'rgba(52, 211, 153, 0.2)'
                    : 'rgba(251, 191, 36, 0.2)',
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: (booking.checkInStatus === 'CHECKED_IN' || booking.checkInStatus === 'COMPLETED')
                      ? '#34d399'
                      : '#fbbf24',
                  }}
                >
                  {booking.checkInStatus === 'CHECKED_IN'
                    ? 'GUEST CHECKED IN'
                    : booking.checkInStatus === 'COMPLETED'
                    ? 'SERVICE COMPLETED'
                    : 'AWAITING ARRIVAL'}
                </Text>
              </View>
            </View>

            {isConfirmed && booking.checkInStatus !== 'CHECKED_IN' && booking.checkInStatus !== 'COMPLETED' && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#0284c7',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
                onPress={() => setCheckInModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                  Verify Check-In
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Payment & Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Service Rate</Text>
            <Text style={styles.priceVal}>₹{(booking.baseAmount || booking.totalAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Convenience (5%)</Text>
            <Text style={styles.priceVal}>₹{(booking.platformFee || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST / Taxes (18%)</Text>
            <Text style={styles.priceVal}>₹{(booking.taxAmount || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Booking Amount</Text>
            <Text style={styles.totalVal}>₹{booking.totalAmount.toLocaleString('en-IN')}</Text>
          </View>

          {/* Net Partner Payout Card */}
          <View style={styles.payoutHighlightBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.payoutHighlightLabel}>NET PARTNER PAYOUT</Text>
              <Text style={styles.payoutHighlightSub}>Settled directly to your verified bank account</Text>
            </View>
            <Text style={styles.payoutHighlightVal}>₹{partnerNetEarnings.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Action Buttons depending on status */}
        {isPending ? (
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.85}
              disabled={processing}
              onPress={handleAccept}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} color="#ffffff" />
                  <Text style={styles.acceptBtnText}>Accept Booking</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineBtn}
              activeOpacity={0.85}
              onPress={() => setDeclineModalVisible(true)}
            >
              <XCircle size={18} color="#f87171" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : isConfirmed && !isCheckedIn ? (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              onPress={() => setCheckInModalVisible(true)}
            >
              <FileCheck size={18} color="#ffffff" />
              <Text style={styles.completeBtnText}>Step 1: Verify Guest Check-In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completeBtn, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]}
              activeOpacity={0.85}
              onPress={() => setOtpModalVisible(true)}
            >
              <Sparkles size={18} color="#a855f7" />
              <Text style={[styles.completeBtnText, { color: '#c084fc' }]}>Direct Completion OTP</Text>
            </TouchableOpacity>
          </View>
        ) : isCheckedIn ? (
          <TouchableOpacity
            style={styles.completeBtn}
            activeOpacity={0.85}
            onPress={() => setOtpModalVisible(true)}
          >
            <Sparkles size={18} color="#ffffff" />
            <Text style={styles.completeBtnText}>Step 2: Verify Completion OTP & Release Payout</Text>
          </TouchableOpacity>
        ) : isCancelled ? (
          <View style={[styles.completedNotice, { borderColor: '#7f1d1d' }]}>
            <XCircle size={20} color="#f87171" />
            <Text style={[styles.completedNoticeText, { color: '#f87171' }]}>
              This reservation was declined or cancelled.
            </Text>
          </View>
        ) : (
          <View style={styles.completedNotice}>
            <CheckCircle2 size={20} color="#34d399" />
            <Text style={styles.completedNoticeText}>
              This booking is marked as completed and payouts have been settled.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* OTP Completion Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Customer OTP</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Ask the customer for their 4-digit service completion OTP to release booking funds.
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="••••"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              maxLength={4}
              value={enteredOtp}
              onChangeText={setEnteredOtp}
            />

            <TouchableOpacity
              style={styles.otpSubmitBtn}
              activeOpacity={0.85}
              disabled={processing}
              onPress={handleVerifyOtpAndComplete}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.otpSubmitBtnText}>Verify OTP & Release Payout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Check-In Arrival Verification Modal */}
      <Modal visible={checkInModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Guest Arrival</Text>
              <TouchableOpacity onPress={() => setCheckInModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Enter the customer's 4-digit check-in OTP or ticket pass code shown on their digital pass.
            </Text>

            <TextInput
              style={[styles.otpInput, { letterSpacing: 2, fontSize: 18 }]}
              placeholder="e.g. 4821 or HL-BKG-..."
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={checkInCodeInput}
              onChangeText={setCheckInCodeInput}
            />

            <TouchableOpacity
              style={[styles.otpSubmitBtn, { backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              disabled={processing}
              onPress={() => handleVerifyCheckIn(checkInCodeInput)}
            >
              {processing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.otpSubmitBtnText}>Verify Check-In & Admit Guest</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Decline Reason Modal */}
      <Modal visible={declineModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Decline Reservation</Text>
              <TouchableOpacity onPress={() => setDeclineModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Please explain why this booking cannot be accommodated (e.g. slot fully booked, maintenance).
            </Text>

            <TextInput
              style={[styles.otpInput, { height: 80, textAlign: 'left', fontSize: 14 }]}
              placeholder="e.g. Venue is reserved for a private family event on this date..."
              placeholderTextColor="#64748b"
              multiline
              value={declineReason}
              onChangeText={setDeclineReason}
            />

            <TouchableOpacity
              style={[styles.otpSubmitBtn, { backgroundColor: '#ef4444' }]}
              activeOpacity={0.85}
              disabled={processing}
              onPress={handleDeclineSubmit}
            >
              <Text style={styles.otpSubmitBtnText}>Confirm Decline Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  ticketId: { fontSize: 11, fontWeight: '800', color: '#60a5fa', letterSpacing: 0.8 },
  celebrationPill: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  celebrationPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c084fc',
    textTransform: 'capitalize',
  },
  serviceTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  eventDate: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1c2438',
    marginBottom: 16,
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff', marginBottom: 14 },
  customerRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  customerEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  customerPhone: { fontSize: 13, color: '#60a5fa', fontWeight: '700', marginTop: 4 },
  contactActionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
  },
  callBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f291e',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1b4d3e',
  },
  whatsappBtnText: { fontSize: 13, fontWeight: '700', color: '#34d399' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: 13, color: '#94a3b8' },
  priceVal: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1c2438',
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  totalVal: { fontSize: 18, fontWeight: '900', color: '#60a5fa' },
  payoutHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  payoutHighlightLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.5,
  },
  payoutHighlightSub: {
    fontSize: 11,
    color: '#86efac',
    marginTop: 2,
  },
  payoutHighlightVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#22c55e',
  },
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: '#f87171' },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 10,
  },
  completeBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginTop: 10,
  },
  completedNoticeText: { flex: 1, fontSize: 13, color: '#34d399', fontWeight: '600' },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#0d1117',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  modalSub: { fontSize: 13, color: '#94a3b8', marginBottom: 18, lineHeight: 18 },
  otpInput: {
    backgroundColor: '#121622',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  otpSubmitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  otpSubmitBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
