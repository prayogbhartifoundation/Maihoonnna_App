import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SchedulePreferencesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [visitTiming, setVisitTiming] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleEnrollment = () => {
        if (!agreed) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        router.push({
            pathname: '/(setup)/checkout',
            params: {
                packageId: params.packageId,
                subscriberData: params.subscriberData,
                beneficiaryData: params.beneficiaryData,
                medicalData: params.medicalData,
                emergencyContacts: params.emergencyContacts,
                preferencesData: JSON.stringify({ preferredTiming: visitTiming })
            }
        });
    };

    const handleBack = () => {
        router.back();
    };

    const TimingPill = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.timingPill, active && styles.timingPillActive]}
            onPress={onPress}
        >
            <Text style={[styles.timingText, active && styles.timingTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Subscribe to Care</Text>
                            <Text style={styles.headerSubtitle}>Step 5 of 5</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#111827" />
                                <View style={styles.notifBadge}><Text style={styles.notifText}>2</Text></View>
                            </View>
                            <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '100%' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Schedule Preferences</Text>

                        <Text style={styles.label}>Preferred Visit Timing *</Text>
                        <View style={styles.pillContainer}>
                            <TimingPill
                                label="Morning (8AM - 12 PM)"
                                active={visitTiming === 'Morning'}
                                onPress={() => setVisitTiming('Morning')}
                            />
                            <TimingPill
                                label="Afternoon (12PM - 4 PM)"
                                active={visitTiming === 'Afternoon'}
                                onPress={() => setVisitTiming('Afternoon')}
                            />
                            <TimingPill
                                label="Evening (4PM - 8 PM)"
                                active={visitTiming === 'Evening'}
                                onPress={() => setVisitTiming('Evening')}
                            />
                        </View>

                        <View style={styles.agreementBox}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => setAgreed(!agreed)}
                            >
                                <Ionicons
                                    name={agreed ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={agreed ? "#F97316" : "#9CA3AF"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.agreementText}>
                                I agree to the <Text style={styles.boldText}>Terms of Service</Text> and <Text style={styles.boldText}>Privacy Policy</Text>. I understand that this is a demo application and no actual data will be stored.
                            </Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Buttons - Stacking them exactly as per the Mockup */}
                <View style={styles.buttonContainerStacked}>
                    <TouchableOpacity style={styles.completeBtn} onPress={handleEnrollment}>
                        <Text style={styles.completeBtnText}>Complete Enrollment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.prevBtnStacked} onPress={handleBack}>
                        <Text style={styles.prevBtnTextStacked}>Previous</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    header: { backgroundColor: '#FFFFFF', paddingTop: 10 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40 },
    headerTextContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
    notifBadge: { position: 'absolute', right: -4, top: -2, backgroundColor: '#E46C2B', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 4, backgroundColor: '#F97316', width: '100%' },

    scrollContent: { padding: 15 },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 },

    label: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 15 },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 30 },
    timingPill: { backgroundColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginEnd: 10, marginBottom: 10 },
    timingPillActive: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F97316' },
    timingText: { color: '#4B5563', fontSize: 13, fontWeight: '500' },
    timingTextActive: { color: '#111827', fontWeight: '600' },

    agreementBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, marginBottom: 20 },
    checkbox: { marginRight: 12 },
    agreementText: { flex: 1, fontSize: 13, color: '#4B5563', lineHeight: 20 },
    boldText: { fontWeight: '600', color: '#111827' },

    buttonContainerStacked: { paddingHorizontal: 20, paddingVertical: 20 },
    completeBtn: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 15 },
    completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    prevBtnStacked: { borderWidth: 1, borderColor: '#F97316', borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: '#FFFFFF' },
    prevBtnTextStacked: { color: '#F97316', fontSize: 16, fontWeight: '600' }
});
