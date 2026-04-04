import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from '@/constants/api';

export default function RegisterScreen() {
    const router = useRouter();

    // Form State
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        pincode: "",
        age: "",
        password: "",
    });

    // Pincode Validation State
    const [isCheckingPincode, setIsCheckingPincode] = useState(false);
    const [zoneDetails, setZoneDetails] = useState<any>(null); // null = unknown, false = invalid, object = valid

    const [isLoading, setIsLoading] = useState(false);

    // Dynamic Pincode Check
    useEffect(() => {
        const checkPincode = async () => {
            if (form.pincode.length === 6) {
                setIsCheckingPincode(true);
                try {
                    const response = await fetch(`${API_URL}/public/zones/check-pincode?pincode=${form.pincode}`);
                    const data = await response.json();
                    
                    if (data.success && data.available) {
                        setZoneDetails(data);
                    } else {
                        setZoneDetails(false); // Indicates checked but not available
                    }
                } catch (err) {
                    console.error("Failed to check pincode", err);
                    setZoneDetails(null);
                } finally {
                    setIsCheckingPincode(false);
                }
            } else {
                setZoneDetails(null);
            }
        };

        const timeoutId = setTimeout(() => {
            checkPincode();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [form.pincode]);

    const handleContinueToVerification = () => {
        if (!form.name.trim() || form.phone.length !== 10 || form.pincode.length !== 6) {
            Alert.alert("Missing Fields", "Please complete all required fields correctly.");
            return;
        }
        setStep(2);
    };

    const handleRegister = async () => {
        const ageNum = parseInt(form.age, 10);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
            Alert.alert("Invalid Age", "Please enter a valid age (18+).");
            return;
        }

        if (!form.password || form.password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: `+91${form.phone}`,
                    name: form.name,
                    age: ageNum,
                    password: form.password
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Save user session!
                await AsyncStorage.setItem('userToken', data.token);
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));

                // Registration successful! Store tokens/details and go to dashboard
                if (data.user.role === 'care_companion') {
                    router.replace("/(care-companion)");
                } else if (data.user.role === 'beneficiary') {
                    router.replace("/(beneficiary)");
                } else {
                    router.replace("/(subscriber)");
                }
            } else {
                Alert.alert("Registration Failed", data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error("Register Error:", error);
            Alert.alert("Network Error", "Could not connect to the backend server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                
                {/* Header Navbar */}
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>Create Account</Text>
                    <View style={styles.backBtn} /> {/* Placeholder for center alignment */}
                </View>

                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    
                    {/* Welcome Header */}
                    <View style={styles.welcomeHeader}>
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={styles.subtitle}>Let's get started with your care companion journey</Text>
                    </View>

                    {/* Step 1: Basic Info & Pincode */}
                    {step === 1 && (
                        <View style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.name}
                                    onChangeText={(text) => setForm({ ...form, name: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number *</Text>
                                <View style={styles.phoneRow}>
                                    <View style={styles.countryCodeBox}>
                                        <Text style={styles.countryCodeText}>+91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Enter 10-digit number"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        maxLength={10}
                                        value={form.phone}
                                        onChangeText={(text) => setForm({ ...form, phone: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Pincode / ZIP Code *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 6-digit pincode"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    maxLength={6}
                                    value={form.pincode}
                                    onChangeText={(text) => setForm({ ...form, pincode: text })}
                                />
                            </View>

                            {/* Pincode Validation Loading state */}
                            {isCheckingPincode && (
                                <View style={styles.checkingBox}>
                                    <ActivityIndicator size="small" color="#FBA56B" />
                                    <Text style={styles.checkingText}>Checking availability...</Text>
                                </View>
                            )}

                            {/* Pincode Validation Success Box */}
                            {zoneDetails && zoneDetails.available === true && (
                                <View>
                                    <View style={styles.locationPinRow}>
                                        <Ionicons name="location" size={14} color="#EF4444" />
                                        <Text style={styles.locationPinText}>{zoneDetails.location}</Text>
                                    </View>
                                    
                                    <View style={styles.successBox}>
                                        <View style={styles.successHeader}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                                            <Text style={styles.successMessage}>Great! We serve {zoneDetails.location}</Text>
                                        </View>
                                        <View style={styles.successStatsRow}>
                                            <Ionicons name="checkmark" size={14} color="#10B981" />
                                            <Text style={styles.successStatText}>{zoneDetails.stats.companions} care companions available</Text>
                                        </View>
                                        <View style={styles.successStatsRow}>
                                            <Ionicons name="checkmark" size={14} color="#10B981" />
                                            <Text style={styles.successStatText}>{zoneDetails.stats.centers} active care centers</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Pincode Validation Failure Box */}
                            {zoneDetails === false && (
                                <View style={styles.unavailableBox}>
                                    <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
                                    <Text style={styles.unavailableText}>We are not serving this area yet, but we are coming soon!</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleContinueToVerification}
                            >
                                <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 2: Final Details (Age / Password) */}
                    {step === 2 && (
                        <View style={styles.formCard}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Age *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your age"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    value={form.age}
                                    onChangeText={(text) => setForm({ ...form, age: text })}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Secure password (min 6 chars)"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                    value={form.password}
                                    onChangeText={(text) => setForm({ ...form, password: text })}
                                    editable={!isLoading}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Finish Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.bottomSection}>
                        <TouchableOpacity style={styles.loginRow} onPress={() => router.push("/(auth)/login-password")}>
                            <Text style={styles.loginTextNormal}>Already have an account? </Text>
                            <Text style={styles.loginTextHighlight}>Login</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>
                            By continuing, you agree to our <Text style={styles.footerLink}>Terms of Service</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
    navHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, backgroundColor: "#FFFFFF" },
    backBtn: { width: 40, alignItems: "flex-start", justifyContent: "center" },
    navTitle: { fontSize: 16, fontWeight: "500", color: "#111827" },
    
    container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 20, backgroundColor: "#FFFFFF" },
    
    welcomeHeader: { alignItems: "center", marginBottom: 32 },
    title: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 8 },
    subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 10 },
    
    formCard: { backgroundColor: "#FFF5ED", padding: 20, borderRadius: 16, marginBottom: 24 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, color: "#374151", marginBottom: 8, fontWeight: "600" },
    input: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 15,
        color: "#111827",
    },
    
    phoneRow: { flexDirection: "row", alignItems: "center" },
    countryCodeBox: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        height: 54,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    countryCodeText: { fontSize: 15, color: "#111827", fontWeight: "600" },
    phoneInput: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 54,
        fontSize: 15,
        color: "#111827"
    },
    
    checkingBox: { flexDirection: 'row', alignItems: 'center', marginTop: -10, marginBottom: 15 },
    checkingText: { fontSize: 12, color: '#6B7280', marginLeft: 8 },
    
    locationPinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
    locationPinText: { fontSize: 13, color: '#6B7280', marginLeft: 6, fontWeight: '500' },
    
    successBox: {
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#10B981",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    successHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    successMessage: { fontSize: 14, fontWeight: "600", color: "#059669", marginLeft: 8 },
    successStatsRow: { flexDirection: "row", alignItems: "center", marginLeft: 8, marginBottom: 4 },
    successStatText: { fontSize: 12, color: "#059669", marginLeft: 8 },
    
    unavailableBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    unavailableText: { flex: 1, fontSize: 13, color: "#D97706", marginLeft: 12, lineHeight: 18 },
    
    primaryButton: {
        backgroundColor: "#FBA56B",
        height: 54,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    primaryButtonDisabled: { backgroundColor: "#FDBA8C" },
    primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
    
    bottomSection: { alignItems: "center", marginTop: 10 },
    loginRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginBottom: 20 },
    loginTextNormal: { fontSize: 14, color: "#6B7280" },
    loginTextHighlight: { fontSize: 14, color: "#F97316", fontWeight: "600" },
    
    footerText: { fontSize: 12, color: "#9CA3AF", textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
    footerLink: { color: "#F97316", fontWeight: "500" }
});
