import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { CompanionBottomNav } from '../../components/care-companion/CompanionBottomNav';

const DEEP_ORANGE = '#FE6700';
const LIGHT_BEIGE = '#FAF3EB';
const GRAY_BG = '#F9FAFB';

export default function HistoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<any>(null);

    let [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // WHEN BACKEND IS READY, UNCOMMENT THIS:
                // const response = await fetch('http://your-api.com/history');
                // const data = await response.json();
                // setHistoryData(data);
                setFallbackData();
            } catch (err) {
                console.error("Error fetching history", err);
                setFallbackData();
            } finally {
                setLoading(false);
            }
        };

        if (fontsLoaded) { fetchHistory(); }
    }, [fontsLoaded]);

    const setFallbackData = () => {
        setHistoryData({
            stats: { totalVisits: '2', totalHours: '1.5', avgHours: '1.5' },
            visits: [
                {
                    id: 'v1',
                    patientName: 'William Jones',
                    address: '321 Birch Lane',
                    date: '2/23/2026',
                    duration: '90 mins',
                    tags: ['Home Visit', 'Check-in: auto'],
                    isExpanded: false,
                    details: null,
                },
                {
                    id: 'v2',
                    patientName: 'Amit Trivedi',
                    address: '125, Mall Road, Gurgaon',
                    date: '3/3/2026',
                    duration: '90 mins',
                    tags: ['Home Visit', 'Check-in: auto'],
                    isExpanded: true,
                    details: {
                        vitals: { bp: '132/84', weight: '78 kg', temp: '36.8°C', o2: '97%' },
                        meds: ['Metformin 500mg', 'Lisinopril 10mg'],
                        mood: 'Happy',
                        notes: 'Patient is doing well. Enjoying daily walks. Blood pressure slightly elevated.'
                    }
                }
            ]
        });
    };

    const toggleExpand = (id: string) => {
        setHistoryData((prev: any) => ({
            ...prev,
            visits: prev.visits.map((v: any) => v.id === id ? { ...v, isExpanded: !v.isExpanded } : v)
        }));
    };

    if (!fontsLoaded || loading || !historyData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DEEP_ORANGE} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.deepOrangeHeader}>
                    <View style={styles.headerTitleRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Visit History</Text>
                            <Text style={styles.headerSub}>Track your completed visits</Text>
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <Ionicons name="funnel-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentArea}>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{historyData.stats.totalVisits}</Text>
                            <Text style={styles.statLabel}>Total Visits</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="time-outline" size={20} color="#10B981" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#10B981' }]}>{historyData.stats.totalHours}</Text>
                            <Text style={styles.statLabel}>Total Hours</Text>
                        </View>
                        <View style={styles.statBox}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FAF5FF' }]}>
                                <Ionicons name="trending-up" size={20} color="#A855F7" />
                            </View>
                            <Text style={[styles.statNumber, { color: '#A855F7' }]}>{historyData.stats.avgHours}</Text>
                            <Text style={styles.statLabel}>Avg Hours</Text>
                        </View>
                    </View>

                    {/* Visit List */}
                    <View style={styles.mainListContainer}>
                        <Text style={styles.sectionTitle}>Recent Visits</Text>

                        {historyData.visits.map((visit: any) => (
                            <TouchableOpacity
                                key={visit.id}
                                style={styles.visitCard}
                                onPress={() => toggleExpand(visit.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.patientName}>{visit.patientName}</Text>
                                    <View style={styles.completedBadge}>
                                        <Text style={styles.completedText}>Completed</Text>
                                    </View>
                                </View>

                                <Text style={styles.addressText}>{visit.address}</Text>

                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                                        <Text style={styles.metaText}>{visit.date}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={16} color="#4B5563" />
                                        <Text style={styles.metaText}>{visit.duration}</Text>
                                    </View>
                                </View>

                                <View style={styles.tagsRow}>
                                    {visit.tags.map((tag: string, index: number) => (
                                        <View key={index} style={styles.tagBadge}>
                                            <Text style={styles.tagText}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Expanded Details */}
                                {visit.isExpanded && visit.details && (
                                    <View style={styles.expandedSection}>
                                        <View style={styles.detailBlock}>
                                            <View style={styles.detailHeader}>
                                                <Ionicons name="pulse" size={18} color="#EF4444" />
                                                <Text style={styles.detailTitle}>Vitals</Text>
                                            </View>
                                            <View style={styles.vitalsGrid}>
                                                <View style={styles.vitalBox}>
                                                    <Text style={styles.vitalLabel}>Blood Pressure</Text>
                                                    <Text style={styles.vitalValue}>{visit.details.vitals.bp}</Text>
                                                </View>
                                                <View style={styles.vitalBox}>
                                                    <Text style={styles.vitalLabel}>Weight</Text>
                                                    <Text style={styles.vitalValue}>{visit.details.vitals.weight}</Text>
                                                </View>
                                                <View style={styles.vitalBox}>
                                                    <Text style={styles.vitalLabel}>Temperature</Text>
                                                    <Text style={styles.vitalValue}>{visit.details.vitals.temp}</Text>
                                                </View>
                                                <View style={styles.vitalBox}>
                                                    <Text style={styles.vitalLabel}>O2 Level</Text>
                                                    <Text style={styles.vitalValue}>{visit.details.vitals.o2}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.detailBlock}>
                                            <View style={styles.detailHeader}>
                                                <Ionicons name="medkit-outline" size={18} color="#A855F7" />
                                                <Text style={styles.detailTitle}>Medications Taken</Text>
                                            </View>
                                            <View style={styles.tagsRow}>
                                                {visit.details.meds.map((med: string, index: number) => (
                                                    <View key={index} style={styles.tagBadge}>
                                                        <Text style={styles.tagText}>{med}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        <View style={styles.detailBlock}>
                                            <Text style={styles.detailTitleNoIcon}>Mood</Text>
                                            <View style={styles.moodBadge}>
                                                <Text style={styles.moodText}>{visit.details.mood}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailBlock}>
                                            <View style={styles.detailHeader}>
                                                <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
                                                <Text style={styles.detailTitle}>Notes</Text>
                                            </View>
                                            <View style={styles.notesBox}>
                                                <Text style={styles.notesText}>{visit.details.notes}</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <CompanionBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BEIGE },
    scrollContent: { flexGrow: 1 },

    deepOrangeHeader: {
        backgroundColor: DEEP_ORANGE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 22 },
    headerSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 14, opacity: 0.9 },
    filterBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

    contentArea: { paddingHorizontal: 20 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 20 },
    statBox: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', width: '31%',
        shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statNumber: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, marginBottom: 2 },
    statLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#4B5563' },

    mainListContainer: {
        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#111827', marginBottom: 16 },

    visitCard: { borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    patientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#111827' },
    completedBadge: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    completedText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_500Medium' },

    addressText: { fontFamily: 'Poppins_400Regular', color: '#4B5563', fontSize: 14, marginBottom: 12 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    metaText: { fontFamily: 'Poppins_400Regular', color: '#111827', marginLeft: 6, fontSize: 13 },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    tagBadge: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 8 },
    tagText: { color: '#374151', fontSize: 12, fontFamily: 'Poppins_400Regular' },

    expandedSection: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16, marginTop: 8 },
    detailBlock: { marginBottom: 16 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111827', marginLeft: 8 },
    detailTitleNoIcon: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111827', marginBottom: 8 },

    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vitalBox: { width: '48%', backgroundColor: GRAY_BG, borderRadius: 8, padding: 12, marginBottom: 10 },
    vitalLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#4B5563', marginBottom: 4 },
    vitalValue: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#111827' },

    moodBadge: { backgroundColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
    moodText: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium', fontSize: 12 },

    notesBox: { backgroundColor: GRAY_BG, borderRadius: 8, padding: 16 },
    notesText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', lineHeight: 22 },
});