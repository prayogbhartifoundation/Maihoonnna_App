import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";

// API source of truth from central constants
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOtpScreen() {
    const router = useRouter();
    const { login } = useAuth();
    // Retrieve the phone number passed from the previous screen
    const { phone } = useLocalSearchParams<{ phone: string }>();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            Alert.alert("Invalid OTP", "Please fill in all 6 digits.");
            return;
        }

        if (!phone) {
            Alert.alert("Error", "Phone number is missing. Go back and try logging in again.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Call your real backend to verify the code
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone, otp: enteredOtp }),
            });

            const data = await response.json();

            if (data.success) {
                // The actual payload is inside the 'data' property of ApiResponse
                const result = data.data;

                if (result.isNewUser) {
                    // Navigate to registration if user profile doesn't exist yet
                    router.push({ pathname: "/(auth)/register", params: { phone } });
                } else if (result.user) {
                    // PERSIST SESSION via AuthContext
                    await login(result.token, result.user);
                    
                    // Route explicitly to the correct dashboard to avoid layout flicker
                    const role = result.user.role;
                    if (role === "care_companion" || role === "volunteer") {
                        router.replace("/(care-companion)");
                    } else if (role === "beneficiary") {
                        router.replace("/(beneficiary)");
                    } else {
                        router.replace("/(subscriber)");
                    }
                }
            } else {
                // Failed validation (Wrong OTP, Expired, etc)
                Alert.alert("Verification Failed", data.message || "Invalid OTP entered.");
                // Clear all OTP input fields so they can try again quickly
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            Alert.alert("Network Error", "Could not connect to the backend server.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(auth)');
                            }
                        }} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={22} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Verify Phone</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroTextWrap}>
                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>
                        <Text style={styles.maskedPhone}>
                            {phone ? `${phone.slice(0, 3)} ••• ••• ${phone.slice(-4)}` : "+1 ••• ••• 1234"}
                        </Text>
                    </View>

                    <LinearGradient
                        colors={["#FFFFFF", "#FFE2CC"]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.card}
                    >
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }}
                                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    editable={!isLoading}
                                />
                            ))}
                        </View>

                        <Text style={styles.resendTimer}>Resend code in 00:55</Text>

                        <TouchableOpacity onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(auth)');
                            }
                        }} disabled={isLoading}>
                            <Text style={styles.resendLink}>Resend OTP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
                            onPress={handleVerify}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                <Text style={styles.terms}>
                    By continuing, you agree to our{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {"\n"}and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 18 : 28,
        paddingBottom: 34,
        justifyContent: "space-between",
    },
    header: {
        height: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: {
        width: 40,
        height: 32,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    headerTitle: {
        fontSize: 16,
        lineHeight: 24,
        color: "#000000",
        fontFamily: "Poppins-Regular",
    },
    headerSpacer: {
        width: 40,
        height: 32,
    },
    heroTextWrap: {
        alignItems: "center",
        marginTop: 126,
        marginBottom: 26,
    },
    title: {
        fontSize: 24,
        lineHeight: 32,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-SemiBold",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
        marginBottom: 10,
    },
    maskedPhone: {
        fontSize: 16,
        lineHeight: 24,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
    },
    card: {
        width: "100%",
        borderRadius: 10,
        paddingHorizontal: 36,
        paddingTop: 32,
        paddingBottom: 43,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginBottom: 38,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        backgroundColor: "#FFFFFF",
        textAlign: "center",
        fontSize: 20,
        lineHeight: 28,
        color: "#000000",
        fontFamily: "Poppins-SemiBold",
    },
    otpInputFilled: {
        borderColor: "#FE6700",
    },
    resendTimer: {
        fontSize: 16,
        lineHeight: 24,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
        marginBottom: 14,
    },
    resendLink: {
        fontSize: 16,
        lineHeight: 24,
        color: "#FE6700",
        textAlign: "center",
        fontFamily: "Poppins-Medium",
        marginBottom: 38,
    },
    verifyButton: {
        width: 282,
        height: 50,
        borderRadius: 8,
        backgroundColor: "#FE6700",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
    },
    verifyButtonDisabled: {
        opacity: 0.75,
    },
    verifyButtonText: {
        fontSize: 16,
        lineHeight: 24,
        color: "#FFFFFF",
        fontFamily: "Poppins-SemiBold",
    },
    terms: {
        fontSize: 14,
        lineHeight: 20,
        color: "#000000",
        textAlign: "center",
        fontFamily: "Poppins-Regular",
    },
    termsLink: {
        color: "#FE6700",
    },
});
