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
} from 'lucide-react-native';
import PartnerDatabase, { PartnerServiceItem } from '../services/partnerDatabase';
import { PARTNER_API } from '../constants/api';
import CustomAlert from '../components/CustomAlert';

export default function ServiceDetailsScreen() {
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

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Venue / Business Address</Text>
          <Text style={styles.addressText}>{service.location || 'Location not specified'}</Text>
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
});
