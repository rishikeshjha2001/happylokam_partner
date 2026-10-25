import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  Plus,
  X,
  MapPin,
  Users,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import PartnerDatabase, { PartnerServiceItem } from '../services/partnerDatabase';
import { PARTNER_API } from '../constants/api';
import CustomAlert from '../components/CustomAlert';

const CATEGORIES = [
  'VENUES',
  'PHOTOGRAPHY',
  'CATERING',
  'DECORATION',
  'DJ_MUSIC',
  'MAKEUP_ARTIST',
  'ENTERTAINMENT',
  'ANCHOR_EMCEE',
  'MEHNDI_ARTIST',
  'HORSE_CHARIOT',
  'PRIEST_PANDIT',
  'CHOREOGRAPHER',
];

const PRICING_UNITS = [
  { label: 'Per Event', value: 'PER_EVENT' },
  { label: 'Per Day', value: 'PER_DAY' },
  { label: 'Per Hour', value: 'PER_HOUR' },
  { label: 'Per Plate', value: 'PER_PLATE' },
  { label: 'Fixed Price', value: 'FIXED' },
];

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState<PartnerServiceItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('VENUES');
  const [subCategory, setSubCategory] = useState('');
  const [pricing, setPricing] = useState('');
  const [pricingUnit, setPricingUnit] = useState('PER_EVENT');
  const [capacity, setCapacity] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: 'success' | 'error' | 'warning' | 'info' | 'exit';
    title: string;
    message: string;
    buttons?: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[];
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const allServices = await PartnerDatabase.getServices();
        const found = allServices.find((s) => s.id === id);

        if (found) {
          populateForm(found);
        } else {
          // Attempt backend fetch
          const session = await PartnerDatabase.getSession();
          if (session?.token) {
            try {
              const res = await fetch(`${PARTNER_API}/services`, {
                headers: { Authorization: `Bearer ${session.token}` },
              });
              const json = await res.json();
              if (json.success && Array.isArray(json.data)) {
                const bFound = json.data.find((s: any) => s.id === id);
                if (bFound) {
                  populateForm({
                    id: bFound.id,
                    name: bFound.name,
                    category: bFound.category,
                    subCategory: bFound.subCategory,
                    description: bFound.description || '',
                    pricing: parseFloat(bFound.pricing || 0),
                    pricingUnit: bFound.pricingUnit || 'PER_EVENT',
                    capacity: bFound.capacity ? parseInt(bFound.capacity) : undefined,
                    images: bFound.images || [],
                    documents: bFound.documents || [],
                    features: bFound.features || [],
                    location: bFound.location || '',
                    city: bFound.city || '',
                    availability: bFound.availability || 'AVAILABLE',
                    status: bFound.status || 'PENDING',
                    rating: bFound.rating || 5.0,
                    totalBookings: bFound.totalBookings || 0,
                    isActive: bFound.isActive !== false,
                    createdAt: bFound.createdAt || new Date().toISOString(),
                  });
                }
              }
            } catch (netErr) {}
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const populateForm = (item: PartnerServiceItem) => {
    setService(item);
    setName(item.name);
    setCategory(item.category || 'VENUES');
    setSubCategory(item.subCategory || '');
    setPricing(item.pricing ? String(item.pricing) : '');
    setPricingUnit(item.pricingUnit || 'PER_EVENT');
    setCapacity(item.capacity ? String(item.capacity) : '');
    setCity(item.city || '');
    setLocation(item.location || '');
    setDescription(item.description || '');
    setFeatures(item.features || []);
    setIsActive(item.isActive !== false);
  };

  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (feat: string) => {
    setFeatures(features.filter((f) => f !== feat));
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setAlertConfig({ visible: true, type: 'warning', title: 'Service Name Required', message: 'Please enter a title for your service.' });
      return;
    }
    if (!pricing.trim() || isNaN(parseFloat(pricing)) || parseFloat(pricing) <= 0) {
      setAlertConfig({ visible: true, type: 'warning', title: 'Valid Price Required', message: 'Please enter a valid pricing amount.' });
      return;
    }
    if (!description.trim()) {
      setAlertConfig({ visible: true, type: 'warning', title: 'Description Required', message: 'Please tell customers what is included in this service.' });
      return;
    }

    try {
      setSubmitting(true);
      const session = await PartnerDatabase.getSession();

      const payload = {
        name: name.trim(),
        category,
        subCategory: subCategory.trim() || undefined,
        description: description.trim(),
        pricing: parseFloat(pricing),
        pricingUnit,
        capacity: capacity ? parseInt(capacity) : undefined,
        city: city.trim() || 'Hyderabad',
        location: location.trim() || city.trim() || 'Hyderabad',
        features,
        isActive,
      };

      let updatedData = {
        ...(service || {}),
        id: id!,
        ...payload,
        status: service?.status === 'APPROVED' ? 'APPROVED' : (service?.status || 'PENDING'),
        rating: service?.rating || 5.0,
        totalBookings: service?.totalBookings || 0,
        images: service?.images || [],
        documents: service?.documents || [],
        availability: 'AVAILABLE',
        createdAt: service?.createdAt || new Date().toISOString(),
      } as PartnerServiceItem;

      if (session?.token && id) {
        try {
          const res = await fetch(`${PARTNER_API}/services/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (json.success && json.data) {
            const b = json.data;
            updatedData = {
              ...updatedData,
              ...b,
              pricing: parseFloat(b.pricing || payload.pricing),
            };
          }
        } catch (netErr) {
          // Offline fallback
        }
      }

      await PartnerDatabase.updateService(updatedData);
      setSubmitting(false);

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Service Updated! 🚀',
        message: 'Your service changes have been successfully saved.',
        onClose: () => {
          router.replace('/(tabs)/services');
        },
      });
    } catch (e: any) {
      setSubmitting(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Save Failed',
        message: e.message || 'Could not update service. Please try again.',
      });
    }
  };

  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      type: 'exit',
      title: 'Delete Service?',
      message: `Are you sure you want to delete "${name || 'this service'}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const session = await PartnerDatabase.getSession();
              if (session?.token && id) {
                await fetch(`${PARTNER_API}/services/${id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${session.token}` },
                }).catch(() => {});
              }
            } catch (e) {}
            if (id) {
              await PartnerDatabase.deleteService(id);
            }
            router.replace('/(tabs)/services');
          },
        },
      ],
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Service</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color="#f87171" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Active Status Switch */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Accepting Bookings</Text>
                <Text style={styles.toggleSub}>
                  {isActive
                    ? 'Service is live and visible to customers on Happylokam'
                    : 'Service is temporarily paused from new customer inquiries'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#1e293b', true: '#2563eb' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Service Name */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Service / Package Title *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Royal Palace Banquet & Lawn"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Category Picker */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Service Category *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    category === cat && styles.catChipActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      category === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Sub-Category / Specialization</Text>
            <TextInput
              style={styles.textInput}
              value={subCategory}
              onChangeText={setSubCategory}
              placeholder="e.g. Destination Weddings, Candid Pre-Wedding"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Pricing & Unit */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Pricing Amount (₹) *</Text>
            <View style={styles.priceRow}>
              <DollarSign size={18} color="#60a5fa" style={styles.priceIcon} />
              <TextInput
                style={[styles.textInput, { paddingLeft: 40, flex: 1 }]}
                value={pricing}
                onChangeText={setPricing}
                placeholder="45000"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Pricing Unit *</Text>
            <View style={styles.unitRow}>
              {PRICING_UNITS.map((u) => (
                <TouchableOpacity
                  key={u.value}
                  style={[
                    styles.unitChip,
                    pricingUnit === u.value && styles.unitChipActive,
                  ]}
                  onPress={() => setPricingUnit(u.value)}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      pricingUnit === u.value && styles.unitChipTextActive,
                    ]}
                  >
                    {u.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Capacity & Location */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Max Capacity (Guests)</Text>
            <View style={styles.priceRow}>
              <Users size={18} color="#a78bfa" style={styles.priceIcon} />
              <TextInput
                style={[styles.textInput, { paddingLeft: 40, flex: 1 }]}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="500"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>City *</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="Hyderabad, Bangalore, etc."
              placeholderTextColor="#64748b"
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Address / Area *</Text>
            <View style={styles.priceRow}>
              <MapPin size={18} color="#34d399" style={styles.priceIcon} />
              <TextInput
                style={[styles.textInput, { paddingLeft: 40, flex: 1 }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Road No 36, Jubilee Hills"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Service Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your service packages, inclusions, past experience, and highlights..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Features / Amenities */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Included Features & Amenities</Text>
            <View style={styles.addFeatureRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={featureInput}
                onChangeText={setFeatureInput}
                placeholder="e.g. 4K Drone Included, AC Dressing Rooms"
                placeholderTextColor="#64748b"
                onSubmitEditing={handleAddFeature}
              />
              <TouchableOpacity style={styles.addFeatureBtn} onPress={handleAddFeature}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.featureGrid}>
              {features.map((feat, idx) => (
                <View key={idx} style={styles.featureBadge}>
                  <CheckCircle2 size={12} color="#60a5fa" />
                  <Text style={styles.featureBadgeText}>{feat}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFeature(feat)}>
                    <X size={12} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => {
          if (alertConfig.onClose) alertConfig.onClose();
          setAlertConfig({ visible: false, title: '', message: '' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070a12' },
  loadingContainer: { flex: 1, backgroundColor: '#070a12', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  toggleSub: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 90,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  catChipText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  catChipTextActive: { color: '#ffffff', fontWeight: '700' },
  priceRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  priceIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  unitChipText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  unitChipTextActive: { color: '#60a5fa', fontWeight: '700' },
  addFeatureRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addFeatureBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  featureBadgeText: { fontSize: 12, color: '#e2e8f0' },
  saveBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
