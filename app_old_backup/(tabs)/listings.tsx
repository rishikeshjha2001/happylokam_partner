import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/constants/theme';

export default function ListingsScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const token = await AsyncStorage.getItem('partner_token');
      const response = await fetch('https://api.happylokam.com/api/v1/listings/partner', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setListings(data.data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#e1d48" />
        ) : listings.length === 0 ? (
          <Text style={{textAlign: 'center'}}>No listings found.</Text>
        ) : (
          listings.map((item: any) => (
            <View key={item.id || Math.random().toString()} style={styles.listingCard}>
              <Text style={styles.listingTitle}>{item.title || 'Listing'}</Text>
              <Text style={styles.listingPrice}>₹{item.price || 0} / day</Text>
              <View style={styles.statusBadgeActive}>
                <Text style={styles.statusTextActive}>Active</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.fab}>
        <Plus color="#fff" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.md },
  listingCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md },
  listingTitle: { fontSize: 16, fontWeight: 'bold' },
  listingPrice: { color: theme.colors.primary, fontWeight: '600', marginTop: theme.spacing.xs },
  statusBadgeActive: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.success + '20', borderRadius: theme.borderRadius.sm, marginTop: theme.spacing.sm },
  statusTextActive: { fontSize: 12, fontWeight: '600', color: theme.colors.success },
  fab: { position: 'absolute', bottom: theme.spacing.xl, right: theme.spacing.md, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
});
