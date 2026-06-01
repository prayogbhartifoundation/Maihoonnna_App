import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Platform, Animated, Dimensions, Modal, ActivityIndicator, ImageBackground } from 'react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

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
            <GlobalHeader
                title="Dashboard"
                onMenuPress={openDrawer}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE6700']} />}
            >
                {/* ── Hero Banner ── */}
                <ImageBackground
                    source={require("../../assets/images/bg02.png")}
                    resizeMode="cover"
                    style={styles.heroBanner}
                    imageStyle={styles.heroBannerImage}
                >
                    <View pointerEvents="none" style={styles.heroCurve} />
                    <Text style={styles.heroGreeting}>Hi {firstName}!</Text>
                    <Text style={styles.heroSubtitle}>{"Here's your care summary"}</Text>

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

                        {/* Active Hours */}
                        <View style={styles.statCard}>
                            <View style={styles.statTopRow}>
                                <View style={styles.statIconCircleBlue}>
                                    <Ionicons name="hourglass-outline" size={24} color="#2563FF" />
                                </View>
                                <Text style={styles.statValue}>{activeHours}h</Text>
                            </View>
                            <Text style={styles.statLabel}>Active Hours</Text>
                            <Text style={[styles.statSub, { color: '#A855F7' }]}>⏰ {remainingHours}h remaining</Text>
                        </View>

                        {/* Total Care Plans */}
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
                    </View>
                </ImageBackground>

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

    scrollContent: { paddingBottom: 40 },

    /* Hero Banner */
    heroBanner: {
        paddingHorizontal: 20, paddingTop: 17, paddingBottom: 0,
        marginBottom: 40,
        overflow: 'visible',
    },
    heroBannerImage: {
        width: '100%',
        height: 168,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    heroCurve: {
        position: 'absolute',
        left: -34,
        right: -34,
        bottom: -30,
        height: 94,
        backgroundColor: '#FAF5F0',
        borderTopLeftRadius: 160,
        borderTopRightRadius: 160,
        zIndex: 0
    },
    heroGreeting: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 0, zIndex: 1 },
    heroSubtitle: { display: 'none' },

    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 14,
        marginTop: 31,
        zIndex: 1,
    },
    statCard: {
        width: (width - 40 - 14) / 2,
        height: 128,
        backgroundColor: '#FFFFFF',
        borderRadius: 12, paddingHorizontal: 18, paddingTop: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 10 },
            android: { elevation: 5 },
        }),
    },
    statTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statEmojiCircle: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE8CE',
        alignItems: 'center', justifyContent: 'center', marginRight: 10
    },
    statEmoji: { fontSize: 24 },
    statIconCirclePink: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE1E6',
        alignItems: 'center', justifyContent: 'center', marginRight: 10
    },
    statIconCircleBlue: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#DDEBFF',
        alignItems: 'center', justifyContent: 'center', marginRight: 10
    },
    planIconCircle: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    statIcon: { marginBottom: 0 },
    statValue: { fontSize: 24, fontWeight: '700', color: '#111111', marginBottom: 0 },
    statLabel: { fontSize: 14, color: '#4B5563', marginBottom: 3 },
    statSub: { fontSize: 13, color: '#A3A3A3' },
    addMoreText: { fontSize: 13, color: '#FFFFFF', marginTop: 5 },

    /* Sections */
    sectionHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, marginBottom: 12
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    addBtn: {
        backgroundColor: '#FE6700', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20
    },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    viewAllText: { fontSize: 13, fontWeight: '500', color: '#FE6700' },

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
    emptyBtn: { backgroundColor: '#FE6700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
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
    newBadge: { backgroundColor: '#FE6700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
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
        flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#FE6700', borderRadius: 12,
        height: 50, alignItems: 'center', justifyContent: 'center', marginRight: 15
    },
    callbackText: { color: '#FE6700', fontWeight: '600', fontSize: 15 },
    whatsappBtn: {
        width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF5ED',
        justifyContent: 'center', alignItems: 'center'
    },
});
