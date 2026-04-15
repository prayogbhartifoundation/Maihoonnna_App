import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VisitProps {
    id: string;
    companionName: string;
    companionPhoto?: string;
    dateStr: string;
    duration: string;
    rated: boolean;
    rating?: number;
    activities: string[];
    bp?: string;
    heartRate?: string;
    bloodSugar?: string;
    notes?: string;
}

export const TimelineTab = ({ visits }: { visits: VisitProps[] }) => {
    if (visits.length === 0) {
        return (
            <View style={styles.emptyTab}>
                <Ionicons name="time-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyTabText}>No visits recorded yet.</Text>
            </View>
        );
    }

    return (
        <View style={{ paddingHorizontal: 20 }}>
            {visits.map((visit, i) => (
                <View key={visit.id || i} style={styles.visitCard}>
                    <View style={styles.visitHeader}>
                        <Image
                            source={{ uri: visit.companionPhoto || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                            style={styles.visitCompanionPhoto}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.visitCompanionName}>{visit.companionName || 'Care Companion'}</Text>
                            <Text style={styles.visitDate}>{visit.dateStr || 'Recent visit'}</Text>
                            <Text style={styles.visitDuration}>{visit.duration || '1.5 hours'}</Text>
                        </View>
                        {visit.rated ? (
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Ionicons key={s} name={s <= (visit.rating || 4) ? "star" : "star-outline"} size={14} color="#F59E0B" />
                                ))}
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.rateButton}>
                                <Text style={styles.rateButtonText}>Rate</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Activities */}
                    {visit.activities && visit.activities.length > 0 && (
                        <View>
                            <Text style={styles.visitSectionLabel}>Activities:</Text>
                            <View style={styles.activitiesTags}>
                                {visit.activities.map((a, j) => (
                                    <View key={j} style={styles.activityTag}>
                                        <Text style={styles.activityTagText}>{a}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Vitals inline */}
                    {(visit.bp || visit.heartRate || visit.bloodSugar) && (
                        <View style={styles.vitalsRow}>
                            {visit.bp && <View style={styles.vitalChip}><Text style={styles.vitalLabel}>BP</Text><Text style={styles.vitalValue}>{visit.bp}</Text></View>}
                            {visit.heartRate && <View style={styles.vitalChip}><Text style={styles.vitalLabel}>Heart Rate</Text><Text style={styles.vitalValue}>{visit.heartRate}</Text></View>}
                            {visit.bloodSugar && <View style={styles.vitalChip}><Text style={styles.vitalLabel}>Blood Sugar</Text><Text style={styles.vitalValue}>{visit.bloodSugar}</Text></View>}
                        </View>
                    )}

                    {visit.notes && (
                        <View>
                            <Text style={styles.visitSectionLabel}>Notes:</Text>
                            <Text style={styles.visitNotes}>{visit.notes}</Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyTab: { alignItems: 'center', paddingVertical: 40 },
    emptyTabText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
    visitCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    visitHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    visitCompanionPhoto: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#E5E7EB' },
    visitCompanionName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 3 },
    visitDate: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    visitDuration: { fontSize: 12, color: '#9CA3AF' },
    starsRow: { flexDirection: 'row' },
    rateButton: { backgroundColor: '#F97316', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
    rateButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    visitSectionLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
    activitiesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    activityTag: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
    activityTagText: { fontSize: 12, color: '#374151' },
    vitalsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    vitalChip: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, flex: 1, alignItems: 'center' },
    vitalLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
    vitalValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
    visitNotes: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
});

export default TimelineTab;
