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
  BackHandler,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  MapPin,
  Tag,
  DollarSign,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { PARTNER_API } from '../../constants/api';
import PartnerDatabase, { PartnerServiceItem } from '../../services/partnerDatabase';
import CustomAlert from '../../components/CustomAlert';
import ExitConfirmModal from '../../components/ExitConfirmModal';

export default function ServicesScreen() {
  const [services, setServices] = useState<PartnerServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type?: any;
    title: string;
    message: string;
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
  });

  // Android Back Button Handler
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

  const fetchServices = useCallback(async () => {
    try {
      const session = await PartnerDatabase.getSession();
      if (!session) return;

      const cached = await PartnerDatabase.getServices();
      if (cached.length > 0) {
        setServices(cached);
      } else {
        const demoServices: PartnerServiceItem[] = [
          {
            id: 'srv-1',
            name: 'Grand Royal Ballroom',
            description:
              'Central AC banquet hall with 800+ seating capacity, crystal chandeliers, stage setup and green rooms.',
            category: 'Venue',
            subCategory: 'AC Banquet Hall',
            pricing: 75000,
            pricingUnit: 'PER_EVENT',
            capacity: 850,
            images: [],
            documents: [],
            features: ['AC Hall', 'Stage Lighting', 'Valet Parking', 'Power Backup'],
            location: 'Road No 36, Jubilee Hills',
            city: 'Hyderabad',
            availability: 'AVAILABLE',
            status: 'APPROVED',
            rating: 4.9,
            totalBookings: 12,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'srv-2',
            name: 'Royal Heritage Open Lawn',
            description:
              'Lush green open air lawn for destination weddings and reception celebrations under fairy lights.',
            category: 'Venue',
            subCategory: 'Open Lawn',
            pricing: 55000,
            pricingUnit: 'PER_EVENT',
            capacity: 1200,
            images: [],
            documents: [],
            features: ['Open Lawn', 'Gazebo Stage', 'Ample Parking', 'Fairy Lights'],
            location: 'Financial District',
            city: 'Hyderabad',
            availability: 'AVAILABLE',
            status: 'UNDER_REVIEW',
            rating: 4.8,
            totalBookings: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'srv-3',
            name: 'Deluxe Multi-Cuisine Catering',
            description:
              'Authentic South & North Indian live counters, tandoor, desserts and mocktail bar.',
            category: 'Catering',
            subCategory: 'Multi-Cuisine Buffet',
            pricing: 650,
            pricingUnit: 'PER_PLATE',
            capacity: 1500,
            images: [],
            documents: [],
            features: ['Live Counters', 'Tandoor', 'Dessert Bar', 'Mocktail Station'],
            location: 'Hyderabad',
            city: 'Hyderabad',
            availability: 'AVAILABLE',
            status: 'APPROVED',
            rating: 5.0,
            totalBookings: 8,
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];
        setServices(demoServices);
        await PartnerDatabase.saveServices(demoServices);
      }

      // Quick fetch from backend if connected
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`${PARTNER_API}/services`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setServices(json.data);
          await PartnerDatabase.saveServices(json.data);
        }
      } catch (netErr) {
        // Offline
      }
    } catch (e) {
      console.log('Error in fetchServices:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  const handleDeleteService = (id: string, serviceName: string) => {
    setAlertConfig({
      visible: true,
      type: 'exit',
      title: 'Delete Service?',
      message: `Are you sure you want to delete "${serviceName}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = services.filter((s) => s.id !== id);
            setServices(updated);
            await PartnerDatabase.saveServices(updated);
          },
        },
      ],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: '#052e16',
          text: '#4ade80',
          border: '#15803d',
          label: 'Live & Approved',
          icon: <CheckCircle2 size={12} color="#4ade80" />,
        };
      case 'REJECTED':
        return {
          bg: '#450a0a',
          text: '#f87171',
          border: '#b91c1c',
          label: 'Rejected',
          icon: <XCircle size={12} color="#f87171" />,
        };
      default:
        return {
          bg: '#422006',
          text: '#fbbf24',
          border: '#b45309',
          label: 'Under Admin Review',
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
          <Text style={styles.headerTitle}>My Services</Text>
          <Text style={styles.headerSub}>Manage and add your business offerings</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/add-service')}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchServices();
            }}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Admin Approval Info Banner */}
        <View style={styles.infoBanner}>
          <Sparkles size={20} color="#60a5fa" />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Admin Approval System</Text>
            <Text style={styles.infoBannerText}>
              All newly added services go through quality review before publishing to guarantee trust.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loaderText}>Loading your services...</Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layers size={52} color="#334155" />
            <Text style={styles.emptyTitle}>No Services Added Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+ Add New" button above to publish your venue or service.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/add-service')}
            >
              <Plus size={18} color="#ffffff" />
              <Text style={styles.emptyAddBtnText}>Add Your First Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          services.map((item) => {
            const badge = getStatusBadge(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.serviceCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({ pathname: '/service-details', params: { id: item.id } })
                }
              >
                {item.images && item.images.length > 0 ? (
                  <View style={{ height: 130, width: '100%', marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}>
                    <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ) : null}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Tag size={12} color="#94a3b8" />
                      <Text style={styles.categoryText}>
                        {item.category} • {item.subCategory || 'Standard'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteService(item.id, item.name);
                    }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <DollarSign size={14} color="#60a5fa" />
                    <Text style={styles.priceText}>
                      ₹{item.pricing.toLocaleString('en-IN')}{' '}
                      <Text style={styles.priceUnitText}>
                        /{item.pricingUnit ? item.pricingUnit.replace('PER_', '').toLowerCase() : 'event'}
                      </Text>
                    </Text>
                  </View>

                  {item.city ? (
                    <View style={styles.metaItem}>
                      <MapPin size={14} color="#94a3b8" />
                      <Text style={styles.metaText}>{item.city}</Text>
                    </View>
                  ) : null}

                  {item.capacity ? (
                    <View style={styles.metaItem}>
                      <Users size={14} color="#94a3b8" />
                      <Text style={styles.metaText}>{item.capacity} guests</Text>
                    </View>
                  ) : null}
                </View>

                {/* Status Badge Footer */}
                <View style={styles.cardFooterRow}>
                  <View
                    style={[
                      styles.statusFooter,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    {badge.icon}
                    <Text style={[styles.statusFooterText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                  <View style={styles.viewDetailHint}>
                    <Text style={styles.viewDetailText}>Edit & Details</Text>
                    <ChevronRight size={14} color="#60a5fa" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />

      {/* Exit App Confirmation Modal */}
      <ExitConfirmModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0f172a',
    borderColor: '#1e3a8a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoBannerContent: { flex: 1 },
  infoBannerTitle: { fontSize: 14, fontWeight: '700', color: '#93c5fd' },
  infoBannerText: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 17 },
  loaderContainer: { paddingVertical: 60, alignItems: 'center' },
  loaderText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyAddBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  serviceCard: {
    backgroundColor: '#0d1117',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeaderLeft: { flex: 1 },
  serviceName: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  categoryText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  deleteBtn: { padding: 6 },
  serviceDesc: { fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 18 },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 15, fontWeight: '800', color: '#60a5fa' },
  priceUnitText: { fontSize: 12, fontWeight: '400', color: '#94a3b8' },
  metaText: { fontSize: 13, color: '#cbd5e1' },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusFooterText: { fontSize: 11, fontWeight: '800' },
  viewDetailHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText: { fontSize: 12, fontWeight: '700', color: '#60a5fa' },
});
