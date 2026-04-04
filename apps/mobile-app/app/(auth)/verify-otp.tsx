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
    ActivityIndicator
} from "react-native";
import { useState, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Update this if you run on a physical device to your computer's local IP (e.g., http://192.168.1.5:3000/api)
import { API_URL } from '@/constants/api';

export default function VerifyOtpScreen() {
    const router = useRouter();
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
        // TEMPORARILY BYPASSED FOR TESTING
        // const enteredOtp = otp.join("");
        // if (enteredOtp.length !== 6) {
        //   Alert.alert("Invalid OTP", "Please fill in all 6 digits.");
        //   return;
        // }

        // if (!phone) {
        //   Alert.alert("Error", "Phone number is missing. Go back and try logging in again.");
        //   return;
        // }

        setIsLoading(true);

        try {
            // 1. Call your real backend to verify the code
            // const response = await fetch(`${API_URL}/auth/verify-otp`, {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            //   body: JSON.stringify({ phone, otp: enteredOtp }), // Pass phone & otp
            // });

            // const data = await response.json();

            // if (data.success) {
            // 2. Authentication Succeeded! Proceed to next Location Screen
            // In a real app, you would also securely store `data.token` here so the user stays logged in
            //
            // // NEW LOGIC FOR BENEFICIARY LOGIN:
            // if (data.user.role === 'beneficiary') {
            //    router.replace('/(beneficiary)');
            // } else {
            //    router.push("/(setup)/subscription-packages");
            // }

            // TEMPORARY BYPASS (Assuming subscriber for now until backend testing is active)
            router.replace("/(subscriber)");

            // } else {
            //   // 3. Failed validation (Wrong OTP, Expired, etc)
            //   Alert.alert("Verification Failed", data.message || "Invalid OTP entered.");
            //   // Clear all OTP input fields so they can try again quickly
            //   setOtp(["", "", "", "", "", ""]);
            //   inputRefs.current[0]?.focus();
            // }
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
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    {/* OTP Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Verification code</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit verification code{"\n"}to{" "}
                            <Text style={styles.phoneText}>{phone || "your device"}</Text>
                        </Text>

                        {/* OTP Inputs */}
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

                        <TouchableOpacity style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]} onPress={handleVerify} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.resendText}>Didn't receive code?</Text>
                    <View style={styles.resendRow}>
                        {/* You could wire this up to call API_URL/auth/send-otp again in the future */}
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={styles.requestAgain}>Request again</Text>
                        </TouchableOpacity>
                        <Text style={styles.timer}> in 00:30</Text>
                    </View>
                </View>
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
        paddingHorizontal: 24,
        justifyContent: "space-between",
        paddingTop: 10,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#FFF5ED",
        padding: 24,
        borderRadius: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 20,
        marginBottom: 32,
    },
    phoneText: {
        color: "#111827",
        fontWeight: "600",
    },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 32,
    },
    otpInput: {
        width: 45,
        height: 55,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        textAlign: "center",
        fontSize: 24,
        fontWeight: "600",
        color: "#111827",
    },
    otpInputFilled: {
        borderColor: "#F97316",
        backgroundColor: "#FFF5ED",
    },
    verifyButton: {
        backgroundColor: "#F97316",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        height: 50,
        justifyContent: "center"
    },
    verifyButtonDisabled: {
        backgroundColor: "#FDBA8C",
    },
    verifyButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
    footer: {
        alignItems: "center",
    },
    resendText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 4,
    },
    resendRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    requestAgain: {
        color: "#111827",
        fontWeight: "600",
        fontSize: 14,
    },
    timer: {
        color: "#9CA3AF",
        fontSize: 14,
    },
});
