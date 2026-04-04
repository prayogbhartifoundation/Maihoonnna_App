import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, Image, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '@/components/CallbackButton';

type TabType = 'Timeline' | 'Vitals' | 'Medical';

export default function BeneficiaryProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;

    const [beneficiary, setBeneficiary] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('Timeline');

    const fetchBeneficiary = async () => {
        try {
            const stored = await AsyncStorage.getItem('userData');
            if (!stored) { router.replace('/(auth)'); return; }

            const res = await fetch(`${API_URL}/subscriber/beneficiaries/${id}`);
            const data = await res.json();
            if (data.success) {
                setBeneficiary(data.data);

                // Also fetch visits
                const visitsRes = await fetch(`${API_URL}/subscriber/dashboard/subscriber/${data.data.subscriberId || ''}`);
                // We'll just use the data from the beneficiary's recentVisits if it has them
                if (data.data.visits && Array.isArray(data.data.visits)) {
                    setVisits(data.data.visits);
                } else {
                    // Mock visits for demo
                    setVisits(getMockVisits(data.data));
                }
            }
        } catch (e) {
            console.error('Beneficiary fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (id) fetchBeneficiary(); }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F97316" />
            </SafeAreaView>
        );
    }

    if (!beneficiary) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Ionicons name="warning-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
                <Text style={styles.notFoundText}>Beneficiary not found.</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>← Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const happinessScore = beneficiary.emotionalScore ?? 85;
    const conditions = beneficiary.medicalConditions
        ? (typeof beneficiary.medicalConditions === 'string'
            ? beneficiary.medicalConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : beneficiary.medicalConditions)
        : ['Diabetes', 'Hypertension'];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* ── Top Nav Bar ── */}
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navBack}>
                    <Ionicons name="arrow-back" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Beneficiary Details</Text>
                <View style={styles.navRight}>
                    <View style={styles.navNotifWrap}>
                        <Ionicons name="notifications-outline" size={24} color="#111827" />
                        <View style={styles.navBadge}><Text style={styles.navBadgeText}>2</Text></View>
                    </View>
                    <Ionicons name="menu-outline" size={28} color="#111827" style={{ marginLeft: 12 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Hero Card ── */}
                <LinearGradient colors={['#F97316', '#FDBA74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroGradient}>
                    <Image
                        source={{ uri: beneficiary.photo || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                        style={styles.heroPhoto}
                    />
                    <Text style={styles.heroName}>{beneficiary.name}</Text>
                    <Text style={styles.heroMeta}>{beneficiary.age ? `${beneficiary.age} years` : ''}{beneficiary.relationship ? ` • ${beneficiary.relationship}` : ''}</Text>
                </LinearGradient>

                {/* ── Stats Row ── */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>😊</Text>
                        <Text style={styles.statValue}>{happinessScore}%</Text>
                        <Text style={styles.statLabel}>Happiness Score</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="hourglass-outline" size={22} color="#F97316" />
                        <Text style={styles.statValue}>65%</Text>
                        <Text style={styles.statLabel}>Hours Used</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="heart-pulse" size={22} color="#EF4444" />
                        <Text style={styles.statValue}>72 bpm</Text>
                        <Text style={styles.statLabel}>Heart Rate</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="blood-bag" size={22} color="#8B5CF6" />
                        <Text style={styles.statValue}>130/85</Text>
                        <Text style={styles.statLabel}>Blood Pressure</Text>
                    </View>
                </View>

                {/* ── Medical Conditions Tags ── */}
                {conditions.length > 0 && (
                    <View style={styles.conditionsContainer}>
                        <Text style={styles.conditionsLabel}>Medical Conditions:</Text>
                        <View style={styles.conditionsTags}>
                            {conditions.map((c: string, i: number) => (
                                <View key={i} style={styles.condTag}>
                                    <Text style={styles.condTagText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Tab Bar ── */}
                <View style={styles.tabBar}>
                    {(['Timeline', 'Vitals', 'Medical'] as TabType[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons
                                name={tab === 'Timeline' ? 'time-outline' : tab === 'Vitals' ? 'pulse-outline' : 'document-text-outline'}
                                size={16}
                                color={activeTab === tab ? '#F97316' : '#9CA3AF'}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Tab Content ── */}
                {activeTab === 'Timeline' && <TimelineTab visits={visits} />}
                {activeTab === 'Vitals' && <VitalsTab beneficiary={beneficiary} />}
                {activeTab === 'Medical' && <MedicalTab beneficiary={beneficiary} conditions={conditions} />}

                {/* ── Assistance Card ── */}
                <View style={styles.assistanceCard}>
                    <View style={styles.assistanceHeader}>
                        <View style={styles.assistanceIllustration}>
                            <Image
                                source={require("../../assets/images/group4.png")}
                                resizeMode="contain"
                                style={{ width: 60, height: 60 }}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.assistanceTitle}>Need assistance?</Text>
                            <Text style={styles.assistanceSub}>Our experts are here to help you choose the right plan via Phone or WhatsApp.</Text>
                        </View>
                    </View>
                    <View style={styles.assistanceActions}>
                        <CallbackButton
                            subscriberId={beneficiary?.subscriberId}
                            beneficiaryId={beneficiary?.id}
                            notes="Subscriber requested callback from beneficiary profile"
                            style={styles.callbackBtn}
                            textStyle={styles.callbackText}
                        />
                        <TouchableOpacity style={styles.whatsappBtn}>
                            <MaterialCommunityIcons name="whatsapp" size={28} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

/* ───────────── Sub-components ───────────────────────────── */

function TimelineTab({ visits }: { visits: any[] }) {
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
            {visits.map((visit: any, i: number) => (
                <View key={visit.id || i} style={styles.visitCard}>
                    <View style={styles.visitHeader}>
                        <Image
                            source={{ uri: visit.companionPhoto || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                            style={styles.visitCompanionPhoto}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.visitCompanionName}>{visit.companionName || 'Care Companion'}</Text>
                            <Text style={styles.visitDate}>{visit.dateStr || 'Recent visit'}</Text>
                            <Text style={styles.visitDuration}>{visit.duration || 'Duration: 1.5 hours'}</Text>
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
                                {visit.activities.map((a: string, j: number) => (
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
}

function VitalsTab({ beneficiary }: { beneficiary: any }) {
    const vitals = [
        { label: 'Heart Rate', value: '72 bpm', icon: 'heart-pulse', color: '#EF4444', trend: 'Normal' },
        { label: 'Blood Pressure', value: '130/85', icon: 'blood-bag', color: '#8B5CF6', trend: 'Slightly High' },
        { label: 'Blood Sugar', value: '115 mg/dL', icon: 'water', color: '#F59E0B', trend: 'Normal' },
        { label: 'Temperature', value: '98.6 °F', icon: 'thermometer', color: '#06B6D4', trend: 'Normal' },
        { label: 'Oxygen Saturation', value: '98%', icon: 'air-humidifier', color: '#10B981', trend: 'Good' },
        { label: 'Weight', value: '68 kg', icon: 'scale-bathroom', color: '#3B82F6', trend: 'Stable' },
    ];

    return (
        <View style={styles.vitalsGrid}>
            {vitals.map((v) => (
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
    );
}

function MedicalTab({ beneficiary, conditions }: { beneficiary: any, conditions: string[] }) {
    return (
        <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Medical Conditions</Text>
                <View style={styles.conditionsTags}>
                    {conditions.map((c: string, i: number) => (
                        <View key={i} style={styles.condTagLarge}><Text style={styles.condTagLargeText}>{c}</Text></View>
                    ))}
                </View>
            </View>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Current Medications</Text>
                <Text style={styles.medValue}>{beneficiary.currentMedications || 'Metformin 500mg (twice daily), Amlodipine 5mg (once daily)'}</Text>
            </View>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Primary Physician</Text>
                <Text style={styles.medValue}>{beneficiary.physicianName || 'Dr. Rajesh Sharma'}</Text>
                <Text style={styles.medSubValue}>{beneficiary.physicianPhone || '+91 98765 43210'}</Text>
            </View>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Hobbies & Interests</Text>
                <Text style={styles.medValue}>{beneficiary.hobbies || 'Reading, light exercises, gardening, listening to classical music'}</Text>
            </View>
        </View>
    );
}

/* ─── Mock visits fallback ─── */
function getMockVisits(beneficiary: any): any[] {
    return [
        {
            id: '1',
            companionName: 'Priya Sharma',
            companionPhoto: 'https://randomuser.me/api/portraits/women/1.jpg',
            dateStr: '2026-01-25 • 10:00 AM – 11:30 AM',
            duration: 'Duration: 1.5 hours',
            rated: false,
            activities: ['Morning walk', 'Breakfast assistance', 'Medication reminder'],
            bp: '130/85',
            heartRate: '72 bpm',
            bloodSugar: '115 mg/dL',
            notes: 'Patient was cheerful and enjoyed the morning walk. Medication taken on time.',
        },
        {
            id: '2',
            companionName: 'Priya Sharma',
            companionPhoto: 'https://randomuser.me/api/portraits/women/1.jpg',
            dateStr: '2026-01-23 • 3:00 PM – 4:30 PM',
            duration: 'Duration: 1.5 hours',
            rated: true,
            rating: 4,
            activities: ['Reading session', 'Tea time', 'Light exercises'],
            bp: '128/82',
            heartRate: '70 bpm',
            bloodSugar: '110 mg/dL',
            notes: 'Enjoyed reading the newspaper together. Completed light stretching exercises.',
        },
    ];
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5F0' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5F0' },
    notFoundText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
    backBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: '600' },

    /* Nav Bar */
    navBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 14,
    },
    navBack: { width: 36 },
    navTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    navRight: { flexDirection: 'row', alignItems: 'center' },
    navNotifWrap: { position: 'relative' },
    navBadge: {
        position: 'absolute', top: -3, right: -4, backgroundColor: '#F97316',
        width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FFF',
    },
    navBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

    scrollContent: { paddingBottom: 40 },

    /* Hero */
    heroGradient: { paddingVertical: 32, alignItems: 'center' },
    heroPhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 3, borderColor: '#FFF' },
    heroName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    heroMeta: { fontSize: 14, color: '#FFE4CC' },

    /* Stats Row */
    statsRow: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20,
        borderRadius: 16, padding: 16, marginTop: -20, marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 4 },
        }),
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
    statEmoji: { fontSize: 20, marginBottom: 4 },
    statValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 4, marginBottom: 2 },
    statLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

    /* Medical conditions */
    conditionsContainer: { paddingHorizontal: 20, marginBottom: 16 },
    conditionsLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginBottom: 8 },
    conditionsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    condTag: { backgroundColor: '#FFF5ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
    condTagText: { fontSize: 12, color: '#F97316', fontWeight: '500' },
    condTagLarge: { backgroundColor: '#FFF5ED', borderWidth: 1, borderColor: '#FDBA74', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
    condTagLargeText: { fontSize: 13, color: '#F97316', fontWeight: '500' },

    /* Tab Bar */
    tabBar: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    tabItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF5ED' },
    tabText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
    tabTextActive: { color: '#F97316' },

    /* Visit Cards */
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

    /* Vitals Grid */
    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    vitalsGridCard: {
        width: (Platform.OS === 'web' ? 340 : require('react-native').Dimensions.get('window').width - 64) / 2,
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

    /* Medical Tab */
    medCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    medCardTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
    medValue: { fontSize: 14, color: '#111827', lineHeight: 20 },
    medSubValue: { fontSize: 13, color: '#6B7280', marginTop: 4 },

    /* Assistance Card */
    assistanceCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    assistanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    assistanceIllustration: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    assistanceTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    assistanceSub: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
    assistanceActions: { flexDirection: 'row', alignItems: 'center' },
    callbackBtn: {
        flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#F97316', borderRadius: 12,
        height: 50, alignItems: 'center', justifyContent: 'center', marginRight: 15
    },
    callbackText: { color: '#F97316', fontWeight: '600', fontSize: 15 },
    whatsappBtn: {
        width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF5ED',
        justifyContent: 'center', alignItems: 'center',
    },

    /* Empty tab */
    emptyTab: { alignItems: 'center', paddingVertical: 40 },
    emptyTabText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
});
