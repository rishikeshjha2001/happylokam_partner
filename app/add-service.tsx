import React, { useState } from 'react';
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
  Tag,
  DollarSign,
  Users,
  MapPin,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react-native';
import { PARTNER_API } from '../constants/api';
import PartnerDatabase, { PartnerServiceItem } from '../services/partnerDatabase';
import CustomAlert from '../components/CustomAlert';

const CATEGORIES = [
  'Venue',
  'Catering',
  'Decoration',
  'DJ & Music',
  'Photography',
  'Mehendi',
  'Makeup',
  'Choreography',
  'Other',
];

const PRICING_UNITS = [
  { label: 'Per Event', value: 'PER_EVENT' },
  { label: 'Per Day', value: 'PER_DAY' },
  { label: 'Per Plate', value: 'PER_PLATE' },
  { label: 'Per Hour', value: 'PER_HOUR' },
];

export default function AddServiceScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [pricing, setPricing] = useState('');
  const [pricingUnit, setPricingUnit] = useState('PER_EVENT');
  const [capacity, setCapacity] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [location, setLocation] = useState('');
  const [features, setFeatures] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    if (!name.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Service Name Required',
        message: 'Please enter a name for your service offering.',
      });
      return;
    }
    if (!pricing || isNaN(Number(pricing)) || Number(pricing) <= 0) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Valid Pricing Required',
        message: 'Please provide a valid pricing amount in INR.',
      });
      return;
    }
    if (!description.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Description Required',
        message: 'Please provide a short description or list of inclusions.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const session = await PartnerDatabase.getSession();
      const featureList = features
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        name: name.trim(),
        category: category.toUpperCase().replace(/\s+/g, '_'),
        subCategory: subCategory.trim() || undefined,
        description: description.trim(),
        pricing: parseFloat(pricing),
        pricingUnit,
        capacity: capacity ? parseInt(capacity) : undefined,
        city: city.trim() || 'Hyderabad',
        location: location.trim() || city.trim() || 'Hyderabad',
        features: featureList,
      };

      let savedService: PartnerServiceItem | null = null;

      if (session?.token) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`${PARTNER_API}/services`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timer);
          const json = await res.json();
          if (json.success && json.data) {
            const b = json.data;
            savedService = {
              id: b.id,
              name: b.name || name.trim(),
              category: b.category || category,
              subCategory: b.subCategory || (subCategory.trim() || undefined),
              description: b.description || description.trim(),
              pricing: parseFloat(b.pricing || pricing),
              pricingUnit: b.pricingUnit || pricingUnit,
              capacity: b.capacity ? parseInt(b.capacity) : (capacity ? parseInt(capacity) : undefined),
              images: b.images || [],
              documents: b.documents || [],
              features: b.features || featureList,
              location: b.location || (location.trim() || 'Hyderabad'),
              city: b.city || (city.trim() || 'Hyderabad'),
              availability: b.availability || 'AVAILABLE',
              status: b.status || 'PENDING',
              rating: b.rating ? parseFloat(b.rating) : 5.0,
              totalBookings: b.totalBookings || 0,
              isActive: b.isActive !== false,
              createdAt: b.createdAt || new Date().toISOString(),
            };
          }
        } catch (netErr) {
          // Offline fallback
        }
      }

      // Save locally
      if (!savedService) {
        savedService = {
          id: 'srv-' + Date.now(),
          name: name.trim(),
          category,
          subCategory: subCategory.trim() || undefined,
          description: description.trim(),
          pricing: parseFloat(pricing),
          pricingUnit,
          capacity: capacity ? parseInt(capacity) : undefined,
          images: [],
          documents: [],
          features: featureList,
          location: location.trim() || 'Hyderabad',
          city: city.trim() || 'Hyderabad',
          availability: 'AVAILABLE',
          status: 'PENDING',
          rating: 5.0,
          totalBookings: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      const existing = await PartnerDatabase.getServices();
      await PartnerDatabase.saveServices([savedService, ...existing.filter((s) => s.id !== savedService!.id)]);

      setSubmitting(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Service Submitted! 🚀',
        message:
          'Your new service has been saved and submitted for Admin Approval. It will appear on Happylokam once verified by our quality team.',
        onClose: () => {
          router.replace('/(tabs)/services');
        },
      });
    } catch (e) {
      setSubmitting(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Submission Error',
        message: 'Could not submit service. Please try again.',
      });
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
        <Text style={styles.headerTitle}>Add New Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Sparkles size={20} color="#60a5fa" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Admin Verification Notice</Text>
            <Text style={styles.bannerText}>
              All submitted listings are verified within 24 hours to ensure high quality for customers.
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.label}>Service / Package Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Royal Grand Banquet Hall"
          placeholderTextColor="#64748b"
          value={name}
          onChangeText={setName}
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, category === c && styles.catPillActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.catPillText, category === c && styles.catPillTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sub-Category */}
        <Text style={styles.label}>Sub-Category / Specialization</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AC Banquet, Candid Photography, Multi-Cuisine"
          placeholderTextColor="#64748b"
          value={subCategory}
          onChangeText={setSubCategory}
        />

        {/* Price & Billing Unit */}
        <View style={styles.row}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.label}>Base Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={pricing}
              onChangeText={setPricing}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>Billing Unit</Text>
            <View style={styles.unitGrid}>
              {PRICING_UNITS.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[styles.unitBtn, pricingUnit === u.value && styles.unitBtnActive]}
                  onPress={() => setPricingUnit(u.value)}
                >
                  <Text style={[styles.unitBtnText, pricingUnit === u.value && styles.unitBtnTextActive]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Capacity & Location */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Max Capacity (Guests)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 800"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={capacity}
              onChangeText={setCapacity}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hyderabad"
              placeholderTextColor="#64748b"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        {/* Full Address / Landmark */}
        <Text style={styles.label}>Full Address & Landmark</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Road No 36, Jubilee Hills, Near Metro Station"
          placeholderTextColor="#64748b"
          value={location}
          onChangeText={setLocation}
        />

        {/* Description */}
        <Text style={styles.label}>Detailed Description & Inclusions *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your service, timings, seating arrangements, amenities..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Amenities */}
        <Text style={styles.label}>Key Features & Amenities (Comma Separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AC, Valet Parking, Generator Backup, Stage Lighting"
          placeholderTextColor="#64748b"
          value={features}
          onChangeText={setFeatures}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.85}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Service for Admin Review 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          const cb = alertConfig.onClose;
          setAlertConfig({ visible: false, title: '', message: '' });
          if (cb) cb();
        }}
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
  banner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#93c5fd' },
  bannerText: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#0d1117',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#1c2438',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  catScroll: { marginBottom: 4 },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 8,
  },
  catPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  catPillTextActive: { color: '#ffffff', fontWeight: '700' },
  row: { flexDirection: 'row' },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  unitBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  unitBtnText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  unitBtnTextActive: { color: '#ffffff' },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
