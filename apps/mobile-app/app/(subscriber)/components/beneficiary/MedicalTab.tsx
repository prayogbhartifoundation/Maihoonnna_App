import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const MedicalTab = ({ beneficiary, conditions }: { beneficiary: any, conditions: string[] }) => {
    return (
        <View style={{ paddingHorizontal: 20 }}>
            {/* Medical Conditions */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Medical Conditions</Text>
                <View style={styles.conditionsTags}>
                    {conditions.map((c: string, i: number) => (
                        <View key={i} style={styles.condTagLarge}>
                            <View style={styles.dot} />
                            <Text style={styles.condTagLargeText}>{c}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Current Vitals (Summary Grid in medical tab as per UI) */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Current Vitals</Text>
                <View style={styles.miniVitalsGrid}>
                    {beneficiary.vitalsData?.map((v: any, i: number) => (
                        <View key={i} style={styles.miniVitalItem}>
                            <Text style={styles.miniVitalLabel}>{v.label}</Text>
                            <Text style={styles.miniVitalValue}>{v.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Medical Records */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Medical Records</Text>
                {beneficiary.medicalRecords?.length > 0 ? (
                    beneficiary.medicalRecords.map((doc: any, i: number) => (
                        <TouchableOpacity key={i} style={styles.docRow}>
                            <Ionicons name="document-text" size={24} color="#F97316" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.docTitle}>{doc.title}</Text>
                                <Text style={styles.docMeta}>{new Date(doc.recordDate).toLocaleDateString()}</Text>
                            </View>
                            <Ionicons name="download-outline" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyRecords}>
                        <Ionicons name="document-outline" size={32} color="#D1D5DB" />
                        <Text style={styles.emptyRecordsText}>No medical records uploaded yet</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.uploadBtn}>
                    <Text style={styles.uploadBtnText}>Upload Documents</Text>
                </TouchableOpacity>
            </View>
            
            {/* Medications */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Current Medications</Text>
                {beneficiary.medicationList?.length > 0 ? (
                    beneficiary.medicationList.map((m: any, i: number) => (
                        <Text key={i} style={styles.medValue}>• {m.name} {m.dosage} ({m.frequency})</Text>
                    ))
                ) : (
                    <Text style={styles.medValue}>No active medications.</Text>
                )}
            </View>

            {/* Physician & Hobbies */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Primary Physician</Text>
                <Text style={styles.medValue}>{beneficiary.primaryPhysicianName || 'Not specified'}</Text>
                <Text style={styles.medSubValue}>{beneficiary.primaryPhysicianPhone || ''} {beneficiary.primaryPhysicianSpec ? `(${beneficiary.primaryPhysicianSpec})` : ''}</Text>
            </View>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Hobbies & Interests</Text>
                <Text style={styles.medValue}>{beneficiary.hobbiesInterests?.join(', ') || 'Not specified'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    medCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    medCardTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    conditionsTags: { gap: 10 },
    condTagLarge: { backgroundColor: '#FFF5ED', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginRight: 10 },
    condTagLargeText: { fontSize: 14, color: '#111827', fontWeight: '500' },
    
    miniVitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    miniVitalItem: { width: (width - 80) / 2, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10 },
    miniVitalLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
    miniVitalValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

    docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    docTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
    docMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    emptyRecords: { alignItems: 'center', paddingVertical: 20 },
    emptyRecordsText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
    uploadBtn: { backgroundColor: '#F97316', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    uploadBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

    medValue: { fontSize: 14, color: '#111827', lineHeight: 22 },
    medSubValue: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
