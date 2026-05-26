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
import { LinearGradient } from "expo-linear-gradient";
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

                    if (data.success && data.data && data.data.available) {
                        setZoneDetails(data.data);
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
                // The actual payload is inside the 'data' property of ApiResponse
                const result = data.data;

                // Save user session!
                await AsyncStorage.setItem('userToken', result.token);
                await AsyncStorage.setItem('userData', JSON.stringify(result.user));

                // Registration successful! Store tokens/details and go to dashboard
                if (result.user.role === 'care_companion') {
                    router.replace("/(care-companion)");
                } else if (result.user.role === 'beneficiary') {
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
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
            >
                <View style={styles.navHeader}>
                    <TouchableOpacity
                        onPress={() => step === 2 ? setStep(1) : router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#111827" />
                    </TouchableOpacity>

                    <Text style={styles.navTitle}>Create Account</Text>
                    <View style={styles.backBtn} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.welcomeHeader}>
                        <Text style={styles.title}>Welcome!</Text>
                        <Text style={styles.subtitle}>
                            Let's get started with your care companion journey
                        </Text>
                    </View>

                    {step === 1 && (
                        <LinearGradient
                            colors={["#FFFFFF", "#FFE2CC"]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.formCard}
                        >
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

                            {isCheckingPincode && (
                                <View style={styles.checkingBox}>
                                    <ActivityIndicator size="small" color="#FE6700" />
                                    <Text style={styles.checkingText}>Checking availability...</Text>
                                </View>
                            )}

                            {zoneDetails && zoneDetails.available === true && (
                                <View>
                                    <View style={styles.locationPinRow}>
                                        <Ionicons name="pin" size={14} color="#EF4444" />
                                        <Text style={styles.locationPinText}>{zoneDetails.location}</Text>
                                    </View>

                                    <View style={styles.successBox}>
                                        <View style={styles.successHeader}>
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
                                            <Text style={styles.successMessage}>
                                                Great! We serve {zoneDetails.location}
                                            </Text>
                                        </View>

                                        <View style={styles.successStatsRow}>
                                            <Text style={styles.successCheck}>✓</Text>
                                            <Text style={styles.successStatText}>
                                                {zoneDetails.stats.companions} care companions available
                                            </Text>
                                        </View>

                                        <View style={styles.successStatsRow}>
                                            <Text style={styles.successCheck}>✓</Text>
                                            <Text style={styles.successStatText}>
                                                {zoneDetails.stats.centers} active care centers
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {zoneDetails === false && (
                                <View style={styles.unavailableBox}>
                                    <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
                                    <Text style={styles.unavailableText}>
                                        We are not serving this area yet, but we are coming soon!
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleContinueToVerification}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.primaryButtonText}>Continue to Verification</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    )}

                    {step === 2 && (
                        <LinearGradient
                            colors={["#FFFFFF", "#FFE2CC"]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.formCard}
                        >
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
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Finish Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </LinearGradient>
                    )}

                    <View style={styles.bottomSection}>
                        <TouchableOpacity
                            style={styles.loginRow}
                            onPress={() => router.push("/(auth)/login-password")}
                        >
                            <Text style={styles.loginTextNormal}>Already have an account? </Text>
                            <Text style={styles.loginTextHighlight}>Login</Text>
                        </TouchableOpacity>

                        <Text style={styles.footerText}>
                            By continuing, you agree to our{" "}
                            <Text style={styles.footerLink}>Terms of Service</Text>
                            {"\n"}and <Text style={styles.footerLink}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    keyboardView: {
        flex: 1,
    },
    navHeader: {
        height: Platform.OS === "ios" ? 54 : 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    navTitle: {
        fontSize: 16,
        lineHeight: 24,
        color: "#000000",
        fontFamily: "Poppins-Regular",
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 42,
        paddingBottom: 24,
        backgroundColor: "#FFFFFF",
    },
    welcomeHeader: {
        alignItems: "center",
        marginBottom: 34,
    },
    title: {
        fontSize: 24,
        lineHeight: 32,
        color: "#000000",
        fontFamily: "Poppins-SemiBold",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: "#667085",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
    },
    formCard: {
        width: "100%",
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingTop: 26,
        paddingBottom: 40,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    inputGroup: {
        marginBottom: 28,
    },
    label: {
        fontSize: 14,
        lineHeight: 20,
        color: "#344054",
        fontFamily: "Poppins-Medium",
        marginBottom: 9,
    },
    input: {
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        fontSize: 16,
        lineHeight: 24,
        color: "#111827",
        fontFamily: "Poppins-Regular",
    },
    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    countryCodeBox: {
        width: 64,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    countryCodeText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#000000",
        fontFamily: "Poppins-Regular",
    },
    phoneInput: {
        flex: 1,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        fontSize: 16,
        lineHeight: 24,
        color: "#111827",
        fontFamily: "Poppins-Regular",
    },
    checkingBox: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: -14,
        marginBottom: 18,
    },
    checkingText: {
        fontSize: 12,
        color: "#667085",
        marginLeft: 8,
        fontFamily: "Poppins-Regular",
    },
    locationPinRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: -10,
        marginBottom: 14,
        paddingHorizontal: 2,
    },
    locationPinText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#667085",
        marginLeft: 6,
        fontFamily: "Poppins-Regular",
    },
    successBox: {
        backgroundColor: "#ECFDF3",
        borderWidth: 1,
        borderColor: "#22C55E",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 15,
        marginBottom: 18,
    },
    successHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    successMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: "#16A34A",
        marginLeft: 10,
        fontFamily: "Poppins-Regular",
    },
    successStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 33,
        marginBottom: 2,
    },
    successCheck: {
        fontSize: 14,
        lineHeight: 20,
        color: "#16A34A",
        marginRight: 6,
        fontFamily: "Poppins-Regular",
    },
    successStatText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#16A34A",
        fontFamily: "Poppins-Regular",
    },
    unavailableBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 8,
        padding: 14,
        marginBottom: 18,
    },
    unavailableText: {
        flex: 1,
        fontSize: 13,
        color: "#D97706",
        marginLeft: 10,
        lineHeight: 18,
        fontFamily: "Poppins-Regular",
    },
    primaryButton: {
        height: 48,
        borderRadius: 8,
        backgroundColor: "#FFA366",
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonDisabled: {
        opacity: 0.75,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "Poppins-SemiBold",
    },
    bottomSection: {
        alignItems: "center",
        marginTop: 38,
    },
    loginRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 50,
    },
    loginTextNormal: {
        fontSize: 16,
        lineHeight: 24,
        color: "#6B6B6B",
        fontFamily: "Poppins-Regular",
    },
    loginTextHighlight: {
        fontSize: 16,
        lineHeight: 24,
        color: "#FE6700",
        fontFamily: "Poppins-Medium",
    },
    footerText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
    },
    footerLink: {
        color: "#FE6700",
    },
});
