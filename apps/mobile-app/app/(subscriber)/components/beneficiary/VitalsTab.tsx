import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VitalsCharts } from './VitalsCharts';

const { width } = Dimensions.get('window');

export const VitalsTab = ({ beneficiary }: { beneficiary: any }) => {
    const vitals = beneficiary.vitalsData || [];
    const trends = beneficiary.vitalsTrends;

    return (
        <View style={styles.container}>
            <VitalsCharts trends={trends} />

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Current Readings</Text>
            </View>
            
            <View style={styles.vitalsGrid}>
                {vitals.map((v: any) => (
                    <View key={v.label} style={styles.vitalsGridCard}>
                        <MaterialCommunityIcons name={v.icon as any} size={24} color={v.color} style={{ marginBottom: 8 }} />
                        <Text style={styles.vitalsGridValue}>{v.value}</Text>
                        <Text style={styles.vitalsGridLabel}>{v.label}</Text>
                        <View style={[styles.trendBadge, { backgroundColor: v.trend === 'Good' || v.trend === 'Normal' || v.trend === 'Stable' ? '#ECFDF5' : '#FEF3C7' }]}>
                            <Text style={[styles.trendText, { color: v.trend === 'Slightly High' ? '#D97706' : '#059669' }]}>{v.trend}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingBottom: 20 },
    sectionHeader: { paddingHorizontal: 20, marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
    vitalsGridCard: {
        width: (Platform.OS === 'web' ? 340 : width - 64) / 2,
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    vitalsGridValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    vitalsGridLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    trendBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    trendText: { fontSize: 11, fontWeight: '600' },
});
