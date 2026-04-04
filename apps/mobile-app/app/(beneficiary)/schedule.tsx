import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScheduleScreen() {
    const upcomingVisits = [
        {
            id: '1',
            companionName: 'Sarah Singh',
            date: 'Tomorrow',
            time: '10:00 AM',
            type: 'Home Visit',
            status: 'scheduled',
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <LinearGradient colors={['#FDE6D2', '#FFDDC2']} style={styles.header}>
                <Text style={styles.headerTitle}>Schedule</Text>
                <Text style={styles.headerSub}>Your upcoming visits</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {upcomingVisits.length > 0 ? (
                    upcomingVisits.map(visit => (
                        <View key={visit.id} style={styles.visitCard}>
                            <View style={styles.visitDateCol}>
                                <Text style={styles.visitDay}>{visit.date}</Text>
                                <Text style={styles.visitTime}>{visit.time}</Text>
                            </View>
                            <View style={styles.dividerVertical} />
                            <View style={styles.visitInfo}>
                                <Text style={styles.visitCompanion}>{visit.companionName}</Text>
                                <View style={styles.visitTypeBadge}>
                                    <Text style={styles.visitTypeText}>{visit.type}</Text>
                                </View>
                            </View>
                            <View style={styles.statusDot} />
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Feather name="calendar" size={48} color="#E5E7EB" />
                        <Text style={styles.emptyTitle}>No Upcoming Visits</Text>
                        <Text style={styles.emptySubtitle}>Your scheduled visits will appear here.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5ED' },
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 28,
    },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827', fontFamily: 'Outfit-Bold' },
    headerSub: { fontSize: 15, color: '#374151', marginTop: 4, fontFamily: 'Outfit-Regular' },
    content: { padding: 20, gap: 16 },
    visitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    visitDateCol: { alignItems: 'center', width: 72 },
    visitDay: { fontWeight: '700', color: '#FF6B00', fontSize: 14, fontFamily: 'Outfit-SemiBold' },
    visitTime: { fontSize: 13, color: '#6B7280', marginTop: 4, fontFamily: 'Outfit-Regular' },
    dividerVertical: { width: 1, height: 44, backgroundColor: '#F3F4F6', marginHorizontal: 12 },
    visitInfo: { flex: 1 },
    visitCompanion: { fontSize: 16, fontWeight: '600', color: '#111827', fontFamily: 'Outfit-SemiBold' },
    visitTypeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF7ED',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 6,
    },
    visitTypeText: { fontSize: 12, color: '#FF6B00', fontWeight: '600', fontFamily: 'Outfit-Medium' },
    statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginLeft: 8 },
    emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', fontFamily: 'Outfit-SemiBold' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', fontFamily: 'Outfit-Regular' },
});
