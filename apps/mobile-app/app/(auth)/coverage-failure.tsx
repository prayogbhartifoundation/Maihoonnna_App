import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CoverageFailureScreen() {
    const [contactInfo, setContactInfo] = useState("");
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Service Status</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        {/* Illustration Mock */}
                        <View style={styles.illustrationContainer}>
                            <View style={styles.mockIllustration}>
                                <Ionicons name="close-circle-outline" size={48} color="#EF4444" />
                            </View>
                        </View>

                        <Text style={styles.title}>We're not there yet</Text>
                        <Text style={styles.subtitle}>
                            We haven't reached your area (PIN: 700084)
                            yet, but we are expanding fast!
                        </Text>

                        <Text style={styles.instruction}>
                            Leave your details and we'll let you know as
                            soon as we launch.
                        </Text>

                        <Text style={styles.label}>Email or Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email or phone"
                                placeholderTextColor="#9CA3AF"
                                value={contactInfo}
                                onChangeText={setContactInfo}
                            />
                            <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={styles.inputIcon} />
                        </View>

                        <TouchableOpacity style={styles.notifyButton}>
                            <Text style={styles.notifyButtonText}>Notify Me</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="location-outline" size={20} color="#F97316" style={styles.btnIcon} />
                            <Text style={styles.retryButtonText}>Try Another Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.terms}>
                        By continuing, you agree to our{"\n"}
                        <Text style={styles.orangeText}>Terms of Service</Text> and{" "}
                        <Text style={styles.orangeText}>Privacy Policy</Text>
                    </Text>
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
        paddingTop: 20,
        paddingBottom: 20,
        justifyContent: "space-between",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        flex: 1,
    },
    card: {
        backgroundColor: "#FFF5ED",
        padding: 24,
        borderRadius: 16,
        paddingTop: 32,
    },
    illustrationContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    mockIllustration: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: "#FEE2E2",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#4B5563",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 16,
        paddingHorizontal: 10,
    },
    instruction: {
        fontSize: 14,
        color: "#111827",
        textAlign: "center",
        fontWeight: "500",
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    label: {
        fontSize: 13,
        color: "#4B5563",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 24,
    },
    input: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#111827",
    },
    inputIcon: {
        marginRight: 16,
    },
    notifyButton: {
        backgroundColor: "#F97316",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 16,
    },
    notifyButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#F97316",
        backgroundColor: "#FFF",
    },
    btnIcon: {
        marginRight: 8,
    },
    retryButtonText: {
        color: "#F97316",
        fontWeight: "600",
        fontSize: 16,
    },
    footer: {
        alignItems: "center",
    },
    terms: {
        textAlign: "center",
        fontSize: 12,
        lineHeight: 18,
        color: "#9CA3AF",
    },
    orangeText: {
        color: "#F97316",
        fontWeight: "500",
    },
});
