import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Platform, Animated, Dimensions, Modal, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '@/components/CallbackButton';
import { logoutWithConfirm } from '@/utils/logout';
import { formatHours } from '@/utils/timeFormat';
import GlobalDrawer from './components/shared/GlobalDrawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '@/components/shared/NotificationBell';
import { useExitOnBack } from '@/hooks/useExitOnBack';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

// Responsive scale helpers
const BASE_WIDTH = 390; // Design base (iPhone 14 Pro)
const scale = (size: number) => Math.round((width / BASE_WIDTH) * size);
const vscale = (size: number) => Math.round((height / 844) * size);
const HORIZONTAL_PADDING = scale(20);
const CARD_GAP = scale(12);

export default function SubscriberDashboardScreen() {
    useExitOnBack();
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const benScaleAnim = useRef(new Animated.Value(1)).current;
    const { highlightBen } = useLocalSearchParams();

    useEffect(() => {
        if (highlightBen) {
            Animated.sequence([
                Animated.timing(benScaleAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
                Animated.timing(benScaleAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.timing(benScaleAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
                Animated.timing(benScaleAnim, { toValue: 1, duration: 250, useNativeDriver: true })
            ]).start();
        }
    }, [highlightBen]);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await AsyncStorage.getItem('userData');
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            }
            // No redirect to auth here — the root layout handles that.
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
                // Token missing — this should not happen if root layout works correctly,
                // but we throw to prevent stale data from rendering.
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

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

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
                <ActivityIndicator size="large" color="#FE6700" />
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
            {/* ── Inline Dashboard Header (Figma) ── */}
            <View style={styles.dashHeader}>
                <Text style={styles.dashTitle}>Dashboard</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(16) }}>
                    <NotificationBell />
                    <TouchableOpacity onPress={openDrawer} style={styles.headerIconBtn}>
                        <Ionicons name="menu-outline" size={scale(28)} color="#111827" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE6700']} />}
            >
                {/* ── Hero Banner (top 2 stats only) ── */}
                <ImageBackground
                    source={require("../../assets/images/bg02.png")}
                    resizeMode="cover"
                    style={styles.heroBanner}
                    imageStyle={styles.heroBannerImage}
                >
                    <Text style={styles.heroGreeting}>Hi {firstName}!</Text>

                    {/* Row 1 — sits inside the orange image */}
                    <View style={styles.statsGrid}>
                        {/* Happiness Score */}
                        <View style={styles.statCard}>
                            <View style={styles.statTopRow}>
                                <View style={styles.statEmojiCircle}>
                                    <Text style={styles.statEmoji}>😊</Text>
                                </View>
                                <Text style={styles.statValue}>{happinessScore}%</Text>
                            </View>
                            <Text style={styles.statLabel}>Happiness Score</Text>
                        </View>

                        {/* Visits This Week */}
                        <View style={styles.statCard}>
                            <View style={styles.statTopRow}>
                                <View style={styles.statIconCirclePink}>
                                    <MaterialCommunityIcons name="account-heart" size={24} color="#FE6700" />
                                </View>
                                <Text style={styles.statValue}>{visitsTotal}</Text>
                            </View>
                            <Text style={styles.statLabel}>Visits This Week</Text>
                            <Text style={styles.statSub}>{visitsCompleted} completed</Text>
                        </View>
                    </View>
                </ImageBackground>

                {/* Row 2 — outside orange banner, on white background */}
                <View style={styles.statsGridBottom}>
                    {/* Active Hours */}
                    <View style={styles.statCard}>
                        <View style={styles.statTopRow}>
                            <View style={styles.statIconCircleBlue}>
                                <Ionicons name="hourglass-outline" size={24} color="#2563FF" />
                            </View>
                            <Text style={styles.statValue}>{formatHours(activeHours)}</Text>
                        </View>
                        <Text style={styles.statLabel}>Active Hours</Text>
                        <Text style={[styles.statSub, { color: '#A855F7' }]}>⏰ {formatHours(remainingHours)} remaining</Text>
                    </View>

                    {/* Total Care Plans */}
                    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/package-utilization')}>
                        <LinearGradient colors={['#FE6700', '#E95200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.statCard, { overflow: 'hidden' }]}>
                            <View style={styles.statTopRow}>
                                <View style={styles.planIconCircle}>
                                    <Ionicons name="ribbon-outline" size={23} color="#333333" />
                                </View>
                                <Text style={[styles.statValue, { color: '#FFF' }]}>{totalCarePlans}</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: '#FFE4CC' }]}>Total Care Plans</Text>
                            <TouchableOpacity onPress={() => router.push('/(setup)/subscription-packages')}>
                                <Text style={styles.addMoreText}>＋ Add more →</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Beneficiaries Section ── */}
                <Animated.View style={{ transform: [{ scale: benScaleAnim }] }}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Your Beneficiaries</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(setup)/subscription-packages')}>
                        <Ionicons name="add" size={14} color="#FFF" style={{ marginRight: 2 }} />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {beneficiaries.length === 0 ? (
                    <View style={styles.emptyBenCard}>
                        <Ionicons name="person-add-outline" size={40} color="#FE6700" style={{ marginBottom: 12 }} />
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
                                source={{ uri: b.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name || 'Beneficiary')}&background=FFE3D1&color=FE6700&bold=true` }}
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
                </Animated.View>

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
                            <MaterialCommunityIcons name="whatsapp" size={28} color="#FE6700" />
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
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5F0' },

    /* ── Dashboard Header ── */
    dashHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: scale(20), paddingVertical: scale(12),
        backgroundColor: '#FFFFFF',
    },
    dashTitle: { fontSize: scale(17), fontWeight: '600', color: '#111827' },
    headerIconBtn: { width: scale(36), height: scale(36), justifyContent: 'center', alignItems: 'center', position: 'relative' },
    headerBadge: {
        position: 'absolute', top: 2, right: -2, width: scale(18), height: scale(18),
        borderRadius: scale(9), backgroundColor: '#FE6700',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF',
    },
    headerBadgeText: { color: '#FFF', fontSize: scale(9), fontWeight: '800' },

    scrollContent: { paddingBottom: scale(40) },

    /* ── Hero Banner ── */
    heroBanner: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: scale(14),
        paddingBottom: scale(20),
        marginBottom: 0,
        overflow: 'hidden',
        borderBottomLeftRadius: scale(24),
        borderBottomRightRadius: scale(24),
    },
    heroBannerImage: {
        ...require('react-native').StyleSheet.absoluteFillObject,
        width: undefined,
        height: undefined,
    },
    heroCurve: {
        // Removed — no longer needed with overflow:hidden approach
        display: 'none',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 0,
    },
    heroGreeting: {
        fontSize: scale(18),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: scale(12),
        zIndex: 1,
    },
    heroSubtitle: { display: 'none' },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: CARD_GAP,
        rowGap: CARD_GAP,
        zIndex: 1,
    },
    statsGridBottom: {
        flexDirection: 'row',
        columnGap: CARD_GAP,
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: scale(14),
        paddingBottom: scale(20),
        backgroundColor: '#FFFFFF',
    },
    statCard: {
        width: (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2,
        minHeight: scale(110),
        backgroundColor: '#FFFFFF',
        borderRadius: scale(14),
        paddingHorizontal: scale(14),
        paddingVertical: scale(14),
        justifyContent: 'space-between',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10 },
            android: { elevation: 5 },
        }),
    },
    statTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(6) },
    statEmojiCircle: {
        width: scale(38), height: scale(38), borderRadius: scale(10), backgroundColor: '#FFE8CE',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(10),
    },
    statEmoji: { fontSize: scale(22) },
    statIconCirclePink: {
        width: scale(38), height: scale(38), borderRadius: scale(10), backgroundColor: '#FFE1E6',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(10),
    },
    statIconCircleBlue: {
        width: scale(38), height: scale(38), borderRadius: scale(10), backgroundColor: '#DDEBFF',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(10),
    },
    planIconCircle: {
        width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', marginRight: scale(10),
    },
    statIcon: {},
    statValue: { fontSize: scale(22), fontWeight: '700', color: '#111111' },
    statLabel: { fontSize: scale(13), color: '#4B5563', marginBottom: scale(2) },
    statSub: { fontSize: scale(11), color: '#A3A3A3' },
    addMoreText: { fontSize: scale(12), color: '#FFFFFF', marginTop: scale(4) },

    /* ── Sections ── */
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: HORIZONTAL_PADDING,
        marginBottom: scale(12),
    },
    sectionTitle: { fontSize: scale(16), fontWeight: '600', color: '#111827' },
    addBtn: {
        backgroundColor: '#FE6700',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(14),
        paddingVertical: scale(7),
        borderRadius: scale(20),
    },
    addBtnText: { color: '#FFF', fontSize: scale(13), fontWeight: '600' },
    viewAllText: { fontSize: scale(13), fontWeight: '500', color: '#FE6700' },

    /* ── Empty state ── */
    emptyBenCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(16),
        padding: scale(28),
        marginHorizontal: HORIZONTAL_PADDING,
        marginBottom: scale(24),
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    emptyTitle: { fontSize: scale(16), fontWeight: '600', color: '#111827', marginBottom: scale(6) },
    emptySubtitle: { fontSize: scale(13), color: '#6B7280', textAlign: 'center', marginBottom: scale(18), lineHeight: scale(20) },
    emptyBtn: { backgroundColor: '#FE6700', paddingHorizontal: scale(20), paddingVertical: scale(10), borderRadius: scale(8) },
    emptyBtnText: { color: '#FFF', fontSize: scale(14), fontWeight: '600' },

    /* ── Beneficiary Card ── */
    benCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(14),
        paddingHorizontal: scale(16),
        paddingVertical: scale(14),
        marginHorizontal: HORIZONTAL_PADDING,
        marginBottom: scale(10),
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    benPhoto: { width: scale(52), height: scale(52), borderRadius: scale(26), marginRight: scale(14), backgroundColor: '#E5E7EB' },
    benDetails: { flex: 1 },
    benName: { fontSize: scale(15), fontWeight: '600', color: '#111827', marginBottom: scale(3) },
    benMeta: { fontSize: scale(12), color: '#6B7280' },

    /* ── Recent Updates ── */
    updateCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(14),
        padding: scale(16),
        marginHorizontal: HORIZONTAL_PADDING,
        marginBottom: scale(10),
        flexDirection: 'row',
        alignItems: 'flex-start',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    updateIconBox: {
        width: scale(42), height: scale(42), borderRadius: scale(10), backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center',
    },
    updateTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(3) },
    updateTitle: { fontSize: scale(14), fontWeight: '600', color: '#111827', flex: 1 },
    updateDate: { fontSize: scale(11), color: '#9CA3AF', marginBottom: scale(5) },
    updateBody: { fontSize: scale(13), color: '#4B5563', lineHeight: scale(19) },
    newBadge: { backgroundColor: '#FE6700', borderRadius: scale(10), paddingHorizontal: scale(8), paddingVertical: scale(2) },
    newBadgeText: { color: '#FFF', fontSize: scale(10), fontWeight: '700' },

    /* ── Assistance Card ── */
    assistanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(20),
        padding: scale(20),
        marginHorizontal: HORIZONTAL_PADDING,
        marginTop: scale(8),
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    assistanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(16) },
    assistanceIllustration: { width: scale(56), height: scale(56), justifyContent: 'center', alignItems: 'center' },
    assistanceTitle: { fontSize: scale(17), fontWeight: '700', color: '#111827', marginBottom: scale(4) },
    assistanceSub: { fontSize: scale(13), color: '#4B5563', lineHeight: scale(19) },
    assistanceActions: { flexDirection: 'row', alignItems: 'center' },
    callbackBtn: {
        flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#FE6700', borderRadius: scale(12),
        height: scale(48), alignItems: 'center', justifyContent: 'center', marginRight: scale(12),
    },
    callbackText: { color: '#FE6700', fontWeight: '600', fontSize: scale(14) },
    whatsappBtn: {
        width: scale(48), height: scale(48), borderRadius: scale(12), backgroundColor: '#FFF5ED',
        justifyContent: 'center', alignItems: 'center',
    },
});
