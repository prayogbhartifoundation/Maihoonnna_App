import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Image } from "react-native";

type PlanDuration = 'basic' | '6months' | 'annual';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '../../components/CallbackButton';

export default function SubscriptionPackagesScreen() {
    const router = useRouter();
    const [activeDuration, setActiveDuration] = useState<PlanDuration>('basic');
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
        const basePrice = pkg.basePrice || 0;
        if (activeDuration === '6months') {
            return Math.round(basePrice * 6 * (1 - (pkg.discountSixMonths || 0) / 100));
        } else if (activeDuration === 'annual') {
            return Math.round(basePrice * 12 * (1 - (pkg.discountAnnual || 0) / 100));
        }
        return basePrice;
    };

    const getDurationText = () => {
        if (activeDuration === '6months') return '6 months';
        if (activeDuration === 'annual') return '12 months';
        return '30 days';
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
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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

                {/* Segmented Toggle Control */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, activeDuration === 'basic' && styles.toggleBtnActive]}
                        onPress={() => setActiveDuration('basic')}
                    >
                        <Text style={[styles.toggleText, activeDuration === 'basic' && styles.toggleTextActive]}>Basic Care</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleBtn, activeDuration === '6months' && styles.toggleBtnActive]}
                        onPress={() => setActiveDuration('6months')}
                    >
                        <Text style={[styles.toggleText, activeDuration === '6months' && styles.toggleTextActive]}>6 Months</Text>
                        <Text style={styles.discountText}>-{discount6m}% off</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toggleBtn, activeDuration === 'annual' && styles.toggleBtnActive]}
                        onPress={() => setActiveDuration('annual')}
                    >
                        <Text style={[styles.toggleText, activeDuration === 'annual' && styles.toggleTextActive]}>Annual</Text>
                        <Text style={styles.discountText}>-{discountAnnual}% off</Text>
                    </TouchableOpacity>
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
                                <View>
                                    <Text style={styles.planName}>{pkg.name}</Text>
                                    <Text style={isPopular ? styles.planPriceColor : styles.planPrice}>
                                        ₹{getPrice(pkg).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.planDuration}>{getDurationText()}</Text>
                                </View>
                                <Image
                                    source={
                                        pkg.type === "silver"
                                            ? require("../../assets/images/group1.png")
                                            : pkg.type === "gold"
                                                ? require("../../assets/images/group2.png")
                                                : require("../../assets/images/group3.png")
                                    }
                                    style={{ width: 70, height: 70 }}
                                />
                            </View>

                            <Text style={styles.hoursText}>{pkg.hoursPerMonth || (pkg.visitsPerWeek || 0) * 10} hours/month</Text>

                            <View style={styles.featureList}>
                                {(pkg.features || []).map((feature: string, fIdx: number) => (
                                    <View key={fIdx} style={styles.featureRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#F97316" />
                                        <Text style={styles.featureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={isPopular ? styles.selectBtnSolid : styles.selectBtnOutline}
                                onPress={() => handleSelectPackage(pkg.type)}
                            >
                                <Text style={isPopular ? styles.selectBtnSolidText : styles.selectBtnOutlineText}>
                                    Select Package
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Elite Care Card (Matching Screenshot) */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <View>
                            <Text style={styles.planName}>Elite Care</Text>
                            <Text style={styles.planPrice}>₹9,999</Text>
                            <Text style={styles.planDuration}>30 days</Text>
                        </View>
                        {/* Replace with your local illustration asset */}
                        <Image
                            source={require("../../assets/images/group3.png")}
                            style={{ width: 80, height: 80 }}
                        />
                    </View>

                    <Text style={styles.hoursText}>50 hours/month</Text>

                    <View style={styles.featureList}>
                        {['Daily health monitoring', 'Full vitals tracking with reports', 'Priority emergency response', 'Medication management', 'Social & recreational activities', 'Physical therapy support'].map((item, idx) => (
                            <View key={idx} style={styles.featureRow}>
                                <Ionicons name="checkmark-circle" size={18} color="#F97316" />
                                <Text style={styles.featureText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.selectBtnOutline} onPress={() => handleSelectPackage('elite')}>
                        <Text style={styles.selectBtnOutlineText}>Select Package</Text>
                    </TouchableOpacity>
                </View>

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
    planName: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    planPrice: { fontSize: 32, fontWeight: '800', color: '#F97316' },
    planPriceColor: { fontSize: 32, fontWeight: '800', color: '#F97316' },
    planDuration: { fontSize: 14, color: '#9CA3AF' },

    illustrationPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF5ED', alignItems: 'center', justifyContent: 'center' },
    iconCircleBasic: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    iconCirclePremium: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEBE0', alignItems: 'center', justifyContent: 'center' },

    hoursText: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 16 },
    featureList: { marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureText: { fontSize: 14, color: '#4B5563', marginLeft: 10 },

    selectBtnOutline: { borderWidth: 1, borderColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    selectBtnOutlineText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
    selectBtnSolid: { backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    selectBtnSolidText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

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
