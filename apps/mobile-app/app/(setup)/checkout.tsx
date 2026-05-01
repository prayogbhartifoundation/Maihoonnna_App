import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Platform,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🛑 BACKEND SETUP
import { API_URL } from '@/constants/api';
const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'];

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // 🛑 BACKEND STATE
    const packageId = (params.packageId as string) || 'silver';
    const [basePrice, setBasePrice] = useState(0);
    const [taxes, setTaxes] = useState(0);
    const [totalAmount, setTotalAmount] = useState('0.00');
    const [packageName, setPackageName] = useState('Basic Care');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');

    // 🛑 UI STATE
    const [activeTab, setActiveTab] = useState<'UPI' | 'CARDS' | 'NET_BANKING'>('UPI');
    const [upiId, setUpiId] = useState('');
    const [promoCode, setPromoCode] = useState('');

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                const response = await fetch(`${API_URL}/subscriber/subscriptions/packages`);
                const json = await response.json();
                if (json.success) {
                    const pkgType = packageId || 'silver';
                    const pkg = json.data.find((p: any) => p.type === pkgType) || json.data[0];
                    if (pkg) {
                        setPackageName(pkg.name);
                        const price = pkg.basePrice || 0;
                        setBasePrice(price);
                        const taxInc = price * 0.18;
                        setTaxes(taxInc);
                        setTotalAmount((price + taxInc).toFixed(2));
                        
                        // Re-calculate if a coupon is already applied
                        if (appliedCoupon) {
                             const discountedBase = price - appliedCoupon.discountApplied;
                             const newTax = discountedBase * 0.18;
                             setTaxes(newTax);
                             setTotalAmount((discountedBase + newTax).toFixed(2));
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch package:', err);
            }
        };
        fetchPackage();
    }, [packageId, appliedCoupon]);

    const handleApplyCoupon = async () => {
        if (!promoCode) {
            setCouponError('Please enter a coupon code.');
            return;
        }

        setIsApplyingCoupon(true);
        setCouponError('');
        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            if (!storedUserData) throw new Error("Session expired.");
            const user = JSON.parse(storedUserData);

            const payload = {
                code: promoCode,
                userId: user.id,
                packageType: packageId || 'silver',
                orderAmount: basePrice
            };

            const response = await fetch(`${API_URL}/subscriber/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.success && result.data.isValid) {
                setAppliedCoupon(result.data);
                // The useEffect will recalculate the totals automatically
            } else {
                setAppliedCoupon(null);
                setCouponError(result.data?.message || result.message || 'Invalid coupon.');
            }
        } catch (error) {
            setCouponError('Failed to apply coupon. Try again.');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setPromoCode('');
        setCouponError('');
    };

    const handlePay = async () => {
        setIsProcessing(true);
        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            if (!storedUserData) throw new Error("You are not logged in. Session expired.");
            const user = JSON.parse(storedUserData);

            const subscriberDataRaw = params.subscriberData as string;
            const beneficiaryDataRaw = params.beneficiaryData as string;
            const medicalDataRaw = params.medicalData as string;
            const emergencyContactsRaw = params.emergencyContacts as string;
            const preferencesDataRaw = params.preferencesData as string;

            let subscriberData = {};
            let beneficiaryData: any = { 
                name: "Beneficiary", 
                age: 65, 
                gender: "Not specified", 
                address: "Not provided", 
                flatPlot: "",
                streetArea: "",
                landmark: "",
                city: "",
                state: "",
                pincode: "",
                latitude: 0,
                longitude: 0,
                relationship: "Relative", 
                phone: "9876543210" 
            };
            let medicalData = {};
            let emergencyContacts = {};
            let preferencesData = {};

            try { if (subscriberDataRaw) subscriberData = JSON.parse(subscriberDataRaw); } catch(e) {}
            try { 
                if (beneficiaryDataRaw) {
                    const parsed = JSON.parse(beneficiaryDataRaw);
                    beneficiaryData = { ...beneficiaryData, ...parsed };
                    if (parsed.fullName) beneficiaryData.name = parsed.fullName;
                    
                    if (parsed.dob) {
                        try {
                            const [day, month, year] = parsed.dob.split('-');
                            if (year && year.length === 4) {
                                beneficiaryData.age = new Date().getFullYear() - parseInt(year, 10);
                            }
                        } catch (err) {}
                    }
                } 
            } catch(e) {}
            try { if (medicalDataRaw) medicalData = JSON.parse(medicalDataRaw); } catch(e) {}
            try { if (emergencyContactsRaw) emergencyContacts = JSON.parse(emergencyContactsRaw); } catch(e) {}
            try { if (preferencesDataRaw) preferencesData = JSON.parse(preferencesDataRaw); } catch(e) {}

            // Call the real backend to create beneficiary + subscription
            const payload = {
                userId: user.id,
                packageId: packageId,
                subscriberData,
                beneficiaryData,
                medicalData,
                emergencyContacts,
                preferencesData,
                couponCode: appliedCoupon ? promoCode : undefined
            };

            const response = await fetch(`${API_URL}/subscriber/subscriptions/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                // Payment gateway is mocked for now, but beneficiary is saved in DB
                router.replace({ pathname: '/(setup)/payment-success', params: { orderId: data.subscriptionId, packageName: data.package || packageName, price: totalAmount } });
            } else {
                throw new Error(data.message || "Purchase failed on server.");
            }
        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.mainBackground}>

            {/* HEADER (White Background) */}
            <SafeAreaView style={styles.safeAreaWhite}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Checkout</Text>
                        <Text style={styles.headerSubtitle}>Complete your purchase securely</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            {/* MAIN BODY (Beige Background) */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <Text style={styles.sectionSubtitle}>Choose your preferred payment method</Text>

                    {/* SECURITY BADGE */}
                    <View style={styles.securityBadge}>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#059669" style={styles.securityIcon} />
                        <View>
                            <Text style={styles.securityTextBold}>100% Secure Payment</Text>
                            <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
                        </View>
                    </View>

                    {/* PAYMENT TABS WRAPPER */}
                    <View style={styles.tabsWrapper}>
                        <TouchableOpacity style={[styles.tab, activeTab === 'UPI' ? styles.tabActive : styles.tabInactive]} onPress={() => setActiveTab('UPI')}>
                            <Ionicons name="phone-portrait-outline" size={16} color={activeTab === 'UPI' ? '#FFF' : '#4B5563'} />
                            <Text style={[styles.tabText, activeTab === 'UPI' && styles.tabTextActive]}>UPI</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.tab, activeTab === 'CARDS' ? styles.tabActive : styles.tabInactive]} onPress={() => setActiveTab('CARDS')}>
                            <Ionicons name="card-outline" size={16} color={activeTab === 'CARDS' ? '#FFF' : '#4B5563'} />
                            <Text style={[styles.tabText, activeTab === 'CARDS' && styles.tabTextActive]}>Cards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.tab, activeTab === 'NET_BANKING' ? styles.tabActive : styles.tabInactive]} onPress={() => setActiveTab('NET_BANKING')}>
                            <MaterialCommunityIcons name="bank-outline" size={16} color={activeTab === 'NET_BANKING' ? '#FFF' : '#4B5563'} />
                            <Text style={[styles.tabText, activeTab === 'NET_BANKING' && styles.tabTextActive]}>Net Banking</Text>
                        </TouchableOpacity>
                    </View>

                    {/* MASTER PAYMENT CARD (The big white box!) */}
                    <View style={styles.paymentCard}>

                        {activeTab === 'UPI' && (
                            <View>
                                {/* UPI Apps Grey Container */}
                                <View style={styles.upiAppsContainer}>
                                    <View style={styles.upiHeader}>
                                        <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FE6700" />
                                        <Text style={styles.upiHeaderText}>Pay using any UPI app</Text>
                                    </View>
                                    <View style={styles.upiAppsGrid}>
                                        {UPI_APPS.map((app) => (
                                            <View key={app} style={styles.upiAppPill}>
                                                <Text style={styles.upiAppText}>{app}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                <Text style={styles.inputLabel}>Enter UPI ID</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="yourname@paytm / yourname@okaxis"
                                    placeholderTextColor="#9CA3AF"
                                    value={upiId}
                                    onChangeText={setUpiId}
                                    autoCapitalize="none"
                                />
                                <Text style={styles.inputHelper}>Example: 9876543210@paytm</Text>

                                {/* QR Code Grey Box */}
                                <View style={styles.qrBox}>
                                    <Ionicons name="qr-code-outline" size={48} color="#9CA3AF" style={styles.qrIcon} />
                                    <Text style={styles.qrText}>Or scan QR code with any UPI app</Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.payButton, isProcessing && { opacity: 0.7 }]}
                                    onPress={handlePay}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Feather name="lock" size={16} color="#FFF" style={styles.payBtnIcon} />
                                            <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.termsText}>
                                    By completing this purchase, you agree to our Terms of Service and Privacy Policy
                                </Text>
                            </View>
                        )}

                        {activeTab === 'CARDS' && (
                            <View style={styles.placeholderBox}>
                                <Ionicons name="card-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.placeholderText}>Credit & Debit Card form will go here.</Text>
                            </View>
                        )}

                        {activeTab === 'NET_BANKING' && (
                            <View style={styles.placeholderBox}>
                                <MaterialCommunityIcons name="bank-outline" size={48} color="#D1D5DB" />
                                <Text style={styles.placeholderText}>Net Banking options will go here.</Text>
                            </View>
                        )}

                    </View>
                    {/* END MASTER PAYMENT CARD */}

                    {/* ─── PROMO / COUPON SECTION (Always Visible) ─── */}
                    <View style={styles.couponCard}>
                        <View style={styles.couponHeader}>
                            <Ionicons name="pricetag-outline" size={20} color="#FE6700" />
                            <Text style={styles.couponHeaderText}>Have a Promo Code?</Text>
                        </View>

                        {!appliedCoupon ? (
                            <>
                                <View style={styles.promoInputRow}>
                                    <TextInput
                                        style={[styles.promoInput, couponError ? { borderColor: '#EF4444' } : {}]}
                                        placeholder="Enter coupon code (e.g. SAVE20)"
                                        placeholderTextColor="#9CA3AF"
                                        value={promoCode}
                                        onChangeText={(text) => { setPromoCode(text.toUpperCase()); setCouponError(''); }}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        editable={!isApplyingCoupon}
                                    />
                                    <TouchableOpacity
                                        style={[styles.applyBtnOutline, (!promoCode || isApplyingCoupon) && { opacity: 0.5 }]}
                                        onPress={handleApplyCoupon}
                                        disabled={!promoCode || isApplyingCoupon}
                                    >
                                        {isApplyingCoupon ? (
                                            <ActivityIndicator size="small" color="#FE6700" />
                                        ) : (
                                            <Text style={styles.applyBtnText}>Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {couponError ? (
                                    <View style={styles.couponErrorRow}>
                                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                                        <Text style={styles.couponErrorText}>{couponError}</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.couponHint}>Enter a valid coupon code to get a discount on this order.</Text>
                                )}
                            </>
                        ) : (
                            <View style={styles.couponAppliedBox}>
                                <View style={styles.couponAppliedLeft}>
                                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={styles.couponAppliedCode}>{promoCode.toUpperCase()}</Text>
                                        <Text style={styles.couponAppliedSaving}>You saved ₹{appliedCoupon.discountApplied.toFixed(2)}!</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeBtn}>
                                    <Text style={styles.removeBtnText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* DYNAMIC ORDER SUMMARY */}
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>

                        <Text style={styles.planName}>{packageName}</Text>
                        <Text style={styles.planDuration}>1 Month</Text>

                        <View style={styles.featuresList}>
                            {['Weekly health checkups', 'Vitals monitoring', 'Emergency contact support', 'Basic companionship'].map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={18} color="#FE6700" />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Subtotal</Text>
                            <Text style={styles.priceValue}>₹{basePrice.toFixed(2)}</Text>
                        </View>
                        {appliedCoupon && (
                            <View style={styles.priceRow}>
                                <Text style={[styles.priceLabel, { color: '#059669' }]}>Discount ({promoCode})</Text>
                                <Text style={[styles.priceValue, { color: '#059669' }]}>-₹{appliedCoupon.discountApplied.toFixed(2)}</Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>GST (18%)</Text>
                            <Text style={styles.priceValue}>₹{taxes.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.priceRow, { marginTop: 12 }]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{totalAmount}</Text>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainBackground: { flex: 1, backgroundColor: '#FAF5F0' },
    safeAreaWhite: { backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 16 },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerSpacer: { width: 40 },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
    headerSubtitle: { fontSize: 13, fontWeight: '400', color: '#6B7280', marginTop: 2, textAlign: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 20 },
    sectionSubtitle: { fontSize: 15, fontWeight: '400', color: '#111827', marginTop: 4, marginBottom: 16 },
    securityBadge: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#34D399', borderRadius: 8, padding: 16, marginBottom: 24, alignItems: 'center' },
    securityIcon: { marginRight: 12 },
    securityTextBold: { color: '#059669', fontWeight: '600', fontSize: 13 },
    securityText: { color: '#059669', fontWeight: '400', fontSize: 13, marginTop: 2, paddingRight: 20 },

    // TABS WRAPPER
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        padding: 6,           // 👈 Added a bit more padding inside the white box
        gap: 8,               // 👈 This creates the perfect space between the pills!
        marginBottom: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
            android: { elevation: 3 },
            web: { boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)' }
        }),
    },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 26 },
    tabActive: { backgroundColor: '#FE6700' },
    tabInactive: { backgroundColor: '#FFE1CC' },
    tabText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#4B5563' },
    tabTextActive: { color: '#FFFFFF' },

    // MASTER PAYMENT CARD (Fixes the missing white background from Screenshot 10)
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 }, web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)' } }),
    },

    // UPI GREY BOX
    upiAppsContainer: { backgroundColor: '#E6E6E6', borderColor: '#BEDBFF', borderWidth: 0.86, borderRadius: 10, padding: 16, marginBottom: 24 },
    upiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    upiHeaderText: { fontSize: 14, fontWeight: '600', color: '#111827', marginLeft: 8 },
    upiAppsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    upiAppPill: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, marginRight: 8, marginBottom: 8 },
    upiAppText: { fontSize: 13, fontWeight: '500', color: '#111827' },

    placeholderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    placeholderText: { marginTop: 12, fontWeight: '400', color: '#9CA3AF', fontSize: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 15, fontWeight: '400' },
    inputHelper: { fontSize: 12, fontWeight: '400', color: '#6B7280', marginTop: 6, marginBottom: 24 },

    // QR BOX (Fixes the white border box from Screenshot 10)
    qrBox: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 32, alignItems: 'center', marginBottom: 24 },
    qrIcon: { marginBottom: 12 },
    qrText: { fontSize: 14, fontWeight: '400', color: '#6B7280' },

    promoTipBox: { flexDirection: 'row', backgroundColor: '#FFF7F2', borderWidth: 1, borderColor: '#FFE1CC', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
    giftIcon: { marginRight: 12 },
    promoTipTextContainer: { flex: 1 },
    promoTipText: { fontSize: 13, fontWeight: '400', color: '#111827' },
    promoHighlight: { color: '#FE6700', fontWeight: '700' },
    applyBtnText: { color: '#FE6700', fontWeight: '600', fontSize: 14 },
    promoInputRow: { flexDirection: 'row', marginBottom: 24 },
    promoInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, height: 50, fontSize: 15, fontWeight: '400', marginRight: 12 },
    applyBtnOutline: { borderWidth: 1, borderColor: '#FE6700', borderRadius: 8, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#FFFFFF' },
    payButton: { backgroundColor: '#FE6700', flexDirection: 'row', height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    payBtnIcon: { marginRight: 8 },
    payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    termsText: { textAlign: 'center', fontSize: 12, fontWeight: '400', color: '#6B7280', paddingHorizontal: 16, lineHeight: 18 },

    // ORDER SUMMARY
    summaryContainer: {
        marginTop: 32, // Spaced apart from the payment card
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 }, android: { elevation: 3 }, web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.05)' } }),
    },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 24 },
    planName: { fontSize: 18, fontWeight: '700', color: '#111827' },
    planDuration: { fontSize: 14, fontWeight: '400', color: '#6B7280', marginBottom: 16, marginTop: 4 },
    featuresList: { marginBottom: 24 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    featureText: { fontSize: 14, fontWeight: '400', color: '#111827', marginLeft: 12 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceLabel: { fontSize: 14, fontWeight: '400', color: '#4B5563' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
    totalValue: { fontSize: 16, fontWeight: '700', color: '#FE6700' },

    // COUPON SECTION
    couponCard: {
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
            android: { elevation: 3 },
            web: { boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.05)' }
        }),
    },
    couponHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
    couponHeaderText: { fontSize: 15, fontWeight: '700', color: '#111827' },
    couponHint: { fontSize: 12, color: '#9CA3AF', marginTop: -16 },
    couponErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -16 },
    couponErrorText: { fontSize: 13, color: '#EF4444', flex: 1 },
    couponAppliedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#34D399' },
    couponAppliedLeft: { flexDirection: 'row', alignItems: 'center' },
    couponAppliedCode: { fontSize: 14, fontWeight: '700', color: '#047857', letterSpacing: 0.5 },
    couponAppliedSaving: { fontSize: 12, color: '#059669', marginTop: 2 },
    removeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 6 },
    removeBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});
