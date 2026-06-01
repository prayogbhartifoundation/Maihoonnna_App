import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Image } from "react-native";

type PlanDuration = 'basic' | '6months' | 'annual';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '../../components/CallbackButton';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionPackagesScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                const json = await response.json();
                if (json.success) {
                    setPackages(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch packages:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const handleSelectPackage = (packageId: string) => {
        // We pass the package "type" (e.g. silver/gold) directly to the subscribe form
        router.push({
            pathname: '/(setup)/subscribe-form',
            params: { packageId }
        });
    };

    const getPrice = (pkg: any) => {
        return pkg.basePrice || 0;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <GlobalHeader title="Subscription Packages" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#F97316" />
                </View>
            </SafeAreaView>
        );
    }

    const discount6m = packages[0]?.discountSixMonths || 10;
    const discountAnnual = packages[0]?.discountAnnual || 20;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerWrapper}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => safeBack()}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscription Packages</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.headerArea}>
                    <Text style={styles.mainTitle}>Choose the Right Care for Your Loved Ones</Text>
                    <Text style={styles.subTitle}>Personalized plans designed for peace of mind.</Text>
                </View>

                {/* Dynamic DB Driven Cards */}
                {packages.map((pkg: any) => {
                    const isPopular = pkg.type === 'gold';

                    return (
                        <View key={pkg.id} style={[styles.card, isPopular && styles.popularCard]}>
                            {isPopular && (
                                <View style={styles.popularBadge}>
                                    <Ionicons name="star" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                                </View>
                            )}

                            <View style={styles.cardHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.planName}>{pkg.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={isPopular ? styles.planPriceColor : styles.planPrice}>
                                            ₹{getPrice(pkg).toLocaleString('en-IN')}
                                        </Text>
                                        {pkg.mrp > pkg.basePrice && (
                                            <View style={styles.discountInfo}>
                                                <Text style={styles.mrpText}>₹{pkg.mrp.toLocaleString('en-IN')}</Text>
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountBadgeText}>{pkg.discountPercentage}% OFF</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <Image
                                    source={
                                        pkg.type?.includes("silver")
                                            ? require("../../assets/images/group1.png")
                                            : pkg.type?.includes("gold")
                                                ? require("../../assets/images/group2.png")
                                                : require("../../assets/images/group3.png")
                                    }
                                    style={{ width: 70, height: 70 }}
                                />
                            </View>

                            <View style={styles.featureList}>
                                {(pkg.packageBenefits || []).map((pb: any, fIdx: number) => {
                                    const label = (pb.benefit?.unitLabel || '').replace(/^per\s+/i, '');
                                    return (
                                        <View key={fIdx} style={styles.featureRow}>
                                            <Ionicons name="checkmark-circle" size={18} color="#F97316" />
                                            <Text style={styles.featureText}>
                                                {pb.benefit?.name}{' '}
                                                <Text style={{ fontWeight: '800', color: '#111827' }}>
                                                    {pb.unitsIncluded}{label}
                                                </Text>
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            <View style={styles.cardActions}>
                                <TouchableOpacity
                                    style={[styles.detailsBtn, isPopular && styles.detailsBtnPopular]}
                                    onPress={() => router.push(`/(subscriber)/package-details/${pkg.type}`)}
                                >
                                    <Text style={[styles.detailsBtnText, isPopular && styles.detailsBtnTextPopular]}>View Details</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={isPopular ? styles.selectBtnSolid : styles.selectBtnOutline}
                                    onPress={() => handleSelectPackage(pkg.type)}
                                >
                                    <Text style={isPopular ? styles.selectBtnSolidText : styles.selectBtnOutlineText}>
                                        Select
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}


                {/* How It Works Section */}
                <View style={styles.howItWorksContainer}>
                    <Text style={styles.sectionTitle}>How It Works</Text>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepBadge}><Text style={styles.stepNumber}>1</Text></View>
                        <Text style={styles.stepTitle}>Choose Package</Text>
                        <Text style={styles.stepSub}>Select the care plan that suits your needs</Text>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepBadge}><Text style={styles.stepNumber}>2</Text></View>
                        <Text style={styles.stepTitle}>Add Details</Text>
                        <Text style={styles.stepSub}>Provide beneficiary and medical information</Text>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepBadge}><Text style={styles.stepNumber}>3</Text></View>
                        <Text style={styles.stepTitle}>Schedule Visits</Text>
                        <Text style={styles.stepSub}>Set preferred timings for care companion visits</Text>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={styles.stepBadge}><Text style={styles.stepNumber}>4</Text></View>
                        <Text style={styles.stepTitle}>Start Care</Text>
                        <Text style={styles.stepSub}>Begin receiving professional care services</Text>
                    </View>
                </View>

                {/* Need Assistance Section */}
                <View style={styles.assistanceCard}>
                    <View style={styles.assistanceHeader}>
                        <View style={styles.assistanceIllustration}>
                            <Image
                                source={require("../../assets/images/group4.png")}
                                style={{ width: 50, height: 50 }}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={styles.assistanceTitle}>Need assistance?</Text>
                            <Text style={styles.assistanceSub}>Our experts are here to help you choose the right plan via Phone or WhatsApp.</Text>
                        </View>
                    </View>

                    <View style={styles.assistanceActions}>
                        <CallbackButton
                            style={styles.callbackBtn}
                            textStyle={styles.callbackText}
                            notes="Requested assistance from Subscription Packages page"
                        />
                        <TouchableOpacity style={styles.whatsappBtn}>
                            <Ionicons name="chatbox-ellipses-outline" size={28} color="#F97316" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20
    },
    backBtn: { position: 'absolute', left: 0, padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },

    headerArea: { marginBottom: 24 },
    mainTitle: { fontSize: 22, fontWeight: '400', color: '#111827', lineHeight: 30, marginBottom: 8 },
    subTitle: { fontSize: 15, color: '#4B5563' },

    toggleContainer: {
        flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 30, padding: 4,
        marginBottom: 30, borderWidth: 1, borderColor: '#FDE6D5', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4
    },
    toggleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 26 },
    toggleBtnActive: { backgroundColor: '#F97316' },
    toggleText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    toggleTextActive: { color: '#FFFFFF' },
    discountText: { fontSize: 9, color: '#9CA3AF' },
    discountTextActive: { fontSize: 9, color: '#FFD6BA' },

    headerWrapper: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },

    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    planName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
    planPrice: { fontSize: 28, fontWeight: '800', color: '#F97316' },
    planPriceColor: { fontSize: 28, fontWeight: '800', color: '#F97316' },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    discountInfo: { marginBottom: 4 },
    mrpText: { fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through', marginBottom: 2 },
    discountBadge: { backgroundColor: '#FDE6D5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    discountBadgeText: { fontSize: 10, fontWeight: '700', color: '#EA580C' },

    illustrationPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF5ED', alignItems: 'center', justifyContent: 'center' },
    iconCircleBasic: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    iconCirclePremium: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEBE0', alignItems: 'center', justifyContent: 'center' },

    hoursText: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 16 },
    featureList: { marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureText: { fontSize: 14, color: '#4B5563', marginLeft: 10 },

    cardActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    detailsBtn: { 
        flex: 1, borderWidth: 1, borderColor: '#F97316', 
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 48 
    },
    detailsBtnPopular: { borderColor: '#FFFFFF' },
    detailsBtnText: { color: '#F97316', fontSize: 13, fontWeight: '700' },
    detailsBtnTextPopular: { color: '#FFFFFF' },

    selectBtnOutline: { 
        flex: 1, borderWidth: 1, borderColor: '#F97316', height: 48, 
        borderRadius: 12, alignItems: 'center', justifyContent: 'center' 
    },
    selectBtnOutlineText: { color: '#F97316', fontSize: 13, fontWeight: '700' },
    selectBtnSolid: { 
        flex: 1, backgroundColor: '#F97316', height: 48, 
        borderRadius: 12, alignItems: 'center', justifyContent: 'center' 
    },
    selectBtnSolidText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    popularCard: { borderWidth: 2, borderColor: '#F97316', marginTop: 10 },
    popularBadge: { position: 'absolute', top: -14, alignSelf: 'center', backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    popularBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },

    // How it Works Styles
    howItWorksContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 24 },
    stepContainer: { alignItems: 'center', marginBottom: 24 },
    stepBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    stepNumber: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    stepSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20 },

    // Assistance Card Styles
    assistanceCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20 },
    assistanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    assistanceIllustration: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    assistanceTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    assistanceSub: { fontSize: 16, color: '#4B5563', lineHeight: 18 },
    assistanceActions: { flexDirection: 'row', alignItems: 'center' },
    callbackBtn: { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: '#F97316', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    callbackText: { color: '#F97316', fontWeight: '600', fontSize: 15 },
    whatsappBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }
});
