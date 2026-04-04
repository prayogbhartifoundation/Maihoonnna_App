import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '@/constants/api';

type PackageDetails = {
    id: string;
    name: string;
    price: number;
    durationString: string;
    hoursString: string;
};

export default function SubscribeFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [selectedPackage, setSelectedPackage] = useState<PackageDetails>({
        id: 'loading...',
        name: 'Loading Package...',
        price: 0,
        durationString: '...',
        hoursString: '...'
    });

    React.useEffect(() => {
        const fetchPackage = async () => {
            try {
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
                console.error('Failed to fetch package:', err);
            }
        };
        fetchPackage();
    }, [params.packageId]);

    const [subscriberForm, setSubscriberForm] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: ''
    });

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
        router.back();
    };

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
                            <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
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

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter complete address"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={subscriberForm.address}
                                onChangeText={(text) => setSubscriberForm({ ...subscriberForm, address: text })}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
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
