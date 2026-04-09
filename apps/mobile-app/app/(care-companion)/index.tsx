import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { CompanionBottomNav } from '../../components/care-companion/CompanionBottomNav';

const DEEP_ORANGE = '#FE6700';
const LIGHT_ORANGE = '#F97316';
const LIGHT_BEIGE = '#FAF3EB';

export default function DashboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    // 🚀 BACKEND-READY STATE: This exactly mimics what your API will return
    const [dashboardData, setDashboardData] = useState<any>(null);

    let [fontsLoaded] = useFonts({
        Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
    });

    // Clock logic
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
            setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // 🚀 THE DATA FETCH: This is where you will connect your backend API
    useFocusEffect(
        useCallback(() => {
            const fetchDashboardData = async () => {
                setLoading(true);
                try {
                    // WHEN BACKEND IS READY, UNCOMMENT THIS:
                    // const response = await fetch(`${API_URL}/care-companion/dashboard`);
                    // const data = await response.json();
                    // setDashboardData(data);

                    // TEMPORARY MOCK BACKEND DATA
                    setDashboardData({
                        user: { firstName: "Sarah" },
                        stats: { todaysVisits: 2, hoursToday: 4.5 },
                        nextVisit: {
                            id: "v123",
                            patientName: "Sameer Tandon",
                            type: "Home Visit",
                            address: "123 Oak Street, Apt 4B",
                            time: "10:00 AM",
                            distance: "2.3 km"
                        },
                        celebrations: [
                            { id: "c1", name: "Sameer Tandon", type: "Birthday", date: "Mar 10, 2026" },
                            { id: "c2", name: "Eleanor Davis", type: "Anniversary", date: "Mar 11, 2026" }
                        ]
                    });
                } catch (error) {
                    console.error("Failed to load dashboard data", error);
                } finally {
                    setLoading(false);
                }
            };

            if (fontsLoaded) fetchDashboardData();
        }, [fontsLoaded])
    );

    const handleStartVisit = () => {
        router.push({
            pathname: '/(care-companion)/visit-details' as any,
            params: {
                visitId: dashboardData.nextVisit.id,
                patientName: dashboardData.nextVisit.patientName,
                type: dashboardData.nextVisit.type
            }
        });
    };

    if (!fontsLoaded || loading || !dashboardData) {
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

                {/* 1. DYNAMIC HEADER */}
                <View style={styles.deepOrangeHeader}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.headerTitle}>Care Companion</Text>
                            <Text style={styles.headerSub}>Welcome back, {dashboardData.user.firstName}</Text>
                        </View>
                        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(care-companion)/profile' as any)}>
                            <Ionicons name="person-outline" size={24} color={DEEP_ORANGE} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateTimeRow}>
                        <Ionicons name="time-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.dateTimeText}>{currentTime}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.dateTimeText}>{currentDate}</Text>
                    </View>

                    {/* CHECK-IN CARD (inside header) */}
                    <View style={styles.checkInCard}>
                        <View style={styles.checkInLeft}>
                            <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.checkInTitle}>Not Checked In</Text>
                                <Text style={styles.checkInSub}>Ready to start</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.checkInBtn}>
                            <Ionicons name="log-in-outline" size={20} color="#111827" />
                            <Text style={styles.checkInBtnText}>Check In</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentArea}>

                    {/* 2. DYNAMIC STATS ROW */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <View>
                                <Text style={styles.statLabel}>Today's Visits</Text>
                                <Text style={styles.statNumber}>{dashboardData.stats.todaysVisits}</Text>
                            </View>
                            <View style={[styles.statIconCircle, { backgroundColor: '#FFF7ED' }]}>
                                <Ionicons name="calendar-outline" size={24} color="#EA580C" />
                            </View>
                        </View>

                        <View style={styles.statBox}>
                            <View>
                                <Text style={styles.statLabel}>Hours Today</Text>
                                <Text style={styles.statNumber}>{dashboardData.stats.hoursToday}</Text>
                            </View>
                            <View style={[styles.statIconCircle, { backgroundColor: '#FDF2F8' }]}>
                                <Ionicons name="time-outline" size={24} color="#DB2777" />
                            </View>
                        </View>
                    </View>

                    {/* 3. DYNAMIC NEXT VISIT CARD */}
                    <View style={styles.card}>
                        <View style={styles.nextVisitHeader}>
                            <Ionicons name="notifications-outline" size={20} color={DEEP_ORANGE} />
                            <Text style={styles.nextVisitTitle}>Next Visit</Text>
                        </View>

                        <View style={styles.patientRow}>
                            <Text style={styles.patientName}>{dashboardData.nextVisit.patientName}</Text>
                            <View style={styles.visitBadge}>
                                <Text style={styles.visitBadgeText}>{dashboardData.nextVisit.type}</Text>
                            </View>
                        </View>

                        <Text style={styles.addressText}>{dashboardData.nextVisit.address}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={18} color="#4B5563" />
                                <Text style={styles.metaText}>{dashboardData.nextVisit.time}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={18} color="#4B5563" />
                                <Text style={styles.metaText}>{dashboardData.nextVisit.distance}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryActionBtn} onPress={handleStartVisit}>
                            <Text style={styles.primaryActionBtnText}>Start Visit</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 4. QUICK ACTIONS GRID */}
                    <View style={styles.card}>
                        <Text style={styles.quickActionsTitle}>Quick Actions</Text>

                        <View style={styles.quickActionsGrid}>
                            <TouchableOpacity style={styles.actionBox} onPress={() => router.push('/(care-companion)/schedule' as any)}>
                                <Ionicons name="calendar-outline" size={24} color="#2563EB" style={{ marginBottom: 8 }} />
                                <Text style={styles.actionText}>Schedule</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBox} onPress={() => router.push('/(care-companion)/history' as any)}>
                                <Ionicons name="pulse-outline" size={24} color="#16A34A" style={{ marginBottom: 8 }} />
                                <Text style={styles.actionText}>History</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBox}>
                                <MaterialCommunityIcons name="cake-variant-outline" size={24} color="#DB2777" style={{ marginBottom: 8 }} />
                                <Text style={styles.actionText}>Celebrations</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBox}>
                                <Ionicons name="school-outline" size={24} color="#EA580C" style={{ marginBottom: 8 }} />
                                <Text style={styles.actionText}>Training</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 5. DYNAMIC CELEBRATIONS ARRAY MAPPING */}
                    <View style={styles.card}>
                        <View style={styles.celebrationHeader}>
                            <MaterialCommunityIcons name="cake-variant-outline" size={24} color={DEEP_ORANGE} />
                            <Text style={styles.celebrationTitle}>Upcoming Celebrations</Text>
                        </View>

                        {/* Loops through whatever the backend sends! */}
                        {dashboardData.celebrations.map((celebration: any, index: number) => {
                            const isLast = index === dashboardData.celebrations.length - 1;
                            return (
                                <View key={celebration.id} style={[styles.celebrationRow, isLast && { marginBottom: 0 }]}>
                                    <View style={styles.celebrationInfo}>
                                        <Text style={styles.celebrationName}>{celebration.name}</Text>
                                        <Text style={styles.celebrationType}>{celebration.type}</Text>
                                    </View>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeText}>{celebration.date}</Text>
                                    </View>
                                </View>
                            );
                        })}
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

    // --- Header ---
    deepOrangeHeader: {
        backgroundColor: DEEP_ORANGE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        zIndex: 1,
        position: 'relative',
    },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontFamily: 'Poppins_700Bold', color: '#FFFFFF', fontSize: 24, lineHeight: 32 },
    headerSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 14, opacity: 0.9 },
    profileBtn: { width: 44, height: 44, backgroundColor: '#FFFFFF', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    dateTimeText: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 13, opacity: 0.9 },
    dotSeparator: { color: '#FFFFFF', marginHorizontal: 8, opacity: 0.9 },

    // --- Check-In Card ---
    checkInCard: {
        backgroundColor: LIGHT_ORANGE,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    checkInLeft: { flexDirection: 'row', alignItems: 'center' },
    checkInTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 15 },
    checkInSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 12, opacity: 0.9 },
    checkInBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    checkInBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#111827', fontSize: 13, marginLeft: 6 },

    // --- Content Area ---
    contentArea: {
        paddingHorizontal: 20,
        marginTop: 20,
        zIndex: 10,
        position: 'relative',
    },

    // --- Stats Row ---
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statBox: {
        backgroundColor: '#FFFFFF', width: '48%', borderRadius: 16, padding: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    statLabel: { fontFamily: 'Poppins_400Regular', color: '#4B5563', fontSize: 13, marginBottom: 4 },
    statNumber: { fontFamily: 'Poppins_700Bold', color: '#374151', fontSize: 24, lineHeight: 30 },
    statIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    // --- Shared Card Styles ---
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1, borderColor: '#FDF2F8',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },

    // --- Next Visit Card ---
    nextVisitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    nextVisitTitle: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#111827', marginLeft: 8 },

    patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    patientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#111827' },
    visitBadge: { backgroundColor: DEEP_ORANGE, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
    visitBadgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins_500Medium' },

    addressText: { fontFamily: 'Poppins_400Regular', color: '#4B5563', fontSize: 14, marginBottom: 16 },

    metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
    metaText: { fontFamily: 'Poppins_400Regular', color: '#111827', marginLeft: 6, fontSize: 13 },

    primaryActionBtn: {
        backgroundColor: DEEP_ORANGE, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
        shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    primaryActionBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },

    // --- Quick Actions Grid ---
    quickActionsTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#111827', marginBottom: 16 },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionBox: {
        width: '48%', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12,
        padding: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        backgroundColor: '#FFFFFF'
    },
    actionText: { fontFamily: 'Poppins_500Medium', color: '#111827', fontSize: 13 },

    // --- Upcoming Celebrations ---
    celebrationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    celebrationTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#111827', marginLeft: 8 },
    celebrationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    celebrationInfo: { flex: 1 },
    celebrationName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#111827' },
    celebrationType: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280' },
    dateBadge: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
    dateBadgeText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#374151' },
});
