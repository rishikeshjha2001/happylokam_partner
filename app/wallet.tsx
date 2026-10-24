import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  Gift,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';

interface Transaction {
  id: string;
  type: 'CREDIT' | 'PAYOUT' | 'REFERRAL';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

const SAMPLE_TRANSACTIONS: Transaction[] = [];

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [inEscrow, setInEscrow] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>(SAMPLE_TRANSACTIONS);
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'PAYOUT' | 'REFERRAL'>('ALL');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
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
      if (session?.walletBalance !== undefined) {
        setBalance(session.walletBalance);
      }
    })();
  }, []);

  const filtered = transactions.filter((t) => (filter === 'ALL' ? true : t.type === filter));

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid amount to withdraw.',
      });
      return;
    }
    if (amt > balance) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Insufficient Balance',
        message: `Your available wallet balance is ₹${balance.toLocaleString('en-IN')}. Please enter an amount within this limit.`,
      });
      return;
    }

    setWithdrawing(true);
    setTimeout(async () => {
      const newBal = balance - amt;
      setBalance(newBal);
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'PAYOUT',
        title: 'Bank Transfer Withdrawal Request',
        subtitle: 'Processing to Primary Bank Account',
        amount: amt,
        date: 'Just Now',
        status: 'PENDING',
      };
      setTransactions([newTx, ...transactions]);

      // Update session balance
      const session = await PartnerDatabase.getSession();
      if (session) {
        session.walletBalance = newBal;
        await PartnerDatabase.saveSession(session);
      }

      setWithdrawing(false);
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Payout Initiated! 💸',
        message: `Withdrawal request for ₹${amt.toLocaleString('en-IN')} has been submitted. It will be credited to your verified bank account within 24 hours.`,
      });
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Wallet & Payouts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletIconBox}>
              <Wallet size={24} color="#60a5fa" />
            </View>
            <View style={styles.badgeVerified}>
              <CheckCircle2 size={12} color="#34d399" />
              <Text style={styles.badgeVerifiedText}>Direct Bank Transfer</Text>
            </View>
          </View>

          <Text style={styles.walletLabel}>Available Balance</Text>
          <Text style={styles.walletBalance}>₹{balance.toLocaleString('en-IN')}</Text>

          {/* Sub Stats */}
          <View style={styles.walletSubStats}>
            <View style={styles.subStatItem}>
              <Clock size={14} color="#fbbf24" />
              <Text style={styles.subStatLabel}>In Escrow / Upcoming:</Text>
              <Text style={styles.subStatValue}>₹{inEscrow.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.walletActionRow}>
            <TouchableOpacity
              style={styles.withdrawBtn}
              activeOpacity={0.85}
              onPress={() => setWithdrawModalVisible(true)}
            >
              <ArrowUpRight size={18} color="#ffffff" />
              <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bankBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/kyc')}
            >
              <Building2 size={16} color="#94a3b8" />
              <Text style={styles.bankBtnText}>Bank Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['ALL', 'CREDIT', 'PAYOUT', 'REFERRAL'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>
                {f === 'ALL' ? 'All Transactions' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction List */}
        {filtered.map((tx) => {
          const isCredit = tx.type === 'CREDIT' || tx.type === 'REFERRAL';
          return (
            <View key={tx.id} style={styles.txCard}>
              <View
                style={[
                  styles.txIconBox,
                  {
                    backgroundColor: isCredit
                      ? 'rgba(52, 211, 153, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  },
                ]}
              >
                {tx.type === 'REFERRAL' ? (
                  <Gift size={20} color="#34d399" />
                ) : isCredit ? (
                  <ArrowDownLeft size={20} color="#34d399" />
                ) : (
                  <ArrowUpRight size={20} color="#f87171" />
                )}
              </View>

              <View style={styles.txInfo}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>

              <View style={styles.txAmountCol}>
                <Text style={[styles.txAmount, { color: isCredit ? '#34d399' : '#f87171' }]}>
                  {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
                <View
                  style={[
                    styles.txStatusBadge,
                    {
                      backgroundColor:
                        tx.status === 'COMPLETED'
                          ? 'rgba(52, 211, 153, 0.12)'
                          : 'rgba(251, 191, 36, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.txStatusText,
                      { color: tx.status === 'COMPLETED' ? '#34d399' : '#fbbf24' },
                    ]}
                  >
                    {tx.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal visible={withdrawModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Available balance: <Text style={{ color: '#60a5fa', fontWeight: '800' }}>₹{balance.toLocaleString('en-IN')}</Text>
            </Text>

            <Text style={styles.inputLabel}>Enter Withdrawal Amount (₹)</Text>
            <View style={styles.amountInputRow}>
              <IndianRupee size={20} color="#60a5fa" />
              <TextInput
                style={styles.amountInput}
                placeholder="e.g. 10000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
            </View>

            <View style={styles.quickSelectRow}>
              {[5000, 10000, 20000, balance].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickSelectBtn}
                  onPress={() => setWithdrawAmount(val.toString())}
                >
                  <Text style={styles.quickSelectText}>
                    {val === balance ? 'Max' : `₹${val / 1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBankNote}>
              <Building2 size={16} color="#3b82f6" />
              <Text style={styles.modalBankNoteText}>
                Payouts are transferred to your verified primary bank account within 24 business hours.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmWithdrawBtn}
              activeOpacity={0.85}
              disabled={withdrawing}
              onPress={handleWithdraw}
            >
              {withdrawing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmWithdrawBtnText}>Confirm Withdrawal</Text>
              )}
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
  walletCard: {
    backgroundColor: '#0d1117',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  badgeVerifiedText: { fontSize: 11, fontWeight: '700', color: '#34d399' },
  walletLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  walletBalance: { fontSize: 36, fontWeight: '900', color: '#ffffff', marginTop: 4, letterSpacing: -0.5 },
  walletSubStats: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1a2233',
  },
  subStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subStatLabel: { fontSize: 12, color: '#94a3b8' },
  subStatValue: { fontSize: 13, fontWeight: '700', color: '#fbbf24' },
  walletActionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  withdrawBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
  },
  withdrawBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  bankBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161f30',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#222f47',
  },
  bankBtnText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  filterScroll: { marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 8,
  },
  filterPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterPillText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  filterPillTextActive: { color: '#ffffff', fontWeight: '700' },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1c2438',
    gap: 12,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  txSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  txDate: { fontSize: 11, color: '#64748b', marginTop: 4 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  txStatusText: { fontSize: 10, fontWeight: '700' },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  modalSub: { fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 8 },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1c2333',
    gap: 10,
  },
  amountInput: { flex: 1, paddingVertical: 14, fontSize: 18, color: '#ffffff', fontWeight: '700' },
  quickSelectRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 18 },
  quickSelectBtn: {
    flex: 1,
    backgroundColor: '#161f30',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222f47',
  },
  quickSelectText: { fontSize: 12, fontWeight: '700', color: '#60a5fa' },
  modalBankNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 20,
    alignItems: 'center',
  },
  modalBankNoteText: { flex: 1, fontSize: 12, color: '#93c5fd', lineHeight: 16 },
  confirmWithdrawBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmWithdrawBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
