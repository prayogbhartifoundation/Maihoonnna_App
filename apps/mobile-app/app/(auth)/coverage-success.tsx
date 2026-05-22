import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CoverageSuccessScreen() {
    const router = useRouter();

    const handleProceed = () => {
        // Navigate to the Subscription Setup flow instead of tabs immediately
        router.replace("/(setup)/subscription-packages");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verification Successful</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Great news!</Text>
                    <Text style={styles.subtitle}>
                        We serve your area. You can now enjoy our full range of services.
                    </Text>

                    {/* Location Badge styling within the card */}
                    <View style={styles.badgeContainer}>
                        <View style={styles.locationBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.locationText}>
                                Service Coverage{"\n"}Active in 110001
                            </Text>
                        </View>
                    </View>

                    {/* Dummy Map Illustration */}
                    <View style={styles.mapMock}>
                        <Ionicons name="map-outline" size={64} color="#E5E7EB" />
                        <View style={styles.mapPin}>
                            <Ionicons name="location" size={32} color="#3B82F6" />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
                        <Text style={styles.proceedButtonText}>Proceed to Dashboard</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.terms}>
                        By continuing, you agree to our{"\n"}
                        <Text style={styles.orangeText}>Terms of Service</Text> and{" "}
                        <Text style={styles.orangeText}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: 20,
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
    container: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 20,
        justifyContent: "space-between",
    },
    card: {
        backgroundColor: "#FFF5ED",
        padding: 24,
        borderRadius: 16,
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
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
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    badgeContainer: {
        alignItems: "center",
        marginBottom: 24,
    },
    locationBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    greenDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#22C55E",
        marginRight: 10,
    },
    locationText: {
        color: "#22C55E",
        fontSize: 12,
        fontWeight: "500",
        textAlign: "center",
    },
    mapMock: {
        height: 200,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    mapPin: {
        position: "absolute",
        top: "40%",
    },
    proceedButton: {
        backgroundColor: "#F97316",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    proceedButtonText: {
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
