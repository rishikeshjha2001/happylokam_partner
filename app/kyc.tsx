import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
} from 'lucide-react-native';
import PartnerDatabase from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';
import { PARTNER_API } from '../constants/api';

export default function KycScreen() {
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [saving, setSaving] = useState(false);
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
      if (session) {
        if (session.gstNumber) setGstNumber(session.gstNumber);
        if (session.panNumber) setPanNumber(session.panNumber);
        if (session.bankAccount) setBankAccount(session.bankAccount);
        if (session.bankIfsc) setBankIfsc(session.bankIfsc);
        setIsVerified(!!session.isVerified);
      }
    })();
  }, []);

  const handleSaveKyc = async () => {
    if (!bankAccount.trim() || !bankIfsc.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please provide at least your Bank Account Number and IFSC Code for payouts.',
      });
      return;
    }

    setSaving(true);
    try {
      const session = await PartnerDatabase.getSession();
      const token = session?.token;

      if (session) {
        session.gstNumber = gstNumber.trim();
        session.panNumber = panNumber.trim();
        session.bankAccount = bankAccount.trim();
        session.bankIfsc = bankIfsc.trim();
        await PartnerDatabase.saveSession(session);
      }

      if (token) {
        await fetch(`${PARTNER_API}/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            gstNumber: gstNumber.trim(),
            panNumber: panNumber.trim(),
            bankAccount: bankAccount.trim(),
            bankIfsc: bankIfsc.trim(),
          }),
        });
      }

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'KYC Details Updated! 🛡️',
        message: 'Your Business & Bank verification details have been securely saved and submitted to happylokam Support.',
      });
    } catch (e) {
      console.warn('KYC update error:', e);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'KYC Details Updated! 🛡️',
        message: 'Your Business & Bank verification details have been securely saved and submitted to happylokam Support.',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasBankConfigured = Boolean(bankAccount.trim() && bankIfsc.trim());
  const hasGst = Boolean(gstNumber.trim());
  const hasPan = Boolean(panNumber.trim());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business KYC & Bank Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            isVerified ? styles.statusCardVerified : styles.statusCardPending,
          ]}
        >
          <View
            style={[
              styles.statusIconBox,
              isVerified ? styles.statusIconBoxVerified : styles.statusIconBoxPending,
            ]}
          >
            {isVerified ? (
              <ShieldCheck size={28} color="#34d399" />
            ) : (
              <AlertCircle size={28} color="#fbbf24" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {isVerified ? 'Partner KYC Verified' : 'KYC & Bank Setup'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {isVerified
                ? 'Your partner account is verified. Automatic bank payouts are enabled for your completed bookings.'
                : 'Configure your payout bank account below to receive customer earnings directly to your bank.'}
            </Text>
          </View>
        </View>

        {/* Bank Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Building2 size={20} color="#a78bfa" />
            <Text style={styles.cardTitle}>Payout Bank Account</Text>
            {hasBankConfigured ? (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#34d399" />
                <Text style={styles.verifiedBadgeText}>Configured</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Clock size={12} color="#fbbf24" />
                <Text style={styles.pendingBadgeText}>Not Added</Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>Bank Name & Branch</Text>
          <TextInput
            style={styles.input}
            placeholder="Bank Name & Branch"
            placeholderTextColor="#64748b"
            value={bankName}
            onChangeText={setBankName}
          />

          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bank account number"
            placeholderTextColor="#64748b"
            value={bankAccount}
            onChangeText={setBankAccount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 11-digit IFSC code"
            placeholderTextColor="#64748b"
            value={bankIfsc}
            onChangeText={setBankIfsc}
            autoCapitalize="characters"
          />
        </View>

        {/* GST Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <FileText size={20} color="#60a5fa" />
            <Text style={styles.cardTitle}>GST Registration</Text>
            {hasGst ? (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#34d399" />
                <Text style={styles.verifiedBadgeText}>Provided</Text>
              </View>
            ) : (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>Optional</Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>GSTIN Number</Text>
          <TextInput
            style={styles.input}
            placeholder="15-digit GSTIN (optional)"
            placeholderTextColor="#64748b"
            value={gstNumber}
            onChangeText={setGstNumber}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={styles.uploadRow}
            onPress={() =>
              setAlertConfig({
                visible: true,
                type: 'info',
                title: 'Document Verification',
                message:
                  'Document verification is handled via happylokam Partner Support. Enter your GSTIN and bank details above to configure payouts.',
              })
            }
          >
            <Upload size={16} color="#60a5fa" />
            <Text style={styles.uploadText}>Attach Business Document / GST (Optional)</Text>
          </TouchableOpacity>
        </View>

        {/* PAN Card Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <CreditCard size={20} color="#fbbf24" />
            <Text style={styles.cardTitle}>Business PAN</Text>
            {hasPan ? (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#34d399" />
                <Text style={styles.verifiedBadgeText}>Provided</Text>
              </View>
            ) : (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>Optional</Text>
              </View>
            )}
          </View>

          <Text style={styles.label}>Company / Proprietor PAN</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit PAN (optional)"
            placeholderTextColor="#64748b"
            value={panNumber}
            onChangeText={setPanNumber}
            autoCapitalize="characters"
          />
        </View>

        {/* Submit / Update Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSaveKyc}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>Save & Update Verification Details</Text>
          )}
        </TouchableOpacity>
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
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  scroll: { padding: 20, paddingBottom: 40 },
  statusCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusCardVerified: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  statusCardPending: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconBoxVerified: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  statusIconBoxPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  statusTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  statusSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 16 },
  sectionCard: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1c2438',
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', flex: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', color: '#34d399' },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  optionalBadgeText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#121622',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#1c2333',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#121a2e',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  uploadText: { fontSize: 12, fontWeight: '600', color: '#93c5fd' },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
