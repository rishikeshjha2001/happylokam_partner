import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/constants/theme';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState('Pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const tabs = ['Pending', 'Confirmed', 'Completed'];

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('partner_token');
      const response = await fetch(`https://api.happylokam.com/api/v1/bookings/partner?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data.data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e11d48" />
        ) : bookings.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 20}}>No {activeTab.toLowerCase()} bookings found.</Text>
        ) : (
          bookings.map((booking: any) => (
            <View key={booking.id || Math.random().toString()} style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>{booking.title || 'Service Booking'}</Text>
              <Text style={styles.bookingDate}>{booking.date || 'TBD'}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{activeTab}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing.sm },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, alignItems: 'center', borderRadius: theme.borderRadius.full },
  activeTab: { backgroundColor: theme.colors.primaryLight },
  tabText: { color: theme.colors.textSecondary, fontWeight: '500' },
  activeTabText: { color: theme.colors.surface, fontWeight: 'bold' },
  content: { padding: theme.spacing.md },
  bookingCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md },
  bookingTitle: { fontSize: 16, fontWeight: 'bold' },
  bookingDate: { color: theme.colors.textSecondary, marginVertical: theme.spacing.xs },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.border, borderRadius: theme.borderRadius.sm, marginTop: theme.spacing.sm },
  statusText: { fontSize: 12, fontWeight: '600', color: theme.colors.text },
});
