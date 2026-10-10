import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../../src/constants/theme';

export default function PayoutsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Pending Payout</Text>
        <Text style={styles.balanceAmount}>₹12,500</Text>
        <TouchableOpacity style={styles.requestButton}>
          <Text style={styles.requestButtonText}>Request Payout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Payout History</Text>
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <View>
            <Text style={styles.historyTitle}>Bank Transfer</Text>
            <Text style={styles.historyDate}>Sep 10, 2026</Text>
          </View>
          <Text style={styles.historyAmount}>₹20,000</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  balanceCard: { backgroundColor: theme.colors.primary, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginBottom: theme.spacing.xl },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: theme.spacing.xs },
  balanceAmount: { color: theme.colors.surface, fontSize: 32, fontWeight: 'bold', marginBottom: theme.spacing.lg },
  requestButton: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full },
  requestButtonText: { color: theme.colors.primary, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.md },
  historyCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  historyDate: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  historyAmount: { fontSize: 16, fontWeight: 'bold', color: theme.colors.success },
});
