import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { logoutWithConfirm } from '../../utils/logout';

export default function DashboardPreviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse the user object returned directly from the PostgreSQL Database!
    const user = params.user ? JSON.parse(params.user as string) : null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                <View style={styles.iconCircle}>
                    <Ionicons name="checkmark-done" size={60} color="#FFFFFF" />
                </View>

                <Text style={styles.title}>Backend Connection Successful!</Text>
                <Text style={styles.subtitle}>
                    This data was securely fetched from your PostgreSQL database using the provided credentials.
                </Text>

                {user ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Live Database Record:</Text>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Role:</Text>
                            <Text style={styles.dataValue}>{user.role}</Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Name:</Text>
                            <Text style={styles.dataValue}>{user.name}</Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Age:</Text>
                            <Text style={styles.dataValue}>{user.age}</Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>Phone:</Text>
                            <Text style={styles.dataValue}>{user.phone}</Text>
                        </View>

                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>DB User ID:</Text>
                            <Text style={styles.dataValueId} numberOfLines={1} ellipsizeMode="tail">
                                {user.id}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={{ color: "#EF4444", textAlign: "center", marginBottom: 32 }}>No user data found.</Text>
                )}

                {/* Option to proceed forward to test the Subscriptions view or sign out */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push("/(setup)/subscription-packages")}
                >
                    <Text style={styles.primaryButtonText}>Continue to Subscriptions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={logoutWithConfirm}
                >
                    <Text style={styles.secondaryButtonText}>Log Out</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FFF5ED" },
    container: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#22C55E",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        shadowColor: "#22C55E",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    title: { fontSize: 24, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 12 },
    subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 32 },
    card: {
        backgroundColor: "#FFFFFF",
        width: "100%",
        padding: 24,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 32,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: "#F97316", marginBottom: 16 },
    dataRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    dataLabel: { fontSize: 14, color: "#6B7280", fontWeight: "500", flex: 1 },
    dataValue: { fontSize: 14, color: "#111827", fontWeight: "600", flex: 2, textAlign: "right" },
    dataValueId: { fontSize: 12, color: "#9CA3AF", fontWeight: "400", flex: 2, textAlign: "right", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
    primaryButton: {
        backgroundColor: "#F97316",
        width: "100%",
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 16,
    },
    primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
    secondaryButton: { paddingVertical: 12 },
    secondaryButtonText: { color: "#6B7280", fontWeight: "500", fontSize: 15 },
});
