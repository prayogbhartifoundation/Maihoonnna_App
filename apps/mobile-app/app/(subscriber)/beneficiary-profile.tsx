import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '@/components/CallbackButton';
import { ProfilePhotoUploader } from '@/components/ui/ProfilePhotoUploader';
import { TimelineTab } from './components/beneficiary/TimelineTab';
import { VitalsTab } from './components/beneficiary/VitalsTab';
import { MedicalTab } from './components/beneficiary/MedicalTab';

import { NextVisitCard } from './components/beneficiary/NextVisitCard';
import GlobalDrawer from './components/shared/GlobalDrawer';
import { Animated, Dimensions } from 'react-native';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'Timeline' | 'Vitals' | 'Medical';

export default function BeneficiaryProfileScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();
    const params = useLocalSearchParams();
    const { id } = params;


    const [activeTab, setActiveTab] = useState<TabType>('Timeline');
    const [userData, setUserData] = useState<any>(null);

    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { width } = Dimensions.get('window');
    const DRAWER_WIDTH = width * 0.75;
    const drawerAnim = React.useRef(new Animated.Value(DRAWER_WIDTH)).current;

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    /* ─── API (React Query) ─────────────────────────────────────────────── */
    const {
        data: beneficiary,
        isLoading: loading,
        refetch
    } = useQuery({
        queryKey: ['beneficiary', id],
        queryFn: async () => {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('userToken')
            ]);

            if (storedUser) setUserData(JSON.parse(storedUser));

            if (!storedUser || !storedToken) {
                router.replace('/(auth)');
                throw new Error("Auth missing");
            }

            const res = await fetch(`${API_URL}/subscriber/beneficiaries/${id}/profile`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                console.error('Unauthorized access - redirecting to login');
                router.replace('/(auth)');
                throw new Error("Unauthorized");
            }

            const data = await res.json();
            if (data.success) {
                return data.data;
            }
            throw new Error("Failed to fetch beneficiary");
        },
        enabled: !!id,
    });

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
                <TouchableOpacity style={styles.backBtn} onPress={() => safeBack()}>
                    <Text style={styles.backBtnText}>← Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const happinessScore = beneficiary.emotionalScore ?? 0;
    const conditions = beneficiary.conditions?.map((c: any) => c.condition?.name) || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Simple inline header */}
            <View style={styles.inlineHeader}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Beneficiary Details</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/(subscriber)/beneficiary-edit', params: { id } })} style={styles.iconBtn}>
                    <Ionicons name="pencil-outline" size={22} color="#FE6700" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openDrawer} style={styles.iconBtn}>
                    <Ionicons name="menu-outline" size={28} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Hero Card ── */}
                <View style={styles.heroSection}>
                    <ImageBackground
                        source={require("../../assets/images/bg01.png")}
                        style={styles.heroGradient}
                        imageStyle={styles.heroImage}
                        resizeMode="stretch"
                    >
                        <LinearGradient colors={['rgba(249,115,22,0.38)', 'rgba(253,186,116,0.24)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroOverlay} />
                    </ImageBackground>

                    <View style={styles.avatarFloating}>
                        <ProfilePhotoUploader
                            config={{
                                targetType: 'beneficiary',
                                targetId: beneficiary.id,
                                currentPhotoUrl: beneficiary.photo || null,
                                size: 90,
                                editable: true,
                                initials: (beneficiary.name || 'B').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
                                accentColor: '#F97316',
                                onSuccess: (url) => refetch(), // Instead of modifying local state, trigger refetch to update cache
                            }}
                            style={{ marginBottom: 12 }}
                        />
                    </View>

                    <View style={styles.profileCard}>
                        <Text style={styles.heroName}>{beneficiary.name}</Text>
                        <Text style={styles.heroMeta}>{beneficiary.age ? `${beneficiary.age} years` : ''}{beneficiary.relationship ? ` • ${beneficiary.relationship}` : ''}</Text>

                        {/* ── Stats Row ── */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconBox, styles.happinessIconBox]}>
                                    <Text style={styles.statEmoji}>😊</Text>
                                </View>
                                <Text style={styles.statValue}>{happinessScore}%</Text>
                                <Text style={styles.statLabel}>Happiness Score</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={[styles.statIconBox, styles.hoursIconBox]}>
                                    <Ionicons name="hourglass-outline" size={25} color="#1F6BFF" />
                                </View>
                                <Text style={styles.statValue}>{beneficiary.hoursUsedPercent || 0}%</Text>
                                <Text style={styles.statLabel}>Hours Used</Text>
                            </View>
                            {beneficiary.vitalsData?.slice(0, 2).map((v: any, i: number) => (
                                <View key={i} style={styles.statItem}>
                                    <View style={[styles.statIconBox, i === 0 ? styles.heartIconBox : styles.bpIconBox]}>
                                        <MaterialCommunityIcons name={v.icon} size={24} color={v.color} />
                                    </View>
                                    <Text style={styles.statValue}>{v.value}</Text>
                                    <Text style={styles.statLabel}>{v.label}</Text>
                                </View>
                            ))}
                        </View>

                        {conditions.length > 0 && (
                            <View style={styles.conditionsSection}>
                                <Text style={styles.conditionsTitle}>Medical Conditions:</Text>
                                <View style={styles.conditionsTags}>
                                    {conditions.map((c: string, i: number) => (
                                        <View key={i} style={styles.conditionTag}>
                                            <Text style={styles.conditionTagText}>{c}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Next Visit Card (New Feature) ── */}
                <NextVisitCard nextVisit={beneficiary.nextVisit} />

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
                                color={activeTab === tab ? '#FF5B0A' : '#333333'}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Tab Content ── */}
                {activeTab === 'Timeline' && <TimelineTab visits={beneficiary.timeline || []} />}
                {activeTab === 'Vitals' && <VitalsTab beneficiary={beneficiary} />}
                {activeTab === 'Medical' && <MedicalTab beneficiary={beneficiary} conditions={conditions} />}

                {/* ── Assistance Card ── */}
                <View style={styles.assistanceCard}>
                    <View style={styles.assistanceHeader}>
                        <View style={styles.assistanceIllustration}>
                            <Image
                                source={require("../../assets/images/group4.png")}
                                resizeMode="contain"
                                style={{ width: 94, height: 94 }}
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
    safeArea: { flex: 1, backgroundColor: '#FFF2E8' },
    inlineHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF2E8',
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111827', marginLeft: 6 },
    iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF2E8' },
    notFoundText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
    backBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: '600' },

    scrollContent: { paddingBottom: 34 },

    /* Hero */
    heroSection: {
        position: 'relative',
        paddingBottom: 0,
    },
    heroGradient: {
        width: '100%',
        height: 151,
        overflow: 'hidden',
        borderBottomLeftRadius: 23,
        borderBottomRightRadius: 23,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        borderBottomLeftRadius: 23,
        borderBottomRightRadius: 23,
    },
    heroOverlay: {
        flex: 1,
    },
    avatarFloating: {
        position: 'absolute',
        top: 58,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
        elevation: 20,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 14,
        marginTop: -48,
        borderRadius: 15,
        paddingTop: 83,
        paddingHorizontal: 30,
        paddingBottom: 28,
        alignItems: 'center',
        zIndex: 1,
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    heroPhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 3, borderColor: '#FFF' },
    heroName: { fontSize: 25, fontWeight: '800', color: '#111111', marginBottom: 3 },
    heroMeta: { fontSize: 17, color: '#333333' },

    /* Stats Row */
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        marginTop: 34,
        rowGap: 25,
    },
    statItem: { width: '50%', alignItems: 'flex-start', paddingLeft: 20 },
    statDivider: { width: 0, height: 0 },
    statIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    happinessIconBox: { backgroundColor: '#FFEBCB' },
    hoursIconBox: { backgroundColor: '#DDEBFF' },
    heartIconBox: { backgroundColor: '#FFD9EC' },
    bpIconBox: { backgroundColor: '#FFD9D9' },
    statEmoji: { fontSize: 22 },
    statValue: { fontSize: 21, fontWeight: '800', color: '#111111', marginBottom: 0 },
    statLabel: { fontSize: 15, color: '#333333' },
    conditionsSection: {
        width: '100%',
        marginTop: 26,
        paddingLeft: 20,
    },
    conditionsTitle: { fontSize: 15, color: '#4B5563', marginBottom: 9 },
    conditionsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
    conditionTag: {
        backgroundColor: '#FFE2E2',
        borderRadius: 14,
        paddingHorizontal: 13,
        paddingVertical: 6,
    },
    conditionTagText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },

    /* Tab Bar */
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 14,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingHorizontal: 0,
        paddingTop: 0,
        marginTop: 20,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    tabItem: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15 },
    tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#FF5B0A' },
    tabText: { fontSize: 17, fontWeight: '500', color: '#333333' },
    tabTextActive: { color: '#FF5B0A' },

    /* Assistance Card */
    assistanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 25,
        paddingTop: 26,
        paddingBottom: 29,
        marginHorizontal: 14,
        marginTop: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 2 },
        }),
    },
    assistanceHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
    assistanceIllustration: { width: 94, height: 94, justifyContent: 'center', alignItems: 'center' },
    assistanceTitle: { fontSize: 25, fontWeight: '800', color: '#111111', marginBottom: 12 },
    assistanceSub: { fontSize: 20, color: '#111111', lineHeight: 29 },
    assistanceActions: { flexDirection: 'row', alignItems: 'center' },
    callbackBtn: {
        flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#FF5B0A', borderRadius: 8,
        height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 31
    },
    callbackText: { color: '#FF5B0A', fontWeight: '700', fontSize: 16 },
    whatsappBtn: {
        width: 52, height: 52, borderRadius: 12, backgroundColor: '#FFF5ED',
        justifyContent: 'center', alignItems: 'center',
    },

    /* Empty tab */
    emptyTab: { alignItems: 'center', paddingVertical: 40 },
    emptyTabText: { fontSize: 14, color: '#9CA3AF', marginTop: 10 },
});
