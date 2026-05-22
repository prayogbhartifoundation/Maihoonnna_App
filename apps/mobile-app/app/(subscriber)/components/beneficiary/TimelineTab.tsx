import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConnectContactButton } from '@/components/shared/ConnectContactModal';

interface VisitProps {
    id: string;
    companionName: string;
    companionPhoto?: string;
    companionPhone?: string | null;
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
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            {visits.map((visit, i) => (
                <View key={visit.id || i} style={styles.visitCard}>
                    {/* Header: Avatar, Info, Status/Rate */}
                    <View style={styles.visitHeader}>
                        <Image
                            source={{ uri: visit.companionPhoto || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                            style={styles.visitCompanionPhoto}
                        />
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                                <Text style={styles.visitCompanionName}>{visit.companionName || 'Care Companion'}</Text>
                                <ConnectContactButton
                                    name={visit.companionName || 'Care Companion'}
                                    role="Care Companion"
                                    phone={visit.companionPhone || null}
                                    photo={visit.companionPhoto}
                                />
                            </View>
                            <Text style={styles.visitDate}>{visit.dateStr || 'Recent visit'}</Text>
                            <Text style={styles.visitDuration}>{visit.duration || '1.5 hours'}</Text>
                        </View>
                        
                        {visit.rated ? (
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Ionicons 
                                        key={s} 
                                        name={s <= (visit.rating || 5) ? "star" : "star-outline"} 
                                        size={16} 
                                        color="#F97316" 
                                        style={{ marginRight: 2 }}
                                    />
                                ))}
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.rateButton}>
                                <Text style={styles.rateButtonText}>Rate</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Activities Pills */}
                    {!!visit.activities && visit.activities.length > 0 ? (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={styles.visitSectionLabel}>Activities:</Text>
                            <View style={styles.activitiesTags}>
                                {visit.activities.map((a, j) => (
                                    <View key={j} style={styles.activityTag}>
                                        <Text style={styles.activityTagText}>{a}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : null}

                    {/* Vitals Blocks */}
                    {!!(visit.bp || visit.heartRate || visit.bloodSugar) ? (
                        <View style={styles.vitalsRow}>
                            {!!visit.bp ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>BP</Text>
                                    <Text style={styles.vitalValue}>{visit.bp}</Text>
                                </View>
                            ) : null}
                            
                            {!!visit.heartRate ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                                    <Text style={styles.vitalValue}>{visit.heartRate}</Text>
                                </View>
                            ) : null}
                            
                            {!!visit.bloodSugar ? (
                                <View style={styles.vitalChip}>
                                    <Text style={styles.vitalLabel}>Blood Sugar</Text>
                                    <Text style={styles.vitalValue}>{visit.bloodSugar}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    {/* Notes Section */}
                    {!!visit.notes ? (
                        <View style={{ marginTop: 4 }}>
                            <Text style={styles.visitSectionLabel}>Notes:</Text>
                            <Text style={styles.visitNotes}>{visit.notes}</Text>
                        </View>
                    ) : null}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    emptyTab: { alignItems: 'center', paddingVertical: 40 },
    emptyTabText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
    
    visitCard: {
        backgroundColor: '#EAEAEA', 
        borderRadius: 16, 
        padding: 18, 
        marginBottom: 16,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4 },
            android: { elevation: 1 },
        }),
    },
    
    visitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    visitCompanionPhoto: { width: 48, height: 48, borderRadius: 24, marginRight: 14, backgroundColor: '#D1D5DB' },
    visitCompanionName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
    visitDate: { fontSize: 12, color: '#4B5563', fontWeight: '500', marginBottom: 2 },
    visitDuration: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
    
    starsRow: { flexDirection: 'row', alignItems: 'center' },
    rateButton: { 
        backgroundColor: '#F97316', 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 7,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rateButtonText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    
    visitSectionLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8 },
    activitiesTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    activityTag: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 5,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2 },
            android: { elevation: 0.5 },
        }),
    },
    activityTagText: { fontSize: 12, color: '#1F2937', fontWeight: '500' },
    
    vitalsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    vitalChip: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 8, 
        paddingVertical: 8,
        paddingHorizontal: 12, 
        flex: 1, 
        alignItems: 'flex-start',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
            android: { elevation: 1 },
        }),
    },
    vitalLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginBottom: 3 },
    vitalValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
    
    visitNotes: { fontSize: 13, color: '#374151', lineHeight: 18, fontWeight: '500' },
});

export default TimelineTab;
