import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AddressPicker } from '../../components/ui/AddressPicker';
import * as Location from 'expo-location';

type PlanDuration = 'basic' | '6months' | 'annual';

import { API_URL } from '@/constants/api';
import { CallbackButton } from '../../components/CallbackButton';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionPackagesScreen() {
    const router = useRouter();
    const { push } = useNavigationStack();
    const safeBack = useSafeBack();
    useAndroidBackHandler();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Location targeting states
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedPincode, setSelectedPincode] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);

    const [mapModalVisible, setMapModalVisible] = useState(false);

    const [checkingPin, setCheckingPin] = useState(false);
    const [serviceMessage, setServiceMessage] = useState('');
    const [isServiceable, setIsServiceable] = useState<boolean | null>(null);

    const handleCheckLocation = async (lat: number, lng: number) => {
        setCheckingPin(true);
        setServiceMessage('');
        setIsServiceable(null);
        try {
            const res = await fetch(`${API_URL}/public/location/reverse-geocode?lat=${lat}&lng=${lng}`);
            const json = await res.json();
            if (json.success && json.data.pincode) {
                const pincode = json.data.pincode;
                const svcRes = await fetch(`${API_URL}/public/zones/check-pincode?pincode=${pincode}`);
                const svcJson = await svcRes.json();
                
                if (svcJson.success && svcJson.data.available) {
                    const regionId = svcJson.data.regionId || '';
                    setServiceMessage(`Serving ${json.data.address || svcJson.data.location}! Showing targeted packages.`);
                    setIsServiceable(true);
                    setSelectedAddress(json.data.address || `${svcJson.data.location} (${pincode})`);
                    setSelectedPincode(pincode);
                    setSelectedRegionId(regionId);
                    setSelectedLat(lat);
                    setSelectedLng(lng);
                    
                    // Reload packages for this region
                    const pkgRes = await fetch(`${API_URL}/subscriber/subscriptions/packages?regionId=${regionId}`);
                    const pkgJson = await pkgRes.json();
                    if (pkgJson.success) {
                        setPackages(pkgJson.data);
                    }
                } else {
                    setServiceMessage("We don't serve this location yet. Showing global packages only.");
                    setIsServiceable(false);
                    setSelectedAddress(json.data.address || `Pincode ${pincode}`);
                    setSelectedPincode(pincode);
                    setSelectedRegionId('');
                    setSelectedLat(lat);
                    setSelectedLng(lng);
                    // Load global packages only
                    const pkgRes = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                    const pkgJson = await pkgRes.json();
                    if (pkgJson.success) {
                        setPackages(pkgJson.data);
                    }
                }
            } else {
                setServiceMessage("Could not resolve location address.");
                setIsServiceable(false);
            }
        } catch (err) {
            console.error("Error checking location:", err);
            Alert.alert("Error", "Could not check location serviceability.");
        } finally {
            setCheckingPin(false);
        }
    };

    const handleDirectDetectLocation = async () => {
        setCheckingPin(true);
        setServiceMessage('');
        setIsServiceable(null);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location permission is required to find your current location.");
                setCheckingPin(false);
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            await handleCheckLocation(latitude, longitude);
        } catch (err) {
            console.error("Direct detect location failed:", err);
            Alert.alert("Error", "Failed to auto-detect your location.");
            setCheckingPin(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Check auth status
                const token = await AsyncStorage.getItem('userToken');
                let userPincode = '';
                let defaultLat = 28.6139;
                let defaultLng = 77.2090;
                let hasCoords = false;

                if (token) {
                    // Check for unlinked subscription — redirect to enrollment wizard if found
                    try {
                        const unlinkedRes = await fetch(`${API_URL}/subscriber/subscriptions/unlinked-check`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const unlinkedJson = await unlinkedRes.json();
                        if (unlinkedJson.success && unlinkedJson.hasUnlinkedSubscription) {
                            // Subscriber has purchased but not enrolled a beneficiary — redirect them
                            router.replace({ pathname: '/(setup)/subscribe-form', params: { isLinkingFlow: 'true' } });
                            return;
                        }
                    } catch (e) {
                        console.warn('Unlinked check failed:', e);
                    }

                    // Load user profile to check for default coordinates
                    try {
                        const profileRes = await fetch(`${API_URL}/subscriber/profile`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const profileJson = await profileRes.json();
                        if (profileJson.success && profileJson.data?.user) {
                            const u = profileJson.data.user;
                            if (u.latitude && u.longitude) {
                                defaultLat = u.latitude;
                                defaultLng = u.longitude;
                                hasCoords = true;
                            } else if (u.pincode) {
                                userPincode = u.pincode;
                            }
                        }
                    } catch (e) {
                        console.warn('Profile fetch failed:', e);
                    }
                }

                if (hasCoords) {
                    await handleCheckLocation(defaultLat, defaultLng);
                } else if (userPincode) {
                    // fall back to checking user pincode
                    try {
                        const pinRes = await fetch(`${API_URL}/public/zones/check-pincode?pincode=${userPincode}`);
                        const pinJson = await pinRes.json();
                        if (pinJson.success && pinJson.data.available) {
                            const regionId = pinJson.data.regionId || '';
                            setSelectedAddress(pinJson.data.location);
                            setSelectedPincode(userPincode);
                            setSelectedRegionId(regionId);
                            setServiceMessage(`Serving ${pinJson.data.location}! Showing targeted packages.`);
                            setIsServiceable(true);
                            // Reload packages
                            const pkgRes = await fetch(`${API_URL}/subscriber/subscriptions/packages?regionId=${regionId}`);
                            const pkgJson = await pkgRes.json();
                            if (pkgJson.success) {
                                setPackages(pkgJson.data);
                            }
                        }
                    } catch (e) {
                        console.warn('Pincode initialization failed:', e);
                    }
                } else {
                    // Fetch available packages
                    const response = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                    const json = await response.json();
                    if (json.success) {
                        setPackages(json.data);
                    }
                }
            } catch (err) {
                console.error('Failed to initialize packages screen:', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleSelectPackage = async (packageType: string) => {
        // Check if user is logged in
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            // Not logged in — send to login with warning message
            Alert.alert(
                "Login Required",
                "Please login first to select a package.",
                [
                    {
                        text: "Login",
                        onPress: () => router.push({ pathname: '/(auth)', params: { message: 'Please login first to select a package.' } })
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
            return;
        }

        // Find the full package object
        const selectedPkg = packages.find(p => p.type === packageType);
        if (!selectedPkg) {
            Alert.alert("Error", "Package not found.");
            return;
        }

        // Logged in — go directly to checkout with the packageId and location parameters
        // Wrap serviceAddress in JSON so commas/spaces survive Expo Router URL serialisation
        push('/(setup)/checkout', { 
            packageId: selectedPkg.id, 
            serviceRegionId: selectedRegionId,
            servicePincode: selectedPincode,
            serviceAddress: JSON.stringify(selectedAddress),
            serviceLat: selectedLat ? String(selectedLat) : '',
            serviceLng: selectedLng ? String(selectedLng) : ''
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

                {/* Google Maps Location Pick Box */}
                <View style={styles.locationContainer}>
                    <Text style={styles.locationTitle}>See packages serving in desired location</Text>
                    {selectedAddress ? (
                        <View style={styles.selectedLocationBox}>
                            <Ionicons name="location" size={18} color="#FE6700" style={{ marginRight: 6 }} />
                            <Text style={styles.selectedAddressText} numberOfLines={2}>
                                {selectedAddress}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.noLocationText}>No location selected yet.</Text>
                    )}
                    
                    <View style={styles.actionButtonRow}>
                        <TouchableOpacity 
                            style={styles.detectLocationBtn} 
                            onPress={handleDirectDetectLocation}
                            disabled={checkingPin}
                        >
                            <Ionicons name="locate-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.pickLocationBtnText}>Detect Location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.pickLocationBtn} 
                            onPress={() => setMapModalVisible(true)}
                        >
                            <Ionicons name="map-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.pickLocationBtnText}>Pick on Map</Text>
                        </TouchableOpacity>
                    </View>

                    {serviceMessage ? (
                        <Text style={[
                            styles.serviceMessage, 
                            isServiceable ? styles.serviceSuccess : styles.serviceFail
                        ]}>
                            {serviceMessage}
                        </Text>
                    ) : null}
                </View>

                {/* Dynamic DB Driven Cards */}
                {packages.map((pkg: any) => {
                    const isPopular = pkg.isPopular;
                    const isRegional = !pkg.isGlobal;

                    return (
                        <View key={pkg.id} style={[styles.card, isPopular && styles.popularCard, isRegional && styles.regionalCard]}>
                            {isPopular && (
                                <View style={styles.popularBadge}>
                                    <Ionicons name="star" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                                </View>
                            )}

                            {isRegional && (
                                <View style={styles.regionalBadge}>
                                    <Ionicons name="location" size={12} color="#FFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.regionalBadgeText}>Local Plan</Text>
                                </View>
                            )}

                            <View style={styles.cardHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.planName}>{pkg.name}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={isRegional ? styles.planPriceRegional : (isPopular ? styles.planPriceColor : styles.planPrice)}>
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
                                            <Ionicons name="checkmark-circle" size={18} color={isRegional ? "#0D9488" : "#F97316"} />
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
                                    style={[styles.detailsBtn, isRegional && styles.detailsBtnRegional]}
                                    onPress={() => router.push(`/(subscriber)/package-details/${pkg.type}`)}
                                >
                                    <Text style={[styles.detailsBtnText, isRegional && styles.detailsBtnTextRegional]}>View Details</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[isPopular ? styles.selectBtnSolid : styles.selectBtnOutline, isRegional && (isPopular ? styles.selectBtnSolidRegional : styles.selectBtnOutlineRegional)]}
                                    onPress={() => handleSelectPackage(pkg.type)}
                                >
                                    <Text style={isPopular ? styles.selectBtnSolidText : (isRegional ? styles.selectBtnOutlineTextRegional : styles.selectBtnOutlineText)}>
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

            {/* Address Picker Modal */}
            {mapModalVisible && (
                <Modal visible={mapModalVisible} animationType="slide" transparent={false}>
                    <AddressPicker
                        onAddressSelected={(selected) => {
                            setMapModalVisible(false);
                            setSelectedAddress(selected.address);
                            setSelectedPincode(selected.pincode || '');
                            setSelectedLat(selected.latitude);
                            setSelectedLng(selected.longitude);
                            handleCheckLocation(selected.latitude, selected.longitude);
                        }}
                        onCancel={() => setMapModalVisible(false)}
                        title="Set Accurate Location"
                        subtitle="Move the pin to your exact location"
                    />
                </Modal>
            )}
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
    detailsBtnText: { color: '#F97316', fontSize: 13, fontWeight: '700' },

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
    whatsappBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },

    // Location picker styles
    locationContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FDE6D5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    locationTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12
    },
    selectedLocationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5ED',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FDE6D5'
    },
    selectedAddressText: {
        fontSize: 13,
        color: '#4B5563',
        flex: 1,
        lineHeight: 18
    },
    noLocationText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 12,
        fontStyle: 'italic'
    },
    actionButtonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12
    },
    detectLocationBtn: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickLocationBtn: {
        flex: 1,
        backgroundColor: '#F97316',
        borderRadius: 12,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickLocationBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14
    },
    serviceMessage: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 10
    },
    serviceSuccess: {
        color: '#10B981'
    },
    serviceFail: {
        color: '#EF4444'
    },

    // Regional package styles
    regionalCard: {
        borderColor: '#0D9488',
        borderWidth: 1.5,
        backgroundColor: '#F0FDFA'
    },
    regionalBadge: {
        position: 'absolute',
        top: -14,
        alignSelf: 'center',
        backgroundColor: '#0D9488',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center'
    },
    regionalBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700'
    },
    planPriceRegional: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0D9488'
    },
    selectBtnSolidRegional: {
        backgroundColor: '#0D9488'
    },
    selectBtnOutlineRegional: {
        borderColor: '#0D9488'
    },
    selectBtnOutlineTextRegional: {
        color: '#0D9488'
    },
    detailsBtnTextRegional: {
        color: '#0D9488'
    },
    detailsBtnRegional: {
        borderColor: '#0D9488'
    }
});
