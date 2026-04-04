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

export default function LocationScreen() {
    const [location, setLocation] = useState("");
    const router = useRouter();

    const handleCheckAvailability = () => {
        // Basic mock: if location ends with '0', we "fail"
        if (location.endsWith("0")) {
            router.push("/(auth)/coverage-failure");
        } else {
            router.push("/(auth)/coverage-success");
        }
    };

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
                    <Text style={styles.headerTitle}>Location</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    {/* Illustration Container (Mock for Image) */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.mockImage}>
                            <Ionicons name="location" size={48} color="#F97316" />
                        </View>
                    </View>

                    {/* Location Card */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Where are you located?</Text>
                        <Text style={styles.subtitle}>
                            Enter your PIN code or address to see if our experts are available in your area.
                        </Text>

                        <Text style={styles.label}>Location Details</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter PIN code or Address"
                                placeholderTextColor="#9CA3AF"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>

                        <TouchableOpacity style={styles.detectButton}>
                            <Ionicons name="location-outline" size={20} color="#F97316" style={styles.btnIcon} />
                            <Text style={styles.detectButtonText}>Detect current location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkButton}
                            onPress={handleCheckAvailability}
                        >
                            <Text style={styles.checkButtonText}>Check Availability</Text>
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
        marginBottom: 40,
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
    illustrationContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 40,
    },
    mockImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFF5ED",
        alignItems: "center",
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#FFF5ED",
        padding: 24,
        borderRadius: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#4B5563",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
    },
    label: {
        fontSize: 13,
        color: "#4B5563",
        marginBottom: 8,
    },
    inputContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 24,
    },
    input: {
        height: 48,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#111827",
    },
    detectButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#F97316",
        backgroundColor: "#FFF",
        marginBottom: 16,
    },
    btnIcon: {
        marginRight: 8,
    },
    detectButtonText: {
        color: "#F97316",
        fontWeight: "600",
        fontSize: 16,
    },
    checkButton: {
        backgroundColor: "#FBA56B", // Slightly lighter orange for disabled feel, change to #F97316 when valid
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    checkButtonText: {
        color: "#FFFFFF",
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
