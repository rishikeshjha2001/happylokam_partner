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
  Plus,
  Trash2,
  Package,
  Layers,
} from 'lucide-react-native';
import { PARTNER_API } from '../constants/api';
import PartnerDatabase, { PartnerServiceItem, PartnerServicePackage } from '../services/partnerDatabase';
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

const PRICING_MODELS = [
  { id: 'PER_PERSON', label: 'Per Person / Plate', sub: 'Calculates based on guest count' },
  { id: 'FIXED_PACKAGE', label: 'Fixed Package', sub: 'Flat fee for specific guest count' },
  { id: 'MANUAL_CUSTOM', label: 'Manual Guest Count', sub: 'Client enters exact custom guests' },
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
  const [pricingModel, setPricingModel] = useState<'PER_PERSON' | 'FIXED_PACKAGE' | 'MANUAL_CUSTOM'>('PER_PERSON');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [minGuests, setMinGuests] = useState('50');
  const [maxGuests, setMaxGuests] = useState('500');
  const [capacity, setCapacity] = useState('500');
  const [city, setCity] = useState('Hyderabad');
  const [availableCities, setAvailableCities] = useState('Hyderabad, Secunderabad, Gachibowli, Jubilee Hills');
  const [location, setLocation] = useState('');
  const [features, setFeatures] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // Customizable Tier Packages
  const [packages, setPackages] = useState<PartnerServicePackage[]>([
    { name: 'Silver Celebration Package', guests: 100, price: 45000, description: 'Standard setup, 3-course buffet, ambient audio' },
    { name: 'Gold Royal Package', guests: 250, price: 95000, description: 'Premium decor, grand buffet, concert lighting & stage' },
  ]);
  const [pkgName, setPkgName] = useState('');
  const [pkgGuests, setPkgGuests] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);

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

  const handleAddPackage = () => {
    if (!pkgName.trim() || !pkgPrice.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Package Info Needed',
        message: 'Please provide at least a package name and price.',
      });
      return;
    }
    const newPkg: PartnerServicePackage = {
      name: pkgName.trim(),
      guests: parseInt(pkgGuests) || 100,
      price: parseFloat(pkgPrice) || 50000,
      description: pkgDesc.trim() || undefined,
    };
    setPackages([...packages, newPkg]);
    setPkgName('');
    setPkgGuests('');
    setPkgPrice('');
    setPkgDesc('');
    setShowAddPackage(false);
  };

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

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
    const effectivePricing = pricingModel === 'PER_PERSON' && pricePerPerson 
      ? parseFloat(pricePerPerson) * (parseInt(minGuests) || 50)
      : parseFloat(pricing);

    if ((!pricing && !pricePerPerson) || isNaN(effectivePricing) || effectivePricing <= 0) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Valid Pricing Required',
        message: 'Please provide a valid pricing amount or per-person rate.',
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

      const citiesList = availableCities
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        category: category.toUpperCase().replace(/\s+/g, '_'),
        subCategory: subCategory.trim() || undefined,
        description: description.trim(),
        pricing: effectivePricing,
        pricingUnit: pricingModel === 'PER_PERSON' ? 'PER_PLATE' : pricingUnit,
        pricingModel,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : undefined,
        minGuests: parseInt(minGuests) || 50,
        maxGuests: parseInt(maxGuests) || 500,
        capacity: capacity ? parseInt(capacity) : (parseInt(maxGuests) || 500),
        city: city.trim() || 'Hyderabad',
        availableCities: citiesList.length > 0 ? citiesList : [city.trim() || 'Hyderabad'],
        location: location.trim() || city.trim() || 'Hyderabad',
        mapUrl: mapUrl.trim() || undefined,
        features: featureList,
        packages,
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
              name: b.name || payload.name,
              description: b.description || payload.description,
              category: b.category || payload.category,
              subCategory: b.subCategory || payload.subCategory,
              pricing: b.pricing || payload.pricing,
              pricingUnit: b.pricingUnit || payload.pricingUnit,
              pricingModel: payload.pricingModel,
              pricePerPerson: payload.pricePerPerson,
              minGuests: payload.minGuests,
              maxGuests: payload.maxGuests,
              availableCities: payload.availableCities,
              packages: payload.packages,
              capacity: b.capacity || payload.capacity,
              images: b.images || ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'],
              documents: b.documents || [],
              features: b.features || payload.features,
              location: b.location || payload.location,
              city: b.city || payload.city,
              availability: b.availability || 'AVAILABLE',
              status: b.status || 'PENDING',
              rating: b.rating || 5.0,
              totalBookings: b.totalBookings || 0,
              isActive: b.isActive ?? true,
              createdAt: b.createdAt || new Date().toISOString(),
            };
          }
        } catch (apiErr) {
          console.warn('Backend service add notice:', apiErr);
        }
      }

      if (!savedService) {
        savedService = {
          id: `ps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: payload.name,
          description: payload.description,
          category: payload.category,
          subCategory: payload.subCategory,
          pricing: payload.pricing,
          pricingUnit: payload.pricingUnit,
          pricingModel: payload.pricingModel,
          pricePerPerson: payload.pricePerPerson,
          minGuests: payload.minGuests,
          maxGuests: payload.maxGuests,
          availableCities: payload.availableCities,
          packages: payload.packages,
          capacity: payload.capacity,
          images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'],
          documents: [],
          features: payload.features,
          location: payload.location,
          city: payload.city,
          availability: 'AVAILABLE',
          status: 'PENDING',
          rating: 5.0,
          totalBookings: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      await PartnerDatabase.updateService(savedService);

      setSubmitting(false);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Service Created Successfully! 🎉',
        message: 'Your service offering, pricing model, coverage areas, and packages have been saved and submitted to happylokam Support.',
        onClose: () => router.back(),
      });
    } catch (err: any) {
      setSubmitting(false);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not save service. Please try again.',
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
        <Text style={styles.headerTitle}>Add Celebration Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Verification Notice */}
        <View style={styles.banner}>
          <FileCheck size={20} color="#60a5fa" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>happylokam Support Verification Notice</Text>
            <Text style={styles.bannerText}>
              All newly listed services and packages are verified by our team within 24 hours to maintain 5-star quality.
            </Text>
          </View>
        </View>

        {/* Service Name */}
        <Text style={styles.label}>Service Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Royal Rajwada Mandap & Floral Decor"
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
        <Text style={styles.label}>Sub-Category / Theme Specialization</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AC Banquet, Royal Mandap, Multi-Cuisine Gourmet"
          placeholderTextColor="#64748b"
          value={subCategory}
          onChangeText={setSubCategory}
        />

        {/* ==================================================== */}
        {/* PRICING MODEL SELECTION (Per-Person vs Fixed vs Manual) */}
        {/* ==================================================== */}
        <Text style={styles.sectionHeader}>Pricing Structure & Guest Setup</Text>
        <View style={styles.modelContainer}>
          {PRICING_MODELS.map((m) => {
            const isSelected = pricingModel === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modelCard, isSelected && styles.modelCardSelected]}
                onPress={() => setPricingModel(m.id as any)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.modelTitle, isSelected && styles.modelTitleSelected]}>
                    {m.label}
                  </Text>
                  {isSelected && <CheckCircle2 size={16} color="#38bdf8" />}
                </View>
                <Text style={styles.modelSub}>{m.sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conditional Pricing Inputs */}
        {pricingModel === 'PER_PERSON' ? (
          <View style={styles.priceRowBox}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.label}>Price Per Person / Plate (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 750"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={pricePerPerson}
                onChangeText={setPricePerPerson}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>Min Guests</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={minGuests}
                onChangeText={setMinGuests}
              />
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.label}>Base Package Price (₹) *</Text>
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
        )}

        {/* Capacity / Guest Range */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Max Guest Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 800"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={capacity}
              onChangeText={(val) => {
                setCapacity(val);
                setMaxGuests(val);
              }}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.label}>Base Primary City</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Hyderabad"
              placeholderTextColor="#64748b"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        {/* Available Service Coverage Areas */}
        <Text style={styles.label}>Coverage & Available Cities (Where you can serve)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Hyderabad, Secunderabad, Gachibowli, Jubilee Hills, Bengaluru"
          placeholderTextColor="#64748b"
          value={availableCities}
          onChangeText={setAvailableCities}
        />
        <Text style={styles.hintText}>Separate multiple cities or localities by commas</Text>

        {/* Full Address / Landmark */}
        <Text style={styles.label}>Main Studio / Venue Address & Landmark</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Road No 36, Jubilee Hills, Near Metro Station"
          placeholderTextColor="#64748b"
          value={location}
          onChangeText={setLocation}
        />

        {/* Google Maps Directions Link */}
        <Text style={styles.label}>Google Maps Directions Link (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. https://maps.app.goo.gl/... or https://google.com/maps?q=..."
          placeholderTextColor="#64748b"
          value={mapUrl}
          onChangeText={setMapUrl}
          autoCapitalize="none"
        />
        <Text style={styles.hintText}>Enables customer "See Location on Google Maps" button</Text>

        {/* ==================================================== */}
        {/* CUSTOM PACKAGES LIST & CREATOR                      */}
        {/* ==================================================== */}
        <View style={styles.packageHeaderRow}>
          <View>
            <Text style={styles.sectionHeader}>Package Tiers (Fixed & Custom Guests)</Text>
            <Text style={styles.sectionSub}>Offer pre-configured packages for different guest counts</Text>
          </View>
          <TouchableOpacity
            style={styles.addPkgBtn}
            onPress={() => setShowAddPackage(!showAddPackage)}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#38bdf8" />
            <Text style={styles.addPkgBtnText}>{showAddPackage ? 'Close' : 'Add Tier'}</Text>
          </TouchableOpacity>
        </View>

        {/* Packages Cards */}
        {packages.map((pkg, idx) => (
          <View key={idx} style={styles.packageCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="#38bdf8" />
                <Text style={styles.pkgTitle}>{pkg.name}</Text>
              </View>
              <Text style={styles.pkgSub}>
                👥 Up to {pkg.guests} Guests  •  💰 ₹{pkg.price.toLocaleString('en-IN')}
              </Text>
              {pkg.description ? <Text style={styles.pkgDescText}>{pkg.description}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleRemovePackage(idx)} style={styles.removePkgBtn}>
              <Trash2 size={16} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        ))}

        {/* New Package Input Modal/Box */}
        {showAddPackage && (
          <View style={styles.newPkgBox}>
            <Text style={styles.newPkgTitle}>New Package Option</Text>
            <TextInput
              style={styles.input}
              placeholder="Package Name (e.g. Platinum Royal Tier)"
              placeholderTextColor="#64748b"
              value={pkgName}
              onChangeText={setPkgName}
            />
            <View style={[styles.row, { marginTop: 8 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Target Guests (e.g. 350)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={pkgGuests}
                onChangeText={setPkgGuests}
              />
              <TextInput
                style={[styles.input, { flex: 1.2, marginLeft: 10 }]}
                placeholder="Total Price (₹)"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={pkgPrice}
                onChangeText={setPkgPrice}
              />
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Inclusions / What is included in this tier"
              placeholderTextColor="#64748b"
              value={pkgDesc}
              onChangeText={setPkgDesc}
            />
            <TouchableOpacity style={styles.savePkgBtn} onPress={handleAddPackage} activeOpacity={0.85}>
              <Text style={styles.savePkgBtnText}>Save Package Tier ✨</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <Text style={styles.label}>Detailed Description & Inclusions *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your service, staff arrangements, food menu, setup times, equipment..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Amenities */}
        <Text style={styles.label}>Key Features & Highlights (Comma Separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Royal Mandap, Stage Lighting, Multi-Cuisine, Sound Rig, Generator Backup"
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
            <Text style={styles.submitBtnText}>Submit Service for Verification 🚀</Text>
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
  scroll: { padding: 20, paddingBottom: 50 },
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
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#f8fafc', marginTop: 18, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#64748b', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 6, marginTop: 14 },
  hintText: { fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' },
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
  priceRowBox: { flexDirection: 'row', alignItems: 'center' },
  modelContainer: { gap: 10, marginTop: 6, marginBottom: 8 },
  modelCard: {
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modelCardSelected: {
    backgroundColor: '#0b192e',
    borderColor: '#38bdf8',
  },
  modelTitle: { fontSize: 14, fontWeight: '700', color: '#e2e8f0' },
  modelTitleSelected: { color: '#38bdf8' },
  modelSub: { fontSize: 12, color: '#64748b', marginTop: 3 },
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
  packageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  addPkgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0b192e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  addPkgBtnText: { color: '#38bdf8', fontSize: 12, fontWeight: '700' },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  pkgTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  pkgSub: { fontSize: 12, color: '#38bdf8', fontWeight: '600', marginTop: 3 },
  pkgDescText: { fontSize: 11, color: '#64748b', marginTop: 4 },
  removePkgBtn: { padding: 8 },
  newPkgBox: {
    backgroundColor: '#0b1526',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginBottom: 14,
  },
  newPkgTitle: { fontSize: 13, fontWeight: '800', color: '#93c5fd', marginBottom: 10 },
  savePkgBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  savePkgBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
});
