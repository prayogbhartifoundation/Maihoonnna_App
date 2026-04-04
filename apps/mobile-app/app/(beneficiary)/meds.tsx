import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MOCK_MEDS = [
    { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Diabetes Management', time: '08:00 AM', taken: false },
    { id: '2', name: 'Lisinopril', dosage: '10mg', frequency: 'Blood Pressure', time: '09:00 AM', taken: true },
    { id: '3', name: 'Aspirin', dosage: '75mg', frequency: 'Cardiac Protection', time: '08:00 AM', taken: false },
];

export default function MedsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#FDE6D2', '#FFDDC2']} style={styles.header}>
                <Text style={styles.headerTitle}>Medications</Text>
                <Text style={styles.headerSub}>Today's medication schedule</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {MOCK_MEDS.map(med => (
                    <View key={med.id} style={styles.medCard}>
                        <View style={styles.medIcon}>
                            <MaterialCommunityIcons name="pill" size={24} color="#4A90E2" />
                        </View>
                        <View style={styles.medInfo}>
                            <Text style={styles.medName}>{med.name} — {med.dosage}</Text>
                            <Text style={styles.medFreq}>{med.frequency}</Text>
                            <View style={styles.timeRow}>
                                <Feather name="clock" size={13} color="#9CA3AF" />
                                <Text style={styles.medTime}>{med.time}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, med.taken ? styles.takenBadge : styles.pendingBadge]}>
                            <Text style={[styles.statusText, med.taken ? styles.takenText : styles.pendingText]}>
                                {med.taken ? 'Taken' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5ED' },
    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827', fontFamily: 'Outfit-Bold' },
    headerSub: { fontSize: 15, color: '#374151', marginTop: 4, fontFamily: 'Outfit-Regular' },
    content: { padding: 20, gap: 12 },
    medCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    medIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    medInfo: { flex: 1 },
    medName: { fontSize: 15, fontWeight: '600', color: '#111827', fontFamily: 'Outfit-SemiBold' },
    medFreq: { fontSize: 13, color: '#6B7280', marginTop: 2, fontFamily: 'Outfit-Regular' },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    medTime: { fontSize: 13, color: '#9CA3AF', fontFamily: 'Outfit-Regular' },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
    takenBadge: { backgroundColor: '#ECFDF5' },
    takenText: { color: '#10B981' },
    pendingBadge: { backgroundColor: '#FFF7ED' },
    pendingText: { color: '#F59E0B' },
});
