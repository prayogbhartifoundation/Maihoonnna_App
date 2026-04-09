import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NextVisitProps {
    nextVisit: {
        companionName: string;
        companionPhoto?: string;
        dateStr: string;
        timeStr: string;
    } | null;
}

export const NextVisitCard = ({ nextVisit }: NextVisitProps) => {
    if (!nextVisit) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="calendar" size={18} color="#F97316" />
                <Text style={styles.headerTitle}>Next Scheduled Visit</Text>
            </View>
            <View style={styles.content}>
                <Image
                    source={{ uri: nextVisit.companionPhoto || 'https://randomuser.me/api/portraits/women/2.jpg' }}
                    style={styles.photo}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{nextVisit.companionName}</Text>
                    <Text style={styles.meta}>assigned by Field Manager</Text>
                    <View style={styles.dateTime}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.dateText}>{nextVisit.dateStr} • {nextVisit.timeStr}</Text>
                    </View>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Upcoming</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    headerTitle: { fontSize: 13, fontWeight: '600', color: '#F97316', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    content: { flexDirection: 'row', alignItems: 'center' },
    photo: { width: 50, height: 50, borderRadius: 25, marginRight: 15, backgroundColor: '#F3F4F6' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
    meta: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
    dateTime: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 13, color: '#4B5563', marginLeft: 4, fontWeight: '500' },
    statusBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#16A34A', fontSize: 11, fontWeight: '600' },
});
