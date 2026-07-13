import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

export default function PackageDetailScreen() {
    const router = useRouter();
    const { push, replace, pop } = useNavigationStack();
    useAndroidBackHandler();
    const safeBack = useSafeBack();
    const { type } = useLocalSearchParams<{ type: string }>();
    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const res = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                const data = await res.json();
                if (data.success) {
                    const found = data.data.find((p: any) => p.type === type);
                    setPkg(found);
                }
            } catch (e) {
                console.error('Package detail fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchPackage();
    }, [type]);

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F97316" />
            </SafeAreaView>
        );
    }

    if (!pkg) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Package not found.</Text>
                <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Transparent Header Over Gradient */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plan Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Top Section with Gradient */}
                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.heroSection}>
                    <View style={styles.heroContent}>
                        <View style={styles.badgeWrapper}>
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeBadgeText}>{pkg.name}</Text>
                            </View>
                        </View>
                        <Text style={styles.heroTagline}>{pkg.tagline}</Text>
                        
                        <View style={styles.priceRow}>
                            <Text style={styles.currency}>₹</Text>
                            <Text style={styles.price}>{pkg.basePrice.toLocaleString()}</Text>
                            <Text style={styles.period}>/ month</Text>
                        </View>

                        {pkg.mrp > pkg.basePrice && (
                            <View style={styles.savingsRow}>
                                <Text style={styles.mrp}>₹{pkg.mrp.toLocaleString()}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>SAVE {pkg.discountPercentage}%</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Main Content */}
                <View style={styles.detailsContent}>
                    {/* Key Stats */}
                    <View style={styles.quickStats}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={24} color="#F97316" />
                            <Text style={styles.statValue}>{pkg.totalHours || pkg.hoursPerMonth || 0}h</Text>
                            <Text style={styles.statLabel}>Care Hours</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="calendar-outline" size={24} color="#F97316" />
                            <Text style={styles.statValue}>{pkg.visitsPerWeek || 0}</Text>
                            <Text style={styles.statLabel}>Visits / week</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="people-outline" size={24} color="#F97316" />
                            <Text style={styles.statValue}>{pkg.maxBeneficiaries || 1}</Text>
                            <Text style={styles.statLabel}>Beneficiaries</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <Text style={styles.descriptionText}>{pkg.description}</Text>
                    </View>

                    {/* Features/Benefits */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Plan Inclusions</Text>
                        <View style={styles.benefitList}>
                            {pkg.packageBenefits && pkg.packageBenefits.length > 0 ? (
                                pkg.packageBenefits.map((pb: any, i: number) => {
                                    const label = (pb.benefit?.unitLabel || '').replace(/^per\s+/i, '');
                                    return (
                                        <View key={i} style={styles.benefitItem}>
                                            <View style={styles.checkIcon}>
                                                <Ionicons name="checkmark" size={16} color="#059669" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.benefitText}>
                                                    <Text style={{ fontWeight: '700' }}>{pb.unitsIncluded} {label}</Text>
                                                    {' '}• {pb.benefit?.name}
                                                </Text>
                                                {pb.benefit?.description ? (
                                                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                                                        {pb.benefit.description}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    );
                                })
                            ) : (
                                (pkg.features || []).map((feature: string, i: number) => (
                                    <View key={i} style={styles.benefitItem}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark" size={16} color="#059669" />
                                        </View>
                                        <Text style={styles.benefitText}>{feature}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    {/* Disclaimer */}
                    <View style={styles.disclaimerBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.disclaimerText}>
                            Actual visits and hours might vary based on Care Companion availability and your specific location in the city.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={async () => {
                        const token = await AsyncStorage.getItem('userToken');
                        if (!token) {
                            push({ pathname: '/(auth)/register' });
                        } else {
                            push({ pathname: '/(setup)/subscribe-form', params: { packageId: pkg.type } });
                        }
                    }}
                >
                    <Text style={styles.actionBtnText}>Select this Package</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, 
        left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20
    },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    
    heroSection: { paddingTop: 100, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    heroContent: { alignItems: 'center', paddingHorizontal: 30 },
    badgeWrapper: { marginBottom: 12 },
    typeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    typeBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    heroTagline: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 20 },
    
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    currency: { fontSize: 24, color: '#FFFFFF', fontWeight: '800', marginRight: 4 },
    price: { fontSize: 42, color: '#FFFFFF', fontWeight: '900' },
    period: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginLeft: 6 },
    
    savingsRow: { flexDirection: 'row', alignItems: 'center' },
    mrp: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through', marginRight: 10 },
    discountBadge: { backgroundColor: '#FFD6BA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    discountText: { color: '#EA580C', fontSize: 11, fontWeight: '800' },

    detailsContent: { paddingHorizontal: 24, paddingTop: 30 },
    quickStats: { 
        flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, 
        marginBottom: 32, borderWidth: 1, borderColor: '#F3F4F6' 
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
    statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    statDivider: { width: 1, height: '60%', backgroundColor: '#E5E7EB', alignSelf: 'center' },

    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
    descriptionText: { fontSize: 15, color: '#4B5563', lineHeight: 24 },
    
    benefitList: { gap: 16 },
    benefitItem: { flexDirection: 'row', alignItems: 'flex-start' },
    checkIcon: { 
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#ECFDF5', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 
    },
    benefitText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },

    disclaimerBox: { 
        flexDirection: 'row', padding: 16, backgroundColor: '#F9FAFB', 
        borderRadius: 16, marginBottom: 20, alignItems: 'center' 
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280', marginLeft: 12, lineHeight: 18 },

    footer: { 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        backgroundColor: '#FFFFFF', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20
    },
    actionBtn: { 
        backgroundColor: '#F97316', height: 56, borderRadius: 16, 
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
    },
    actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    errorText: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
    backBtn: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backBtnText: { color: '#FFFFFF', fontWeight: '700' }
});
