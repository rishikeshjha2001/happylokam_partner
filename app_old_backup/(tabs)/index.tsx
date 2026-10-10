import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/constants/theme';

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = await AsyncStorage.getItem('partner_token');
      const response = await fetch('https://api.happylokam.com/api/v1/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMetrics(data.data || { revenue: 0, pending: 0, active: 0, rating: 'N/A' });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, Partner!</Text>
      </View>
      
      {loading ? <ActivityIndicator size="large" color="#e11d48" /> : (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Today's Revenue</Text>
            <Text style={styles.metricValue}>₹{metrics?.revenue || 0}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending Requests</Text>
            <Text style={styles.metricValue}>{metrics?.pending || 0}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active Listings</Text>
            <Text style={styles.metricValue}>{metrics?.active || 0}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Rating</Text>
            <Text style={styles.metricValue}>{metrics?.rating || 'N/A'}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Booking Requests</Text>
      
      <View style={styles.emptyStateCard}>
        <Text style={styles.emptyStateTitle}>No Recent Requests</Text>
        <Text style={styles.emptyStateSubtitle}>You have no pending booking requests right now. Your listings will appear here once customers book them.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.lg },
  welcomeText: { fontSize: 28, fontWeight: '900', color: theme.colors.text },
  metricsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  metricCard: { width: '48%', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: 16, marginBottom: theme.spacing.sm, shadowColor: '#e11d48', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  metricLabel: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 4, fontWeight: '600' },
  metricValue: { fontSize: 24, fontWeight: '900', color: '#e11d48' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: theme.colors.text, marginBottom: theme.spacing.md },
  emptyStateCard: { backgroundColor: theme.colors.surface, padding: 32, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
