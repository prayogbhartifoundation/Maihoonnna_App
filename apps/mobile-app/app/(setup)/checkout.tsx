import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';

// 🛑 BACKEND SETUP
import { API_URL } from '@/constants/api';
import HeaderSpacer from '@/components/HeaderSpacer';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

/**
 * Resolves the Razorpay key in every Expo/EAS environment:
 *  1. Constants.expoConfig.extra.razorpayKeyId  — baked in at EAS build time (most reliable)
 *  2. process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID   — works in local `npx expo start`
 *
 * The quotes-stripped guard handles the common mistake of wrapping the value in
 * double-quotes inside .env  (e.g. EXPO_PUBLIC_RAZORPAY_KEY_ID="rzp_test_...").
 */
const getRazorpayKey = (): string => {
    const fromExtra: string = (Constants.expoConfig?.extra?.razorpayKeyId as string) || '';
    const fromEnv: string = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string) || '';
    // Strip accidental surrounding quotes some .env parsers add
    const clean = (s: string) => s.replace(/^["']|["']$/g, '').trim();
    return clean(fromExtra) || clean(fromEnv);
};
const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FIGMA_WIDTH = 716;
const figmaScale = Math.min(SCREEN_WIDTH / FIGMA_WIDTH, 1);
const fs = (value: number) => Math.round(value * figmaScale);

export default function CheckoutScreen() {
    const router = useRouter();
    const { pop, replace } = useNavigationStack();
    const { updateUser } = useAuth();
    useAndroidBackHandler();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams();
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold,
        Poppins_700Bold
    });

    // ── Pricing state — all values come exclusively from the backend ──────────
    const packageId = (params.packageId as string) || 'silver';
    const [pricing, setPricing] = useState<{
        packageName: string;
        basePrice: number;
        discountApplied: number;
        tax: number;
        total: number;
        couponValid: boolean;
        couponMessage?: string;
    }>({
        packageName: 'Loading...',
        basePrice: 0,
        discountApplied: 0,
        tax: 0,
        total: 0,
        couponValid: false,
    });
    const [pricingLoading, setPricingLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedCouponCode, setAppliedCouponCode] = useState('');

    const [agreed, setAgreed] = useState(false);
    const [packageBenefits, setPackageBenefits] = useState<string[]>([]);

    // Targeted package check states
    const [fullPackage, setFullPackage] = useState<any>(null);

    // Expo Router serialises params as URL query strings — commas split strings into arrays.
    // serviceAddress is JSON-encoded before navigation so we safely parse it here.
    const decodeServiceAddress = (): string => {
        const raw = params.serviceAddress;
        if (!raw) return '';
        const str = Array.isArray(raw) ? raw.join('') : (raw as string);
        try { return JSON.parse(str); } catch { return str; }
    };
    const [serviceAddress, setServiceAddress] = useState(decodeServiceAddress);
    const [servicePincode, setServicePincode] = useState(() => {
        const raw = params.servicePincode;
        if (!raw) return '';
        return Array.isArray(raw) ? raw[0] : (raw as string);
    });
    const [serviceChecked, setServiceChecked] = useState(false);
    const [serviceAvailable, setServiceAvailable] = useState(false);
    const [serviceRegionId, setServiceRegionId] = useState(() => {
        const raw = params.serviceRegionId;
        if (!raw) return '';
        return Array.isArray(raw) ? raw[0] : (raw as string);
    });
    const [serviceLocationName, setServiceLocationName] = useState('');
    const [checkingPincode, setCheckingPincode] = useState(false);

    // ── Track the pre-validated region from the packages screen dynamically ─────
    // This value updates whenever route params change (e.g. user goes back, picks another location).
    const preValidatedRegionId = React.useMemo(() => {
        const raw = params.serviceRegionId;
        if (!raw) return '';
        return Array.isArray(raw) ? raw[0] : (raw as string);
    }, [params.serviceRegionId]);

    // ── Sync navigation parameters to state dynamically ─────────────────────────
    useEffect(() => {
        const addr = decodeServiceAddress();
        setServiceAddress(addr);

        const rawPin = params.servicePincode;
        const pin = !rawPin ? '' : (Array.isArray(rawPin) ? rawPin[0] : (rawPin as string));
        setServicePincode(pin);

        const rawRegion = params.serviceRegionId;
        const region = !rawRegion ? '' : (Array.isArray(rawRegion) ? rawRegion[0] : (rawRegion as string));
        setServiceRegionId(region);

        if (region) {
            setServiceChecked(true);
            setServiceAvailable(true);
        } else {
            setServiceChecked(false);
            setServiceAvailable(false);
        }
    }, [params.serviceAddress, params.servicePincode, params.serviceRegionId]);

    const checkPincodeServiceability = async (pincode: string) => {
        if (!pincode || pincode.length !== 6) {
            setServiceChecked(false);
            setServiceAvailable(false);
            return;
        }
        setCheckingPincode(true);
        try {
            const res = await fetch(`${API_URL}/public/zones/check-pincode?pincode=${pincode}`);
            const json = await res.json();
            if (json.success && json.data.available) {
                setServiceChecked(true);
                setServiceAvailable(true);
                // Only update serviceRegionId if there was no pre-validated one from params.
                // If we overwrite it here we'll lose the validated region and break isPackageAvailable.
                if (!preValidatedRegionId) {
                    setServiceRegionId(json.data.regionId || '');
                }
                setServiceLocationName(json.data.location || '');
            } else {
                setServiceChecked(true);
                setServiceAvailable(false);
                if (!preValidatedRegionId) {
                    setServiceRegionId('');
                }
                setServiceLocationName('');
            }
        } catch (err) {
            console.error('[Pincode check error]', err);
            setServiceChecked(false);
        } finally {
            setCheckingPincode(false);
        }
    };

    useEffect(() => {
        // Skip pincode re-validation entirely when location was pre-validated
        // on the packages screen. The region is already confirmed — no need to
        // re-check and risk overwriting the region with an async result.
        if (preValidatedRegionId) return;

        if (servicePincode.length === 6) {
            checkPincodeServiceability(servicePincode);
        } else {
            setServiceChecked(false);
            setServiceAvailable(false);
        }
    }, [servicePincode, preValidatedRegionId]);

    const isPackageAvailable = React.useMemo(() => {
        if (!fullPackage) return true; // Still loading — optimistically allow
        if (fullPackage.isGlobal) return true; // Global packages serve everywhere

        // If the user reached checkout via the packages screen with a pre-validated
        // region, trust that validation. The packages screen already confirmed the
        // zone covers this region and only showed matching packages.
        if (preValidatedRegionId) return true;

        // Fallback (manual pincode path): check against the zone check result
        if (!serviceChecked || !serviceAvailable) return false;

        // The backend returns packageRegions: [{ regionId, region: {...} }, ...]
        // NOT a flat regionIds array — extract regionId values from the join table
        const packageRegionIds: string[] = (fullPackage.packageRegions || []).map((pr: any) => pr.regionId);
        return packageRegionIds.length === 0 || packageRegionIds.includes(serviceRegionId);
    }, [fullPackage, serviceChecked, serviceAvailable, serviceRegionId, preValidatedRegionId]);

    const isLocationReady = React.useMemo(() => {
        if (!fullPackage) return false;
        if (fullPackage.isGlobal) return true;
        if (preValidatedRegionId) return true; // Pre-validated from packages screen
        return serviceAvailable && isPackageAvailable;
    }, [fullPackage, serviceAvailable, isPackageAvailable, preValidatedRegionId]);

    // 🛑 UI STATE
    const [activeTab, setActiveTab] = useState<'UPI' | 'CARDS' | 'NET_BANKING'>('UPI');
    const [upiId, setUpiId] = useState('');
    const [promoCode, setPromoCode] = useState('');

    // ── Single function: calls /checkout/preview with optional couponCode ──────
    // All arithmetic lives on the server. Frontend just renders what it receives.
    const fetchCheckoutPreview = async (couponCode?: string) => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/subscriber/subscriptions/checkout/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${storedToken}`
                },
                body: JSON.stringify({ packageId, couponCode: couponCode || undefined })
            });
            const result = await response.json();

            if (result.success && result.data) {
                setPricing({
                    packageName: result.data.packageName,
                    basePrice: result.data.basePrice,
                    discountApplied: result.data.discountApplied,
                    tax: result.data.tax,
                    total: result.data.total,
                    couponValid: result.data.couponValid,
                    couponMessage: result.data.couponMessage,
                });
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to load pricing');
            }
        } catch (err: any) {
            console.error('[Checkout Preview Error]', err);
            throw err;
        }
    };

    const isVerificationFlow = params.isVerificationFlow === 'true';
    const beneficiaryId = params.beneficiaryId as string;
    const pendingDetailsRaw = params.pendingDetails as string;

    // Initial load — no coupon
    useEffect(() => {
        const loadPackageBenefits = async (pkgId: string, regionId?: string) => {
            try {
                const url = regionId
                    ? `${API_URL}/subscriber/subscriptions/packages?regionId=${regionId}`
                    : `${API_URL}/subscriber/subscriptions/packages`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    const matchedPkg = data.data.find((p: any) => p.type === pkgId || p.id === pkgId);
                    if (matchedPkg) {
                        setFullPackage(matchedPkg);
                        if (matchedPkg.packageBenefits && matchedPkg.packageBenefits.length > 0) {
                            const list = matchedPkg.packageBenefits.map((pb: any) => {
                                const label = (pb.benefit?.unitLabel || '').replace(/^per\s+/i, '');
                                return `${pb.unitsIncluded} ${label} • ${pb.benefit?.name}`;
                            });
                            setPackageBenefits(list);
                        } else if (matchedPkg.features && matchedPkg.features.length > 0) {
                            setPackageBenefits(matchedPkg.features);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load package benefits:', err);
            }
        };

        let targetPkgId = packageId;

        if (isVerificationFlow && pendingDetailsRaw) {
            setPricingLoading(true);
            try {
                const b = JSON.parse(pendingDetailsRaw);
                const sub = b.subscriptions?.[0];
                const pkg = sub?.packageVersion || sub?.package;
                if (pkg) {
                    targetPkgId = pkg.id || pkg.type;
                }
                setPricing({
                    packageName: pkg?.name || 'Care Plan',
                    basePrice: pkg?.basePrice || 0,
                    discountApplied: 0,
                    tax: 0,
                    total: 0, // No payment in verification flow
                    couponValid: false,
                });
            } catch (err) {
                console.error('Error pre-filling pricing in checkout:', err);
            } finally {
                setPricingLoading(false);
            }
        } else {
            if (packageId) {
                setPricingLoading(true);
                fetchCheckoutPreview()
                    .catch(() => Alert.alert('Error', 'Could not load package pricing.'))
                    .finally(() => setPricingLoading(false));
            }
        }

        if (targetPkgId) {
            loadPackageBenefits(targetPkgId, serviceRegionId);
        }
    }, [packageId, isVerificationFlow, pendingDetailsRaw, serviceRegionId]);

    // Apply coupon — calls preview again with the code
    const handleApplyCoupon = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingCoupon(true);
        setCouponError('');

        try {
            const result = await fetchCheckoutPreview(promoCode.trim().toUpperCase());
            if (result.couponValid) {
                setAppliedCouponCode(promoCode.trim().toUpperCase());
                Alert.alert('✅ Coupon Applied!', `You saved ₹${result.discountApplied.toFixed(2)} on this order.`);
            } else {
                setCouponError(result.couponMessage || 'Invalid or expired coupon code');
                setAppliedCouponCode('');
                // Pricing is already reset to no-coupon values by fetchCheckoutPreview
            }
        } catch (err) {
            setCouponError('Failed to validate coupon. Please try again.');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    // Remove coupon — re-fetch clean pricing
    const handleRemoveCoupon = async () => {
        setAppliedCouponCode('');
        setPromoCode('');
        setCouponError('');
        await fetchCheckoutPreview(); // No couponCode → clean pricing from server
    };

    const handlePay = async () => {
        if (!isPackageAvailable) {
            Alert.alert("Service Unavailable", "This package is not available at the selected service location pincode.");
            return;
        }
        setIsProcessing(true);
        try {
            const [storedUserData, storedToken] = await Promise.all([
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('userToken')
            ]);
            if (!storedUserData) throw new Error("You are not logged in. Session expired.");
            const user = JSON.parse(storedUserData);

            const subscriberDataRaw = params.subscriberData as string;
            const beneficiaryDataRaw = params.beneficiaryData as string;
            const medicalDataRaw = params.medicalData as string;
            const emergencyContactsRaw = params.emergencyContacts as string;
            const preferencesDataRaw = params.preferencesData as string;

            let subscriberData = {};
            // If no beneficiary params (direct from packages flow), keep as null
            let beneficiaryData: any = null;
            let medicalData = {};
            let emergencyContacts = {};
            let preferencesData = {};

            try { if (subscriberDataRaw) subscriberData = JSON.parse(subscriberDataRaw); } catch (e) { }
            try {
                if (beneficiaryDataRaw) {
                    // Beneficiary form was filled in — parse it
                    const parsed = JSON.parse(beneficiaryDataRaw);
                    beneficiaryData = {
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
                        phone: "9876543210",
                        ...parsed
                    };
                    if (parsed.fullName) beneficiaryData.name = parsed.fullName;

                    if (parsed.dob) {
                        try {
                            const [day, month, year] = parsed.dob.split(/[-/]/);
                            if (year && year.length === 4) {
                                beneficiaryData.age = new Date().getFullYear() - parseInt(year, 10);
                            }
                        } catch (err) { }
                    }
                }
            } catch (e) { }
            try { if (medicalDataRaw) medicalData = JSON.parse(medicalDataRaw); } catch (e) { }
            try { if (emergencyContactsRaw) emergencyContacts = JSON.parse(emergencyContactsRaw); } catch (e) { }
            try { if (preferencesDataRaw) preferencesData = JSON.parse(preferencesDataRaw); } catch (e) { }

            // CSA Verification / Activation Bypass
            if (isVerificationFlow) {
                const payload = {
                    beneficiaryId,
                    beneficiaryData,
                    medicalData,
                    emergencyContacts,
                    preferencesData
                };

                const response = await fetch(`${API_URL}/subscriber/subscriptions/activate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': storedToken ? `Bearer ${storedToken}` : ''
                    },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (data.success) {
                    const returnedBeneficiary = data.data?.beneficiary || {};
                    const returnId = returnedBeneficiary.id || beneficiaryId;
                    if (beneficiaryData.photoUri && returnId) {
                        try {
                            const token = storedToken;
                            const uri = beneficiaryData.photoUri;
                            const ext = uri.split('.').pop() || 'jpg';
                            const fileName = `photo_${Date.now()}.${ext}`;
                            const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

                            const formData = new FormData();
                            if (Platform.OS === 'web') {
                                const blobResponse = await fetch(uri);
                                const blob = await blobResponse.blob();
                                formData.append('file', blob, fileName);
                            } else {
                                formData.append('file', {
                                    uri,
                                    name: fileName,
                                    type: mimeType,
                                } as any);
                            }
                            formData.append('targetType', 'beneficiary');
                            formData.append('targetId', returnId);

                            const uploadResponse = await fetch(`${API_URL}/profile-photo/upload`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': token ? `Bearer ${token}` : ''
                                },
                                body: formData
                            });
                            const uploadResult = await uploadResponse.json();
                            console.log('[Checkout Verification Photo Upload] Result:', uploadResult);
                        } catch (uploadErr) {
                            console.error('Failed to upload beneficiary photo during verification checkout:', uploadErr);
                        }
                    }

                    await AsyncStorage.removeItem('beneficiaryDashboardCache');
                    queryClient.invalidateQueries({ queryKey: ['subscriberDashboard'] });

                    const resToken = data.data?.token || storedToken;
                    const resUser = data.data?.user;
                    if (resToken && resUser) {
                        await updateUser(resToken, resUser);
                    }

                    const activatedSub = data.data?.subscription || {};
                    replace('/(setup)/payment-success', {
                        orderId: activatedSub.id || 'N/A',
                        packageName: activatedSub.package?.name || pricing.packageName,
                        price: String(pricing.basePrice),
                        benefits: JSON.stringify(packageBenefits)
                    });
                } else {
                    throw new Error(data.message || "Activation failed on server.");
                }
                return;
            }

            // 1. Check if total is 0 (e.g. 100% discount). If so, skip Razorpay.
            let paymentDetails = {};
            
            if (pricing.total > 0) {
                // 2. Fetch Razorpay order from backend
                const orderRes = await fetch(`${API_URL}/subscriber/subscriptions/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': storedToken ? `Bearer ${storedToken}` : ''
                    },
                    body: JSON.stringify({ packageId, couponCode: appliedCouponCode || undefined })
                });
                const orderData = await orderRes.json();
                if (!orderData.success) {
                    throw new Error(orderData.message || "Failed to create payment order");
                }

                // 3. Open Razorpay Checkout
                const razorpayKey = getRazorpayKey();

                // ── Safety guard: alert devs immediately if the key is missing ──────────
                if (!razorpayKey) {
                    console.error(
                        '[Razorpay] KEY IS MISSING.\n' +
                        '  • Local dev: check .env has EXPO_PUBLIC_RAZORPAY_KEY_ID (no quotes around value)\n' +
                        '  • EAS build: check eas.json env block OR EAS Secrets dashboard'
                    );
                    Alert.alert(
                        '⚠️ Payment Config Error',
                        'Razorpay API key is not configured. Please contact support.\n\n(Dev: check console for details)'
                    );
                    setIsProcessing(false);
                    return;
                }

                console.log('[Razorpay] Key resolved:', razorpayKey.substring(0, 12) + '...');

                const options = {
                    description: `Mai-Hoonaa: ${pricing.packageName}`,
                    image: 'https://maihoonna.com/logo.png',
                    currency: orderData.data.currency,
                    key: razorpayKey,
                    amount: orderData.data.amount,
                    name: 'Mai-Hoonaa',
                    order_id: orderData.data.order_id,
                    prefill: {
                        email: user.email || '',
                        contact: user.phone || beneficiaryData?.phone || '',
                        name: user.name || ''
                    },
                    theme: { color: '#FE6700' }
                };

                try {
                    if (Platform.OS === 'web') {
                        // Razorpay Native SDK doesn't work on Web, mock for testing
                        paymentDetails = {
                            razorpay_payment_id: "pay_test_" + Date.now(),
                            razorpay_order_id: orderData.data.order_id,
                            razorpay_signature: "DEV_MOCK_SIGNATURE"
                        };
                        alert("Running on Web: Simulating successful Razorpay payment.");
                    } else {
                        // Try native checkout, fallback to mock if running in Expo Go (missing native module)
                        try {
                            console.log('[Razorpay] Opening with options:', JSON.stringify({
                                key: options.key,
                                amount: options.amount,
                                order_id: options.order_id,
                                currency: options.currency,
                            }));

                            // Expo Go: RazorpayCheckout native module is null — use dev mock
                            if (!RazorpayCheckout) {
                                console.warn("Razorpay Native Module is null (Expo Go). Using Dev Mock.");
                                paymentDetails = {
                                    razorpay_payment_id: "pay_test_" + Date.now(),
                                    razorpay_order_id: orderData.data.order_id,
                                    razorpay_signature: "DEV_MOCK_SIGNATURE"
                                };
                                Alert.alert("Test Mode 🧪", "Razorpay is not available in Expo Go.\n\nSimulating a successful payment so you can test the rest of the flow.");
                            } else {
                                const paymentResponse = await RazorpayCheckout.open(options);
                                paymentDetails = {
                                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                    razorpay_order_id: paymentResponse.razorpay_order_id,
                                    razorpay_signature: paymentResponse.razorpay_signature
                                };
                            }
                        } catch (paymentErr: any) {
                            const errMessage = paymentErr?.message || paymentErr?.description || '';
                            const errCode = paymentErr?.code;

                            if (errMessage.includes('Native module cannot be null') || errMessage.includes('RazorpayCheckout') || errMessage.includes('null')) {
                                // Missing native module (likely Expo Go)
                                console.warn("Razorpay Native Module missing. Using Dev Mock.");
                                paymentDetails = {
                                    razorpay_payment_id: "pay_test_" + Date.now(),
                                    razorpay_order_id: orderData.data.order_id,
                                    razorpay_signature: "DEV_MOCK_SIGNATURE"
                                };
                                Alert.alert("Test Mode 🧪", "Razorpay native module not found (Expo Go). Simulating successful payment.");
                            } else if (errCode === 0 || errMessage.toLowerCase().includes('cancel')) {
                                // User cancelled the payment — not an error, just exit gracefully
                                console.log('[Razorpay] Payment cancelled by user.');
                                setIsProcessing(false);
                                return;
                            } else {
                                // Real payment error
                                console.error('[Razorpay Error]', errCode, errMessage, JSON.stringify(paymentErr));
                                setIsProcessing(false);
                                Alert.alert('Payment Failed', errMessage || 'Payment could not be completed. Please try again.');
                                return;
                            }
                        }
                    }
                } catch (err: any) {
                    setIsProcessing(false);
                    return;
                }
            }

            // 4. Call the real backend to create beneficiary + subscription
            // couponCode sent so backend re-validates and applies it server-side
            const payload = {
                userId: user.id,
                packageId: packageId,
                subscriberData,
                beneficiaryData,
                medicalData,
                emergencyContacts,
                preferencesData,
                couponCode: appliedCouponCode || undefined,
                ...paymentDetails
            };

            const response = await fetch(`${API_URL}/subscriber/subscriptions/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': storedToken ? `Bearer ${storedToken}` : ''
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                // Upload beneficiary photo if selected
                const beneficiaryId = data.beneficiaryId;
                if (beneficiaryData?.photoUri && beneficiaryId) {
                    try {
                        const token = storedToken;
                        const uri = beneficiaryData.photoUri;
                        const ext = uri.split('.').pop() || 'jpg';
                        const fileName = `photo_${Date.now()}.${ext}`;
                        const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

                        const formData = new FormData();
                        if (Platform.OS === 'web') {
                            const blobResponse = await fetch(uri);
                            const blob = await blobResponse.blob();
                            formData.append('file', blob, fileName);
                        } else {
                            formData.append('file', {
                                uri,
                                name: fileName,
                                type: mimeType,
                            } as any);
                        }
                        formData.append('targetType', 'beneficiary');
                        formData.append('targetId', beneficiaryId);

                        const uploadResponse = await fetch(`${API_URL}/profile-photo/upload`, {
                            method: 'POST',
                            headers: {
                                'Authorization': token ? `Bearer ${token}` : ''
                            },
                            body: formData
                        });
                        const uploadResult = await uploadResponse.json();
                        console.log('[Checkout Photo Upload] Result:', uploadResult);
                    } catch (uploadErr) {
                        console.error('Failed to upload beneficiary photo during checkout:', uploadErr);
                    }
                }

                // ⚠️ DEV ONLY — auto-set beneficiary password if provided — remove when done testing
                if (beneficiaryData?.devPassword && beneficiaryData?.phone) {
                    fetch(`${API_URL}/dev/set-beneficiary-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: beneficiaryData.phone, password: beneficiaryData.devPassword }),
                    }).catch(() => {}); // fire-and-forget, non-blocking
                }
                // end DEV ONLY

                // Invalidate dashboard queries so the new subscription appears immediately
                await AsyncStorage.removeItem('beneficiaryDashboardCache');
                queryClient.invalidateQueries({ queryKey: ['subscriberDashboard'] });

                const resToken = data.token || storedToken;
                const resUser = data.user;
                if (resToken && resUser) {
                    await updateUser(resToken, resUser);
                }

                // Payment gateway is mocked for now, but beneficiary is saved in DB
                replace('/(setup)/payment-success', {
                    orderId: data.subscriptionId,
                    packageName: data.package || pricing.packageName,
                    price: pricing.total.toString(),
                    benefits: JSON.stringify(packageBenefits)
                });
            } else {
                throw new Error(data.message || "Purchase failed on server.");
            }
        } catch (error: any) {
            Alert.alert("Checkout Failed", error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!fontsLoaded) {
        return (
            <View style={[styles.mainBackground, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#FE6700" />
            </View>
        );
    }

    return (
        <View style={styles.mainBackground}>

            {/* HEADER (White Background) */}
            <View style={styles.safeAreaWhite}>
                <HeaderSpacer backgroundColor="#FFFFFF" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        pop('/(setup)/subscription-packages');
                    }} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Checkout</Text>
                        <Text style={styles.headerSubtitle}>Complete your purchase securely</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {/* MAIN BODY (Beige Background) */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <Text style={styles.sectionTitle}>{isVerificationFlow ? 'Verify & Activate Plan' : 'Payment Details'}</Text>
                    <Text style={styles.sectionSubtitle}>{isVerificationFlow ? 'Review details and agree to terms to activate pre-paid package' : 'Choose your preferred payment method'}</Text>

                    {/* Service Location Confirmation Card */}
                    {(serviceAddress || (fullPackage && !fullPackage.isGlobal)) && (
                        <View style={styles.servicePincodeCard}>
                            <View style={styles.servicePincodeHeader}>
                                <Feather name="map-pin" size={18} color="#FE6700" />
                                <Text style={styles.servicePincodeTitle}>
                                    Confirm Service Location
                                </Text>
                            </View>
                            <Text style={styles.servicePincodeSubtitle}>
                                Care services will be delivered to the address below.
                            </Text>

                            {serviceAddress ? (
                                <View style={styles.selectedAddressBox}>
                                    <Feather name="map" size={14} color="#F97316" style={{ marginRight: 6 }} />
                                    <Text style={styles.selectedAddressText} numberOfLines={3}>
                                        {serviceAddress}
                                    </Text>
                                </View>
                            ) : null}

                            {/* If location was pre-validated on packages screen → show confirmed badge */}
                            {serviceRegionId ? (
                                <View style={styles.statusBox}>
                                    <View style={styles.statusRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                        <Text style={styles.statusSuccessText}>
                                            Location verified — service available in your area
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                /* Fallback: user came without a pre-validated region (manual pincode path) */
                                fullPackage && !fullPackage.isGlobal ? (
                                    <>
                                        <View style={styles.pinInputRow}>
                                            <TextInput
                                                style={styles.pinTextInput}
                                                placeholder="Enter 6-digit Pincode"
                                                placeholderTextColor="#9CA3AF"
                                                value={servicePincode}
                                                onChangeText={(text) => setServicePincode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                                                keyboardType="numeric"
                                                maxLength={6}
                                            />
                                            {checkingPincode && <ActivityIndicator size="small" color="#FE6700" style={{ marginLeft: 10 }} />}
                                        </View>

                                        {serviceChecked && (
                                            <View style={styles.statusBox}>
                                                {serviceAvailable ? (
                                                    <View style={styles.statusRow}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                        <Text style={styles.statusSuccessText}>
                                                            Serving {serviceLocationName}!
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.statusRow}>
                                                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                                                        <Text style={styles.statusErrorText}>
                                                            Sorry, we do not serve this pincode yet.
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {serviceChecked && serviceAvailable && !isPackageAvailable && (
                                            <View style={styles.warningBox}>
                                                <Ionicons name="warning" size={18} color="#EA580C" />
                                                <Text style={styles.warningText}>
                                                    This package is not available in {serviceLocationName || 'this region'}. Please choose a different package.
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                ) : null
                            )}
                        </View>
                    )}

                    {isVerificationFlow ? (
                        <View style={styles.paymentCard}>
                            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: fs(30), color: '#111827', marginBottom: fs(12), fontWeight: '700' }}>
                                Consent & Agreement
                            </Text>
                            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: fs(24), color: '#4B5563', lineHeight: fs(32), marginBottom: fs(24) }}>
                                Please review the pre-filled package details below. By checking the box below, you agree to our Terms of Service and Privacy Policy, and authorize activation of this care package.
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: fs(32) }}>
                                <TouchableOpacity 
                                    onPress={() => setAgreed(!agreed)} 
                                    style={{ 
                                        width: fs(40), 
                                        height: fs(40), 
                                        borderWidth: 2, 
                                        borderColor: '#FE6700', 
                                        borderRadius: 4, 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        marginRight: fs(16),
                                        backgroundColor: agreed ? '#FE6700' : 'transparent'
                                    }}
                                >
                                    {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                </TouchableOpacity>
                                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: fs(22), color: '#374151', flex: 1 }}>
                                    I agree to the Terms of Service & Privacy Policy
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.payButton, (isProcessing || !agreed || !isLocationReady) && { opacity: 0.6 }]}
                                onPress={handlePay}
                                disabled={isProcessing || pricingLoading || !agreed || !isLocationReady}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Feather name="check-circle" size={16} color="#FFF" style={styles.payBtnIcon} />
                                        <Text style={styles.payButtonText}>
                                            Activate Package
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* SECURITY BADGE */}
                            <View style={styles.securityBadge}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" style={styles.securityIcon} />
                                <View style={styles.securityTextWrap}>
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

                                        {/* ─── PROMO / COUPON SECTION ─── */}
                                        <View style={styles.couponCard}>
                                            <View style={styles.couponHeader}>
                                                <Ionicons name="pricetag-outline" size={20} color="#FE6700" />
                                                <Text style={styles.couponHeaderText}>Have a Promo Code?</Text>
                                            </View>

                                            {!pricing.couponValid ? (
                                                <>
                                                    <View style={styles.promoInputRow}>
                                                        <TextInput
                                                            style={styles.promoInput}
                                                            placeholder="Enter Code"
                                                            placeholderTextColor="#9CA3AF"
                                                            value={promoCode}
                                                            onChangeText={(text) => { setPromoCode(text.toUpperCase()); setCouponError(''); }}
                                                            autoCapitalize="characters"
                                                            autoCorrect={false}
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
                                                            <Text style={styles.couponAppliedCode}>{appliedCouponCode}</Text>
                                                            <Text style={styles.couponAppliedSaving}>You saved ₹{pricing.discountApplied.toFixed(2)}!</Text>
                                                        </View>
                                                    </View>
                                                    <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeBtn}>
                                                        <Text style={styles.removeBtnText}>Remove</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>

                                        <View style={styles.divider} />

                                        <TouchableOpacity
                                            style={[styles.payButton, (isProcessing || !isLocationReady) && { opacity: 0.7 }]}
                                            onPress={handlePay}
                                            disabled={isProcessing || pricingLoading || !isLocationReady}
                                        >
                                            {isProcessing ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Feather name="lock" size={16} color="#FFF" style={styles.payBtnIcon} />
                                                    <Text style={styles.payButtonText}>
                                                        Pay ₹{pricingLoading ? '...' : pricing.total.toFixed(2)}
                                                    </Text>
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
                        </>
                    )}
                    {/* END MASTER PAYMENT CARD */}

                    {/* DYNAMIC ORDER SUMMARY */}
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>

                        {pricingLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color="#FE6700" />
                                <Text style={{ marginTop: 10, color: '#6B6B6B' }}>Calculating Pricing...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.planName}>{pricing.packageName}</Text>
                                <Text style={styles.planDuration}>1 Month</Text>

                                <View style={styles.featuresList}>
                                    {(packageBenefits.length > 0
                                        ? packageBenefits
                                        : ['Weekly health checkups', 'Vitals monitoring', 'Emergency contact support', 'Basic companionship']
                                    ).map((feature, index) => (
                                        <View key={index} style={styles.featureRow}>
                                            <Ionicons name="checkmark-circle" size={18} color="#FE6700" />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.divider} />

                                {isVerificationFlow ? (
                                    <>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Package Price</Text>
                                            <Text style={styles.priceValue}>₹{pricing.basePrice.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Amount Due Now</Text>
                                            <Text style={[styles.priceValue, { color: '#059669', fontWeight: '700' }]}>₹0.00 (Pre-paid by CSA)</Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>Subtotal</Text>
                                            <Text style={styles.priceValue}>₹{pricing.basePrice.toFixed(2)}</Text>
                                        </View>
                                        {pricing.couponValid && (
                                            <View style={styles.priceRow}>
                                                <Text style={[styles.priceLabel, { color: '#059669' }]}>Discount ({appliedCouponCode})</Text>
                                                <Text style={[styles.priceValue, { color: '#059669' }]}>-₹{pricing.discountApplied.toFixed(2)}</Text>
                                            </View>
                                        )}
                                        <View style={styles.priceRow}>
                                            <Text style={styles.priceLabel}>GST (18%)</Text>
                                            <Text style={styles.priceValue}>₹{pricing.tax.toFixed(2)}</Text>
                                        </View>

                                        <View style={[styles.priceRow, { marginTop: 12 }]}>
                                            <Text style={styles.totalLabel}>Total</Text>
                                            <Text style={styles.totalValue}>₹{pricing.total.toFixed(2)}</Text>
                                        </View>
                                    </>
                                )}
                            </>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainBackground: { flex: 1, backgroundColor: '#FFF1E6' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center' },
    safeAreaWhite: { backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: fs(44), paddingTop: Platform.OS === 'android' ? fs(20) : fs(16), paddingBottom: fs(24) },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerSpacer: { width: 40 },
    headerTitles: { flex: 1, alignItems: 'center' },
    headerTitle: { fontFamily: 'Poppins_400Regular', fontSize: fs(28), lineHeight: fs(36), color: '#000000', textAlign: 'center' },
    headerSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: fs(22), lineHeight: fs(30), color: '#6B6B6B', marginTop: 1, textAlign: 'center' },
    scrollContent: { width: '100%', maxWidth: 716, alignSelf: 'center', paddingHorizontal: fs(36), paddingTop: fs(51), paddingBottom: fs(48) },
    sectionTitle: { fontFamily: 'Poppins_400Regular', fontSize: fs(38), lineHeight: fs(50), color: '#000000' },
    sectionSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: fs(26), lineHeight: fs(36), color: '#000000', marginTop: fs(6), marginBottom: fs(29) },
    securityBadge: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#0BB85F', borderRadius: fs(13), paddingHorizontal: fs(29), paddingVertical: fs(27), marginBottom: fs(41), alignItems: 'center' },
    securityIcon: { marginRight: fs(25), flexShrink: 0 },
    securityTextWrap: { flex: 1, minWidth: 0 },
    securityTextBold: { color: '#07A640', fontFamily: 'Poppins_400Regular', fontSize: fs(23), lineHeight: fs(30), flexShrink: 1 },
    securityText: { color: '#07A640', fontFamily: 'Poppins_400Regular', fontSize: fs(23), lineHeight: fs(30), marginTop: 1, flexShrink: 1 },

    // TABS WRAPPER
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: fs(30),
        padding: fs(10),
        gap: fs(14),
        marginBottom: fs(56),
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18 },
            android: { elevation: 7 },
            web: { boxShadow: '0px 8px 22px rgba(0, 0, 0, 0.18)' }
        }),
    },
    tab: { flex: 1, minHeight: fs(68), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: fs(34) },
    tabActive: { backgroundColor: '#FE6700' },
    tabInactive: { backgroundColor: '#FFE1CC' },
    tabText: { marginLeft: fs(8), fontSize: fs(23), lineHeight: fs(29), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    tabTextActive: { color: '#FFFFFF' },

    // MASTER PAYMENT CARD (Fixes the missing white background from Screenshot 10)
    paymentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: fs(20),
        paddingHorizontal: fs(24),
        paddingTop: fs(49),
        paddingBottom: fs(46),
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 }, web: { boxShadow: '0px 7px 20px rgba(0, 0, 0, 0.08)' } }),
    },

    // UPI GREY BOX
    upiAppsContainer: { backgroundColor: '#E6E6E6', borderColor: '#BEDBFF', borderWidth: 0.86, borderRadius: fs(12), paddingHorizontal: fs(28), paddingTop: fs(29), paddingBottom: fs(22), marginBottom: fs(35) },
    upiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: fs(20) },
    upiHeaderText: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000', marginLeft: fs(22) },
    upiAppsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    upiAppPill: { backgroundColor: '#FFFFFF', paddingHorizontal: fs(20), paddingVertical: fs(8), borderRadius: fs(5), marginRight: fs(14), marginBottom: fs(14) },
    upiAppText: { fontSize: fs(22), lineHeight: fs(30), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },

    placeholderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    placeholderText: { marginTop: 12, fontWeight: '400', color: '#9CA3AF', fontSize: 16, fontFamily: 'Poppins_400Regular' },
    inputLabel: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000', marginBottom: fs(16) },
    input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C8C8C8', borderRadius: fs(12), paddingHorizontal: fs(26), height: fs(79), fontSize: fs(26), lineHeight: fs(34), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    inputHelper: { fontSize: fs(19), lineHeight: fs(27), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#6B6B6B', marginTop: fs(17), marginBottom: fs(35) },

    // QR BOX (Fixes the white border box from Screenshot 10)
    qrBox: { backgroundColor: '#F9FAFB', borderRadius: fs(12), paddingVertical: fs(44), alignItems: 'center', marginBottom: fs(29) },
    qrIcon: { marginBottom: fs(25) },
    qrText: { fontSize: fs(22), lineHeight: fs(30), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#4B5563' },

    promoTipBox: { flexDirection: 'row', backgroundColor: '#FFF7F2', borderWidth: 1, borderColor: '#FFE1CC', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
    giftIcon: { marginRight: 12 },
    promoTipTextContainer: { flex: 1 },
    promoTipText: { fontSize: 13, fontWeight: '400', color: '#111827' },
    promoHighlight: { color: '#FE6700', fontWeight: '700' },
    applyBtnText: { color: '#FE6700', fontWeight: '600', fontSize: fs(22), lineHeight: fs(30), fontFamily: 'Poppins_600SemiBold' },
    promoInputRow: { flexDirection: 'row', marginBottom: fs(15) },
    promoInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: fs(12), paddingHorizontal: fs(25), height: fs(58), fontSize: fs(24), lineHeight: fs(32), fontWeight: '400', fontFamily: 'Poppins_400Regular', marginRight: fs(24) },
    applyBtnOutline: { borderWidth: 1, borderColor: '#FE6700', borderRadius: fs(10), justifyContent: 'center', paddingHorizontal: fs(21), backgroundColor: '#FFFFFF' },
    payButton: { backgroundColor: '#FE6700', flexDirection: 'row', height: fs(78), borderRadius: fs(9), justifyContent: 'center', alignItems: 'center', marginBottom: fs(35) },
    payBtnIcon: { marginRight: fs(14) },
    payButtonText: { color: '#FFFFFF', fontSize: fs(26), lineHeight: fs(34), fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
    termsText: { textAlign: 'center', fontSize: fs(19), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#6B6B6B', paddingHorizontal: fs(16), lineHeight: fs(27) },

    // ORDER SUMMARY
    summaryContainer: {
        marginTop: fs(47),
        backgroundColor: '#FFFFFF', borderRadius: fs(20), paddingHorizontal: fs(40), paddingTop: fs(26), paddingBottom: fs(36),
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 }, web: { boxShadow: '0px 7px 20px rgba(0, 0, 0, 0.08)' } }),
    },
    summaryTitle: { fontSize: fs(26), lineHeight: fs(36), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000', marginBottom: fs(28) },
    planName: { fontSize: fs(30), lineHeight: fs(40), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    planDuration: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#6B6B6B', marginBottom: fs(23), marginTop: fs(15) },
    featuresList: { backgroundColor: '#F9FAFB', borderRadius: fs(11), paddingHorizontal: fs(26), paddingTop: fs(28), paddingBottom: fs(16), marginBottom: fs(25) },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: fs(18) },
    featureText: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000', marginLeft: fs(22) },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: fs(22) },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: fs(22) },
    priceLabel: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    priceValue: { fontSize: fs(23), lineHeight: fs(31), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    totalLabel: { fontSize: fs(26), lineHeight: fs(36), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    totalValue: { fontSize: fs(26), lineHeight: fs(36), fontWeight: '600', fontFamily: 'Poppins_600SemiBold', color: '#FE6700' },

    // COUPON SECTION
    couponCard: {
        marginBottom: fs(31),
    },
    couponHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: fs(18), gap: fs(8) },
    couponHeaderText: { fontSize: fs(26), lineHeight: fs(36), fontWeight: '400', fontFamily: 'Poppins_400Regular', color: '#000000' },
    couponHint: { fontSize: fs(16), lineHeight: fs(22), color: '#9CA3AF', fontFamily: 'Poppins_400Regular' },
    couponErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -16 },
    couponErrorText: { fontSize: 13, color: '#EF4444', flex: 1, fontFamily: 'Poppins_400Regular' },
    couponAppliedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#34D399' },
    couponAppliedLeft: { flexDirection: 'row', alignItems: 'center' },
    couponAppliedCode: { fontSize: 14, fontWeight: '700', color: '#047857', letterSpacing: 0.5, fontFamily: 'Poppins_700Bold' },
    couponAppliedSaving: { fontSize: 12, color: '#059669', marginTop: 2, fontFamily: 'Poppins_400Regular' },
    removeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 6 },
    removeBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444', fontFamily: 'Poppins_700Bold' },

    servicePincodeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: fs(20),
        paddingHorizontal: fs(24),
        paddingVertical: fs(24),
        marginBottom: fs(41),
        ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18 }, android: { elevation: 4 }, web: { boxShadow: '0px 7px 20px rgba(0, 0, 0, 0.08)' } }),
    },
    servicePincodeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: fs(12),
        gap: fs(8),
    },
    servicePincodeTitle: {
        fontSize: fs(26),
        lineHeight: fs(36),
        fontWeight: '700',
        fontFamily: 'Poppins_700Bold',
        color: '#111827',
    },
    servicePincodeSubtitle: {
        fontSize: fs(22),
        lineHeight: fs(30),
        color: '#4B5563',
        fontFamily: 'Poppins_400Regular',
        marginBottom: fs(16),
    },
    pinInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: fs(12),
    },
    pinTextInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#C8C8C8',
        borderRadius: fs(12),
        paddingHorizontal: fs(26),
        height: fs(79),
        fontSize: fs(26),
        lineHeight: fs(34),
        fontWeight: '400',
        fontFamily: 'Poppins_400Regular',
        color: '#000000',
    },
    statusBox: {
        marginTop: fs(8),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusSuccessText: {
        fontSize: fs(22),
        color: '#10B981',
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
    },
    statusErrorText: {
        fontSize: fs(22),
        color: '#EF4444',
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7F2',
        borderWidth: 1,
        borderColor: '#FFE1CC',
        borderRadius: fs(12),
        padding: fs(16),
        marginTop: fs(16),
        gap: 8,
    },
    warningText: {
        fontSize: fs(20),
        lineHeight: fs(28),
        color: '#EA580C',
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
    },
    selectedAddressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5ED',
        borderRadius: fs(12),
        padding: fs(16),
        marginBottom: fs(16),
        borderWidth: 1,
        borderColor: '#FDE6D5'
    },
    selectedAddressText: {
        fontSize: fs(22),
        color: '#4B5563',
        flex: 1,
        lineHeight: fs(30),
        fontFamily: 'Poppins_400Regular'
    },
});
