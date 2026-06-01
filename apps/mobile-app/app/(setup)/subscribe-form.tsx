import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

import GlobalDrawer from '../(subscriber)/components/shared/GlobalDrawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AddressInputField } from '../../components/ui/AddressInputField';

import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

type PackageDetails = {
    id: string;
    name: string;
    price: number;
    durationString: string;
    hoursString: string;
};

export default function SubscribeFormScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();
    const params = useLocalSearchParams();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        AsyncStorage.getItem('userData').then(data => {
            if (data) setUserData(JSON.parse(data));
        });
    }, []);

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PackageDetails>({
        id: 'loading...',
        name: 'Loading Package...',
        price: 0,
        durationString: '...',
        hoursString: '...'
    });

    const [subscriberForm, setSubscriberForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        flatPlot: '',
        streetArea: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        latitude: 0,
        longitude: 0,
    });

    useEffect(() => {
        const checkAuthAndFetchPackage = async () => {
            try {
                // 1. Check for existing session
                const stored = await AsyncStorage.getItem('userData');
                if (stored) {
                    const user = JSON.parse(stored);
                    
                    // If user is logged in, auto-fill and redirect "immediately"
                    const subscriberData = {
                        fullName: user.name || '',
                        phone: user.phone?.replace('+91', '') || '',
                        email: user.email || '',
                        address: user.address || ''
                    };

                    // Skip the screen
                    router.replace({
                        pathname: '/(setup)/beneficiary-info',
                        params: {
                            packageId: params.packageId || 'silver',
                            subscriberData: JSON.stringify(subscriberData)
                        }
                    });
                    return; // Stop execution here
                }

                // 2. Fetch package details if not logged in
                const response = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                const json = await response.json();
                if (json.success) {
                    const pkgType = params.packageId || 'silver';
                    const pkg = json.data.find((p: any) => p.type === pkgType) || json.data[0];
                    if (pkg) {
                        setSelectedPackage({
                            id: pkg.type,
                            name: pkg.name,
                            price: pkg.basePrice || 0,
                            durationString: '30 days',
                            hoursString: `${pkg.hoursPerMonth || (pkg.visitsPerWeek || 0) * 10} hours/month`
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch package or auth:', err);
            } finally {
                setIsCheckingAuth(false);
            }
        };
        checkAuthAndFetchPackage();
    }, [params.packageId]);

    const handleNext = () => {
        router.push({
            pathname: '/(setup)/beneficiary-info',
            params: {
                packageId: params.packageId || 'silver',
                subscriberData: JSON.stringify(subscriberForm)
            }
        });
    };

    const handleBack = () => {
        safeBack();
    };

    if (isCheckingAuth) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.loadingText}>Checking session...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Subscribe to Care</Text>
                            <Text style={styles.headerSubtitle}>Step 1 of 5</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#111827" />
                                <View style={styles.notifBadge}><Text style={styles.notifText}>2</Text></View>
                            </View>
                            <TouchableOpacity onPress={openDrawer}>
                                <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '20%' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Sticky Package Banner */}
                    <View style={styles.packageBanner}>
                        <View>
                            <Text style={styles.packageName}>{selectedPackage.name}</Text>
                            <Text style={styles.packageSub}>{selectedPackage.hoursString}</Text>
                        </View>
                        <View style={styles.packagePriceContainer}>
                            <Text style={styles.packagePrice}>₹{selectedPackage.price.toLocaleString('en-IN')}</Text>
                            <Text style={styles.packageSub}>{selectedPackage.durationString}</Text>
                        </View>
                    </View>

                    {/* Form Container */}
                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Subscriber Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9CA3AF"
                                value={subscriberForm.fullName}
                                onChangeText={(text) => setSubscriberForm({ ...subscriberForm, fullName: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.phoneInputContainer}>
                                <View style={styles.countryCodeBox}>
                                    <Text style={styles.countryCodeText}>+91</Text>
                                </View>
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="90000 90000"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    maxLength={10}
                                    value={subscriberForm.phone}
                                    onChangeText={(text) => setSubscriberForm({ ...subscriberForm, phone: text })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your@email.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={subscriberForm.email}
                                onChangeText={(text) => setSubscriberForm({ ...subscriberForm, email: text })}
                            />
                        </View>

                        <AddressInputField
                            label=""
                            value={subscriberForm.address}
                            onChangeText={(text) => setSubscriberForm(prev => ({ ...prev, address: text }))}
                            onLocationFetched={(details) => setSubscriberForm(prev => ({
                                ...prev,
                                address: details.address || prev.address,
                                streetArea: details.address?.split(',')[0] || prev.streetArea,
                                city: details.city || prev.city,
                                state: details.state || prev.state,
                                pincode: details.pincode || prev.pincode,
                                latitude: details.latitude || 0,
                                longitude: details.longitude || 0,
                            }))}
                        />

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Flat / Plot / Building</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 402, Sunshine"
                                    placeholderTextColor="#9CA3AF"
                                    value={subscriberForm.flatPlot}
                                    onChangeText={(t) => setSubscriberForm({ ...subscriberForm, flatPlot: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                <Text style={styles.label}>Street / Area *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Sector 15"
                                    placeholderTextColor="#9CA3AF"
                                    value={subscriberForm.streetArea}
                                    onChangeText={(t) => setSubscriberForm({ ...subscriberForm, streetArea: t })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Landmark (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Near HDFC Bank"
                                placeholderTextColor="#9CA3AF"
                                value={subscriberForm.landmark}
                                onChangeText={(t) => setSubscriberForm({ ...subscriberForm, landmark: t })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>City *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="City"
                                    placeholderTextColor="#9CA3AF"
                                    value={subscriberForm.city}
                                    onChangeText={(t) => setSubscriberForm({ ...subscriberForm, city: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Pincode *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Pincode"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={subscriberForm.pincode}
                                    onChangeText={(t) => setSubscriberForm({ ...subscriberForm, pincode: t })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>State *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="#9CA3AF"
                                value={subscriberForm.state}
                                onChangeText={(t) => setSubscriberForm({ ...subscriberForm, state: t })}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>

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
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5ED' },
    loadingText: { marginTop: 15, fontSize: 16, color: '#6B7280', fontWeight: '500' },
    header: { backgroundColor: '#FFFFFF', paddingTop: 10 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40 },
    headerTextContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
    notifBadge: { position: 'absolute', right: -4, top: -2, backgroundColor: '#E46C2B', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 4, backgroundColor: '#F97316', width: '20%' },

    scrollContent: { padding: 15 },
    packageBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#3B82F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    packageName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    packageSub: {
        fontSize: 13,
        color: '#6B7280',
    },
    packagePriceContainer: {
        alignItems: 'flex-end',
    },
    packagePrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F97316',
        marginBottom: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center' },

    formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 },

    label: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 10 },
    inputGroup: { marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
    textArea: { height: 80, textAlignVertical: 'top' },

    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCodeBox: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        marginRight: 12,
    },
    countryCodeText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#FFFFFF',
    },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20 },
    nextBtn: { backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});
