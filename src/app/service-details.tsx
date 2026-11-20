import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Tag,
  DollarSign,
  Users,
  MapPin,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  FileCheck,
  Car,
  Wind,
  Zap,
  Music,
  Utensils,
  Bed,
  ShieldCheck,
  Navigation,
  Layers,
} from 'lucide-react-native';
import PartnerDatabase, { PartnerServiceItem } from '../services/partnerDatabase';
import { PARTNER_API } from '../constants/api';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

const CELEBRATION_NAMES: Record<string, string> = {
  WEDDING: '💍 Wedding & Reception',
  BIRTHDAY: '🎂 Birthday & Milestone',
  OFFICE_EVENTS: '🏢 Corporate & Office',
  ANNIVERSARY: '🥂 Anniversary & Romance',
  COCKTAIL_PARTY: '🎶 Cocktail & Social Night',
  FESTIVE: '🌸 Festive & Religious Puja',
  REUNION: '🎓 Farewell & Reunion',
  BABY_SHOWER: '👶 Baby Shower & Naming',
};

export default function ServiceDetailsScreen() {
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
  const [service, setService] = useState<PartnerServiceItem | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
    buttons?: any[];
    onClose?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const loadService = useCallback(async () => {
    const services = await PartnerDatabase.getServices();
    let item = services.find((s) => s.id === params.id) || null;
    if (!item && params.id) {
      try {
        const session = await PartnerDatabase.getSession();
        if (session?.token) {
          const res = await fetch(`${PARTNER_API}/services/${params.id}`, {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          const json = await res.json();
          if (json.success && json.data) {
            item = json.data;
          }
        }
      } catch (e) {}
    }
    setService(item);
    setIsActive(item ? item.isActive !== false : false);
  }, [params.id]);

  useFocusEffect(
    useCallback(() => {
      loadService();
    }, [loadService])
  );

  if (!service) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#070a12" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Tag size={40} color="#64748b" />
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700', marginTop: 12 }}>Service Not Found</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6 }}>This service listing is no longer available or was removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleAvailability = async (val: boolean) => {
    setIsActive(val);
    try {
      const session = await PartnerDatabase.getSession();
      if (session?.token && service?.id) {
        await fetch(`${PARTNER_API}/services/${service.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ isActive: val }),
        }).catch(() => {});
      }
    } catch (e) {}
    const updated = { ...service, isActive: val };
    setService(updated);
    await PartnerDatabase.updateService(updated);
  };

  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      type: 'exit',
      title: 'Delete Service?',
      message: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const session = await PartnerDatabase.getSession();
              if (session?.token && service?.id) {
                await fetch(`${PARTNER_API}/services/${service.id}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${session.token}` },
                }).catch(() => {});
              }
            } catch (e) {}
            await PartnerDatabase.deleteService(service.id);
            router.back();
          },
        },
      ],
    });
  };

  const isApproved = service.status === 'APPROVED';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: '/edit-service', params: { id: service.id } })}
          >
            <Edit3 size={18} color="#60a5fa" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Trash2 size={18} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title & Status */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.categoryBadge}>{service.category} • {service.subCategory || 'Standard'}</Text>
            <Text style={styles.serviceName}>{service.name}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isApproved
                  ? 'rgba(52, 211, 153, 0.15)'
                  : 'rgba(251, 191, 36, 0.15)',
              },
            ]}
          >
            {isApproved ? (
              <CheckCircle2 size={12} color="#34d399" />
            ) : (
              <Clock size={12} color="#fbbf24" />
            )}
            <Text
              style={[
                styles.statusPillText,
                { color: isApproved ? '#34d399' : '#fbbf24' },
              ]}
            >
              {isApproved ? 'Live & Approved' : 'Under Review'}
            </Text>
          </View>
        </View>

        {/* Pricing & Capacity Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <DollarSign size={20} color="#60a5fa" />
            <Text style={styles.statVal}>₹{service.pricing.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>
              /{service.pricingUnit ? service.pricingUnit.replace('PER_', '').toLowerCase() : 'event'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Users size={20} color="#a78bfa" />
            <Text style={styles.statVal}>{service.capacity || 500}+</Text>
            <Text style={styles.statLabel}>Max Guests</Text>
          </View>
          <View style={styles.statBox}>
            <MapPin size={20} color="#34d399" />
            <Text style={styles.statVal}>{service.city || 'Hyderabad'}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Visibility Toggle Card */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Accepting Bookings</Text>
              <Text style={styles.toggleSub}>
                {isActive
                  ? 'Your service is visible to customers on happylokam'
                  : 'Service is temporarily paused from new customer inquiries'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: '#1e293b', true: '#2563eb' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Service Description</Text>
          <Text style={styles.descriptionText}>{service.description}</Text>
        </View>

        {/* Celebration Custom Pricing Matrix */}
        {Boolean(service.celebrationPricing && Object.keys(service.celebrationPricing).length > 0) && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#f43f5e" />
                <Text style={styles.cardSectionTitle}>Celebration Custom Rates Matrix</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{Object.keys(service.celebrationPricing || {}).length} Themes Configured</Text>
              </View>
            </View>

            {Object.entries(service.celebrationPricing || {}).map(([celebKey, rates]: [string, any]) => {
              const label = CELEBRATION_NAMES[celebKey] || celebKey.replace(/_/g, ' ');
              const hasHall = rates?.baseHallPrice !== undefined && Number(rates.baseHallPrice) > 0;
              const hasVeg = rates?.pricePerPlateVeg !== undefined && Number(rates.pricePerPlateVeg) > 0;
              const hasNonVeg = rates?.pricePerPlateNonVeg !== undefined && Number(rates.pricePerPlateNonVeg) > 0;

              return (
                <View key={celebKey} style={styles.celebPriceRowCard}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.celebTitleText}>{label}</Text>
                    {hasHall ? (
                      <Text style={styles.celebHallText}>
                        Hall Base: <Text style={{ color: '#ffffff', fontWeight: '800' }}>₹{Number(rates.baseHallPrice).toLocaleString('en-IN')}</Text>
                      </Text>
                    ) : (
                      <Text style={styles.celebHallText}>Standard Hall Base</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    {hasVeg && (
                      <Text style={styles.celebVegRateText}>
                        🟢 Veg: ₹{rates.pricePerPlateVeg}/plt
                      </Text>
                    )}
                    {hasNonVeg && (
                      <Text style={styles.celebNonVegRateText}>
                        🔴 Non-Veg: ₹{rates.pricePerPlateNonVeg}/plt
                      </Text>
                    )}
                    {!hasVeg && !hasNonVeg && (
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Default Package</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Venue Amenities & Parking Specifications */}
        {(() => {
          const p = service.amenitiesPolicy || {};
          const cars = p.parkingCapacityCars !== undefined ? p.parkingCapacityCars : 100;
          const bikes = p.parkingCapacityBikes !== undefined ? p.parkingCapacityBikes : 200;
          const hasValet = p.valetAvailable ?? true;
          const hasAc = p.centralAc !== false;
          const hasDg = p.powerBackup || '100% DG Generator Backup';
          const bridal = p.bridalRoomsCount !== undefined ? p.bridalRoomsCount : 2;
          const guestR = p.guestRoomsCount !== undefined ? p.guestRoomsCount : 4;
          const djCutoff = p.djCutoffTime || '10:30 PM';
          const djPol = p.djPolicy || 'In-house DJ Permitted';
          const catPol = p.cateringPolicy || 'In-house & Outside Catering';
          const alcPol = p.alcoholPolicy || 'Allowed (with 1-Day Permit)';
          const outDec = p.outsideDecoratorAllowed !== false;
          const cctv = p.cctvSecurity !== false;

          return (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Car size={16} color="#38bdf8" />
                  <Text style={styles.cardSectionTitle}>Venue Amenities & Parking</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                  <ShieldCheck size={11} color="#38bdf8" />
                  <Text style={[styles.badgePillText, { color: '#38bdf8' }]}>Partner Specs</Text>
                </View>
              </View>

              {/* 2-column Grid */}
              <View style={styles.amenitiesGrid}>
                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Car size={16} color="#60a5fa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{cars}+ Cars</Text>
                    <Text style={styles.amenitySub}>Car Parking</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Car size={16} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{bikes}+ Bikes</Text>
                    <Text style={styles.amenitySub}>2-Wheeler Parking</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: hasValet ? 'rgba(52, 211, 153, 0.15)' : '#1e293b' }]}>
                    <CheckCircle2 size={16} color={hasValet ? '#34d399' : '#64748b'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{hasValet ? 'Available' : 'Self Parking'}</Text>
                    <Text style={styles.amenitySub}>Valet Parking</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Wind size={16} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{hasAc ? 'Central AC' : 'Standard'}</Text>
                    <Text style={styles.amenitySub}>Climate Control</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Zap size={16} color="#fbbf24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{hasDg.includes('100%') ? '100% DG' : 'Backup'}</Text>
                    <Text style={styles.amenitySub}>Power DG Backup</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Bed size={16} color="#f43f5e" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{bridal} Rooms</Text>
                    <Text style={styles.amenitySub}>Bridal / Green AC</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Bed size={16} color="#a78bfa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{guestR} Rooms</Text>
                    <Text style={styles.amenitySub}>Guest Stay Rooms</Text>
                  </View>
                </View>

                <View style={styles.amenityCard}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: '#1e293b' }]}>
                    <Music size={16} color="#f472b6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.amenityVal}>{djCutoff}</Text>
                    <Text style={styles.amenitySub}>Music Curfew</Text>
                  </View>
                </View>
              </View>

              {/* Policies List */}
              <View style={styles.policiesCard}>
                <Text style={styles.policiesTitle}>VENUE POLICIES & PERMISSIONS</Text>
                <View style={styles.policyRow}>
                  <Utensils size={14} color="#64748b" />
                  <Text style={styles.policyKey}>Catering:</Text>
                  <Text style={styles.policyVal}>{catPol}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Music size={14} color="#64748b" />
                  <Text style={styles.policyKey}>DJ & Sound:</Text>
                  <Text style={styles.policyVal}>{djPol}</Text>
                </View>
                <View style={styles.policyRow}>
                  <Sparkles size={14} color="#64748b" />
                  <Text style={styles.policyKey}>Outside Decorators:</Text>
                  <Text style={[styles.policyVal, { color: outDec ? '#4ade80' : '#f87171' }]}>
                    {outDec ? 'Allowed with prior notice' : 'Venue Decorators Only'}
                  </Text>
                </View>
                <View style={styles.policyRow}>
                  <Clock size={14} color="#64748b" />
                  <Text style={styles.policyKey}>Bar & Alcohol:</Text>
                  <Text style={styles.policyVal}>{alcPol}</Text>
                </View>
                <View style={[styles.policyRow, { borderBottomWidth: 0 }]}>
                  <ShieldCheck size={14} color="#64748b" />
                  <Text style={styles.policyKey}>Security:</Text>
                  <Text style={styles.policyVal}>{cctv ? '24/7 CCTV & Guards' : 'Standard Security'}</Text>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Optional Add-on Services */}
        {Boolean(service.addOnServices && service.addOnServices.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Optional Add-on Services</Text>
            {service.addOnServices?.map((addon) => (
              <View key={addon.id} style={styles.addonCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  {addon.description ? <Text style={styles.addonDesc}>{addon.description}</Text> : null}
                </View>
                <Text style={styles.addonPrice}>+₹{addon.price.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Fixed Packages */}
        {Boolean(service.packages && service.packages.length > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>In-House Event Packages</Text>
            {service.packages?.map((pkg, idx) => (
              <View key={idx} style={styles.addonCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addonName}>{pkg.name}</Text>
                  <Text style={styles.addonDesc}>Up to {pkg.guests} Guests{pkg.description ? ` • ${pkg.description}` : ''}</Text>
                </View>
                <Text style={styles.addonPrice}>₹{pkg.price.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Amenities List */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Included Features & Amenities</Text>
          <View style={styles.featureGrid}>
            {service.features.map((feat, idx) => (
              <View key={idx} style={styles.featureBadge}>
                <CheckCircle2 size={12} color="#60a5fa" />
                <Text style={styles.featureBadgeText}>{feat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Address & Google Maps Direction */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Venue / Business Address</Text>
          <Text style={styles.addressText}>{service.location || 'Location not specified'}</Text>
          {Boolean(service.mapUrl || (service.latitude && service.longitude)) && (
            <TouchableOpacity
              style={styles.mapsBtn}
              onPress={() => {
                const url = service.mapUrl || (service.latitude && service.longitude ? `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.name + ' ' + (service.location || ''))}`);
                Linking.openURL(url).catch(() => {});
              }}
            >
              <Navigation size={14} color="#ffffff" />
              <Text style={styles.mapsBtnText}>📍 Open in Google Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Button CTA */}
        <TouchableOpacity
          style={styles.editServiceCta}
          onPress={() => router.push({ pathname: '/edit-service', params: { id: service.id } })}
        >
          <Edit3 size={18} color="#ffffff" />
          <Text style={styles.editServiceCtaText}>Edit Service Details</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editServiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editServiceCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  scroll: { padding: 20, paddingBottom: 40 },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#0d1117',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  categoryBadge: { fontSize: 11, fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 0.5 },
  serviceName: { fontSize: 18, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#0d1117',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1c2438',
    alignItems: 'center',
    gap: 2,
  },
  statVal: { fontSize: 16, fontWeight: '900', color: '#ffffff', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#64748b' },
  card: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1c2438',
    marginBottom: 16,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  toggleSub: { fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 16 },
  cardSectionTitle: { fontSize: 14, fontWeight: '800', color: '#ffffff', marginBottom: 10 },
  descriptionText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161f30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222f47',
  },
  featureBadgeText: { fontSize: 12, fontWeight: '700', color: '#e2e8f0' },
  addressText: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  badgePill: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f43f5e',
  },
  celebPriceRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  celebTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  celebHallText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  celebVegRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80',
  },
  celebNonVegRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f87171',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityCard: {
    width: (width - 66) / 2,
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  amenitySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  policiesCard: {
    backgroundColor: '#090d16',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  policiesTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#161f30',
  },
  policyKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    minWidth: 110,
  },
  policyVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e2e8f0',
    flex: 1,
  },
  addonCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  addonName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  addonDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
