import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { CompanionBottomNav } from '../../components/care-companion/CompanionBottomNav';

const DEEP_ORANGE = '#FE6700';
const LIGHT_BEIGE = '#FAF3EB';
const SOFT_PEACH = '#FFF7ED';

export default function ScheduleScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('Today (2)');

    let [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold,
    });

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                // WHEN BACKEND IS READY, UNCOMMENT THIS:
                // const response = await fetch(`${API_URL}/care-companion/schedule`);
                // const data = await response.json();
                // setScheduleData(data);
                setFallbackData();
            } catch (err) {
                console.error("Error fetching schedule", err);
                setFallbackData();
            } finally {
                setLoading(false);
            }
        };

        if (fontsLoaded) { fetchSchedule(); }
    }, [fontsLoaded]);

    const setFallbackData = () => {
        setScheduleData({
            visits: [
                { id: 'v1', patientName: 'Margaret Thompson', address: '123 Oak Street, Apt 4B', time: '10:00 AM', distance: '2.3 km', type: 'Home Visit', tabType: 'Today (2)' },
                { id: 'v2', patientName: 'Robert Chen', address: '456 Maple Avenue', time: '2:00 PM', distance: '3.7 km', type: 'Home Visit', tabType: 'Today (2)' },
                { id: 'v3', patientName: 'Sameer Tandon', address: '123 Oak Street, Apt 4B', time: '11:00 AM', distance: '2.3 km', type: 'Home Visit', tabType: 'Tomorrow (1)' },
            ]
        });
    };

    const handleStartVisit = (visitId: string) => {
        router.push({
            pathname: '/(care-companion)/visit-details' as any,
            params: { visitId }
        });
    };

    if (!fontsLoaded || loading || !scheduleData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DEEP_ORANGE} />
            </View>
        );
    }

    const filteredVisits = scheduleData.visits.filter((visit: any) => visit.tabType === activeTab);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.deepOrangeHeader}>
                    <View style={styles.headerTitleRow}>
                        <View>
                            <Text style={styles.headerTitle}>Schedule</Text>
                            <Text style={styles.headerSub}>Manage your visits</Text>
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <Ionicons name="funnel-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.contentArea}>

                    {/* Segmented Control */}
                    <View style={styles.segmentedControl}>
                        {['Today (2)', 'Tomorrow (1)', 'Upcoming (0)'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Visit List */}
                    {filteredVisits.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No visits scheduled</Text>
                        </View>
                    ) : (
                        filteredVisits.map((visit: any) => (
                            <View key={visit.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.patientName}>{visit.patientName}</Text>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusBadgeText}>Scheduled</Text>
                                    </View>
                                </View>

                                <Text style={styles.addressText}>{visit.address}</Text>

                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={18} color="#4B5563" />
                                        <Text style={styles.metaText}>{visit.time}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={18} color="#4B5563" />
                                        <Text style={styles.metaText}>{visit.distance}</Text>
                                    </View>
                                </View>

                                <View style={styles.tagBadge}>
                                    <Text style={styles.tagText}>{visit.type}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.primaryActionBtn}
                                    onPress={() => handleStartVisit(visit.id)}
                                >
                                    <Text style={styles.primaryActionBtnText}>Start Visit</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

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
    headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 22 },
    headerSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 14, opacity: 0.9 },
    filterBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

    contentArea: { paddingHorizontal: 20 },

    segmentedControl: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 6,
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 20,
        shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
    },
    tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    activeTabBtn: { backgroundColor: DEEP_ORANGE },
    tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#4B5563' },
    activeTabText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontFamily: 'Poppins_500Medium', color: '#9CA3AF', fontSize: 15, marginTop: 12 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1, borderColor: '#FDF2F8',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    patientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#111827' },
    statusBadge: { backgroundColor: SOFT_PEACH, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { color: DEEP_ORANGE, fontSize: 11, fontFamily: 'Poppins_500Medium' },

    addressText: { fontFamily: 'Poppins_400Regular', color: '#4B5563', fontSize: 14, marginBottom: 16 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
    metaText: { fontFamily: 'Poppins_400Regular', color: '#111827', marginLeft: 6, fontSize: 13 },

    tagBadge: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 20 },
    tagText: { color: '#374151', fontSize: 12, fontFamily: 'Poppins_500Medium' },

    primaryActionBtn: {
        backgroundColor: DEEP_ORANGE,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    primaryActionBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});