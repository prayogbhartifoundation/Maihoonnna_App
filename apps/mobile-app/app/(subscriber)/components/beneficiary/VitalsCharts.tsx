import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface TrendData {
    labels: string[];
    bpSystolic: number[];
    heartRate: number[];
    bloodSugar: number[];
}

export const VitalsCharts = ({ trends }: { trends: TrendData }) => {
    if (!trends || !trends.labels || trends.labels.length === 0) {
        return (
            <View style={styles.empty}>
                <Text style={styles.emptyText}>Not enough data for vitals trends.</Text>
            </View>
        );
    }

    const renderChart = (title: string, data: number[], unit: string, color: string) => {
        const max = Math.max(...data, 1);
        
        return (
            <View style={styles.chartWrap}>
                <Text style={styles.chartTitle}>{title}</Text>
                <View style={styles.chartArea}>
                    {data.map((val, i) => {
                        const height = (val / max) * 100;
                        return (
                            <View key={i} style={styles.barGroup}>
                                <View style={[styles.bar, { height: `${height}%`, backgroundColor: color }]} />
                                <Text style={styles.label}>{trends.labels[i].split(' ')[1]}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Vitals Trends (Last 7 Days)</Text>
            </View>
            {renderChart('Blood Pressure (Systolic)', trends.bpSystolic, 'mmHg', '#8B5CF6')}
            {renderChart('Heart Rate (BPM)', trends.heartRate, 'bpm', '#EF4444')}
            {renderChart('Blood Sugar (mg/dL)', trends.bloodSugar, 'mg/dL', '#F59E0B')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 16, fontWeight: '700', color: '#111827' },
    chartWrap: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12 },
    chartTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 20 },
    chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 5 },
    barGroup: { alignItems: 'center', flex: 1 },
    bar: { width: 12, borderRadius: 6, marginBottom: 8 },
    label: { fontSize: 9, color: '#9CA3AF' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF', fontSize: 14 },
});
