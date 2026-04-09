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
import { TimelineTab } from './components/beneficiary/TimelineTab';
import { VitalsTab } from './components/beneficiary/VitalsTab';
import { MedicalTab } from './components/beneficiary/MedicalTab';

import { NextVisitCard } from './components/beneficiary/NextVisitCard';
import { GlobalHeader } from './components/shared/GlobalHeader';
import { GlobalDrawer } from './components/shared/GlobalDrawer';
import { Animated, Dimensions } from 'react-native';

type TabType = 'Timeline' | 'Vitals' | 'Medical';

export default function BeneficiaryProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;

    const [beneficiary, setBeneficiary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    const fetchBeneficiary = async () => {
        try {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('userToken')
            ]);
            
            if (storedUser) setUserData(JSON.parse(storedUser));
            
            if (!storedUser || !storedToken) { 
                router.replace('/(auth)'); 
                return; 
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
                return;
            }

            const data = await res.json();
            if (data.success) {
                setBeneficiary(data.data);
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

    const happinessScore = beneficiary.emotionalScore ?? 0;
    const conditions = beneficiary.conditions?.map((c: any) => c.condition?.name) || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <GlobalHeader 
                title="Beneficiary Details" 
                onMenuPress={openDrawer} 
                showBack={true} 
            />

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
                        <Text style={styles.statValue}>{beneficiary.hoursUsedPercent || 0}%</Text>
                        <Text style={styles.statLabel}>Hours Used</Text>
                    </View>
                    {beneficiary.vitalsData?.slice(0, 2).map((v: any, i: number) => (
                        <React.Fragment key={i}>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons name={v.icon} size={22} color={v.color} />
                                <Text style={styles.statValue}>{v.value}</Text>
                                <Text style={styles.statLabel}>{v.label}</Text>
                            </View>
                        </React.Fragment>
                    ))}
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
                                color={activeTab === tab ? '#F97316' : '#9CA3AF'}
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
    notFoundText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
    backBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    backBtnText: { color: '#FFF', fontWeight: '600' },

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
