import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, RefreshControl, Image, Platform,
    Animated, Dimensions, Modal, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '@/components/CallbackButton';
import { logoutWithConfirm } from '@/utils/logout';
import GlobalHeader from './components/shared/GlobalHeader';
import GlobalDrawer from './components/shared/GlobalDrawer';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export default function SubscriberDashboardScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await AsyncStorage.getItem('userData');
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            } else {
                router.replace('/(auth)');
            }
        };
        loadUser();
    }, []);

    /* ─── API (React Query) ─────────────────────────────────────────────── */
    const { 
        data: dashboard, 
        isLoading: loading, 
        refetch, 
        isRefetching: refreshing 
    } = useQuery({
        queryKey: ['subscriberDashboard'],
        queryFn: async () => {
            const storedToken = await AsyncStorage.getItem('userToken');
            
            if (!storedToken) { 
                router.replace('/(auth)'); 
                throw new Error("Auth missing"); 
            }

            console.log(`[Dashboard] Fetching from /subscriber/dashboard/me`);
            const res = await fetch(`${API_URL}/subscriber/dashboard/me`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                console.error('[Dashboard] API Error:', errorData);
                throw new Error("Failed to fetch");
            }

            const data = await res.json();
            if (data.success) {
                return data;
            } else {
                console.warn('[Dashboard] Data returned success:false', data);
                throw new Error("Failed to fetch data");
            }
        }
    });

    const onRefresh = () => refetch();

    /* ─── Drawer helpers ─────────────────────────────────── */
    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    /* ─── Loading ─────────────────────────────────────────── */
    if (loading || !userData) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F97316" />
            </SafeAreaView>
        );
    }

    const stats = dashboard?.topStats || {};
    const beneficiaries = dashboard?.beneficiaries || [];
    const recentUpdates = dashboard?.recentUpdates || [];

    const firstName = (userData?.name || 'there').split(' ')[0];
    const happinessScore = stats.happinessScore ?? 85;
    const visitsTotal = stats.visitsThisWeek?.total ?? 0;
    const visitsCompleted = stats.visitsThisWeek?.completed ?? 0;
    const activeHours = stats.activeHours?.used ?? 24;
    const remainingHours = stats.activeHours?.remaining ?? 36;
    const totalCarePlans = stats.totalCarePlans ?? 1;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} • ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} AM`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <GlobalHeader 
                title="Dashboard" 
                onMenuPress={openDrawer} 
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F97316']} />}
            >
                {/* ── Hero Banner ── */}
                <LinearGradient colors={['#F97316', '#FDBA74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
                    <Text style={styles.heroGreeting}>Hi {firstName}!</Text>
                    <Text style={styles.heroSubtitle}>Here's your care summary</Text>

                    <View style={styles.statsGrid}>
                        {/* Happiness Score */}
                        <View style={styles.statCard}>
                            <Text style={styles.statEmoji}>😊</Text>
                            <Text style={styles.statValue}>{happinessScore}%</Text>
                            <Text style={styles.statLabel}>Happiness Score</Text>
                        </View>

                        {/* Visits This Week */}
                        <View style={styles.statCard}>
                            <MaterialCommunityIcons name="account-heart" size={24} color="#F97316" style={styles.statIcon} />
                            <Text style={styles.statValue}>{visitsTotal}</Text>
                            <Text style={styles.statLabel}>Visits This Week</Text>
                            <Text style={styles.statSub}>{visitsCompleted} completed</Text>
                        </View>

                        {/* Active Hours */}
                        <View style={styles.statCard}>
                            <Ionicons name="hourglass-outline" size={22} color="#F97316" style={styles.statIcon} />
                            <Text style={styles.statValue}>{activeHours}h</Text>
                            <Text style={styles.statLabel}>Active Hours</Text>
                            <Text style={[styles.statSub, { color: '#F97316' }]}>⏰ {remainingHours}h remaining</Text>
                        </View>

                        {/* Total Care Plans */}
                        <LinearGradient colors={['#F97316', '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.statCard, { overflow: 'hidden' }]}>
                            <Ionicons name="person-outline" size={22} color="#FFF" style={styles.statIcon} />
                            <Text style={[styles.statValue, { color: '#FFF' }]}>{totalCarePlans}</Text>
                            <Text style={[styles.statLabel, { color: '#FFE4CC' }]}>Total Care Plans</Text>
                            <TouchableOpacity onPress={() => router.push('/(setup)/subscription-packages')}>
                                <Text style={styles.addMoreText}>＋ Add more →</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </LinearGradient>

                {/* ── Beneficiaries Section ── */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Your Beneficiaries</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(setup)/subscribe-form')}>
                        <Ionicons name="add" size={14} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {beneficiaries.length === 0 ? (
                    <View style={styles.emptyBenCard}>
                        <Ionicons name="person-add-outline" size={40} color="#F97316" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>No Beneficiaries Yet</Text>
                        <Text style={styles.emptySubtitle}>Subscribe to a care plan to add your first beneficiary</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(setup)/subscription-packages')}>
                            <Text style={styles.emptyBtnText}>Browse Packages</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    beneficiaries.map((b: any, i: number) => (
                        <TouchableOpacity
                            key={b.id || i}
                            style={styles.benCard}
                            activeOpacity={0.85}
                            onPress={() => router.push(`/(subscriber)/beneficiary-profile?id=${b.id}`)}
                        >
                            <Image
                                source={{ uri: b.photo || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                                style={styles.benPhoto}
                            />
                            <View style={styles.benDetails}>
                                <Text style={styles.benName}>{b.name}</Text>
                                <Text style={styles.benMeta}>{b.age ? `${b.age} years` : ''}{b.relationship ? ` • ${b.relationship}` : ''}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))
                )}

                {/* ── Recent Updates ── */}
                {recentUpdates.length > 0 && (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Recent Updates</Text>
                            <TouchableOpacity><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
                        </View>

                        {recentUpdates.map((update: any, i: number) => (
                            <View key={update.id || i} style={styles.updateCard}>
                                <View style={styles.updateIconBox}>
                                    <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <View style={styles.updateTopRow}>
                                        <Text style={styles.updateTitle}>{update.title || 'Care Companion Update'}</Text>
                                        {update.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>New</Text></View>}
                                    </View>
                                    <Text style={styles.updateDate}>{formatDate(update.date)}</Text>
                                    <Text style={styles.updateBody} numberOfLines={2}>{update.body}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

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
                            subscriberId={userData?.id}
                            style={styles.callbackBtn}
                            textStyle={styles.callbackText}
                            notes="Requested assistance from Subscriber Dashboard"
                        />
                        <TouchableOpacity style={styles.whatsappBtn}>
                            <MaterialCommunityIcons name="whatsapp" size={28} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>

            <GlobalDrawer 
                isOpen={drawerOpen} 
                onClose={closeDrawer} 
                drawerAnim={drawerAnim} 
                userData={userData} 
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5F0' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5F0' },

    scrollContent: { paddingBottom: 40 },

    /* Hero Banner */
    heroBanner: {
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24,
        marginBottom: 24,
    },
    heroGreeting: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    heroSubtitle: { fontSize: 14, color: '#FFE4CC', marginBottom: 20 },

    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    },
    statCard: {
        width: (width - 40 - 12) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 14, padding: 14,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    statEmoji: { fontSize: 24, marginBottom: 6 },
    statIcon: { marginBottom: 6 },
    statValue: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    statSub: { fontSize: 11, color: '#9CA3AF' },
    addMoreText: { fontSize: 11, color: '#FFE4CC', marginTop: 4 },

    /* Sections */
    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 12
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    addBtn: {
        backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20
    },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    viewAllText: { fontSize: 13, fontWeight: '500', color: '#F97316' },

    /* Empty state */
    emptyBenCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, marginHorizontal: 20, marginBottom: 24,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 18, lineHeight: 20 },
    emptyBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    /* Beneficiary Card */
    benCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    benPhoto: { width: 54, height: 54, borderRadius: 27, marginRight: 14, backgroundColor: '#E5E7EB' },
    benDetails: { flex: 1 },
    benName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 3 },
    benMeta: { fontSize: 13, color: '#6B7280' },

    /* Recent Updates */
    updateCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 12,
        flexDirection: 'row', alignItems: 'flex-start',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    updateIconBox: {
        width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center'
    },
    updateTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    updateTitle: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
    updateDate: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
    updateBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
    newBadge: { backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

    /* Assistance Card */
    assistanceCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginHorizontal: 20, marginTop: 8,
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
        justifyContent: 'center', alignItems: 'center'
    },
});
