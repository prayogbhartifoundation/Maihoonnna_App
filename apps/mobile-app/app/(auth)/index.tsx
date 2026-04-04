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
import { useState } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Update this if you run on a physical device to your computer's local IP (e.g., http://192.168.1.5:3000/api)
import { API_URL } from '@/constants/api';

export default function AuthScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    // 1. Basic UI Validation
    if (phone.length !== 10) {
      Alert.alert("Invalid input", "Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Call the Real Backend API to trigger the Twilio/Dev OTP
      // Make sure your backend (npm run dev) is running on port 3000
      // const response = await fetch(`${API_URL}/auth/send-otp`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ phone: `+91${phone}` }), // Add country code
      // });

      // const data = await response.json();

      // if (data.success) {
      // 3. Navigate ONLY if the backend confirms OTP was sent
      // We pass the phone number forward so the verify screen knows what to verify against
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phone: `+91${phone}` },
      });
      // } else {
      //   Alert.alert("Error", data.message || "Failed to send OTP.");
      // }
    } catch (error) {
      console.error("Login API Error:", error);
      Alert.alert("Network Error", "Could not connect to the backend server. Is it running?");
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
        {/* Header & Location */}
        <View style={styles.header}>
          <View style={styles.locationBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.locationText}>Location Services: Active</Text>
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <Text style={styles.logoText}>MaiHoonNa</Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Login with Phone</Text>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCode}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit number"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.otpButton, isLoading && styles.otpButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.otpButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.line} />
        </View>

        {/* Biometric Button - Position Updated */}
        <TouchableOpacity style={styles.bioButton} disabled={isLoading}>
          <MaterialCommunityIcons name="fingerprint" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.bioButtonText}>Biometric Login</Text>
        </TouchableOpacity>

        {/* Password Login Button */}
        <TouchableOpacity style={styles.passwordButton} onPress={() => router.push("/(auth)/login-password" as any)} disabled={isLoading}>
          <MaterialCommunityIcons name="lock-outline" size={22} color="#111827" style={{ marginRight: 8 }} />
          <Text style={styles.passwordButtonText}>Login with Password</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>

          <View style={styles.signUpRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.orangeTextBold}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.browseButton} onPress={() => router.push("/(setup)/subscription-packages")}>
            <MaterialCommunityIcons name="package-variant-closed" size={22} color="#F97316" style={{ marginRight: 8 }} />
            <Text style={styles.browseButtonText}>Browse Packages</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={styles.orangeTextTerms}>Terms of Service</Text>{"\n"}
            and <Text style={styles.orangeTextTerms}>Privacy Policy</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between", paddingTop: 40, paddingBottom: 25 },
  header: { alignItems: "center" },
  locationBadge: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E", marginRight: 8 },
  locationText: { fontSize: 13, color: "#4B5563" },
  logoContainer: { flexDirection: "row", alignItems: "center", marginBottom: 35 },
  logoCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: "#F97316", alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoLetter: { color: "#FFFFFF", fontWeight: "bold", fontSize: 20 },
  logoText: { fontSize: 32, fontWeight: "800", color: "#111827" },

  card: { backgroundColor: "#FFF5ED", padding: 24, borderRadius: 20, width: "100%", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 24, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "500", color: "#111827", marginBottom: 10 },

  inputRow: { flexDirection: "row", marginBottom: 20 },
  countryCodeContainer: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 15, justifyContent: "center", marginRight: 10 },
  countryCode: { fontSize: 16, fontWeight: "600", color: "#111827" },
  input: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", paddingHorizontal: 15, fontSize: 16, height: 55, color: "#111827" },

  otpButton: { backgroundColor: "#F3B289", height: 55, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  otpButtonDisabled: { opacity: 0.7 },
  otpButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 17 },

  dividerRow: { flexDirection: "row", alignItems: "center", width: "100%", marginTop: 24, marginBottom: 10 }, // Bottom margin kam kiya
  line: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 15, fontSize: 14, color: "#6B7280" },

  bioButton: {
    backgroundColor: "#000000",
    flexDirection: "row",
    height: 55,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 0,
    marginBottom: 15
  },
  bioButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },

  passwordButton: {
    flexDirection: "row",
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 35
  },
  passwordButtonText: { color: "#111827", fontWeight: "600", fontSize: 16 },

  footer: { alignItems: "center" },
  signUpRow: { flexDirection: "row", marginBottom: 12 },
  footerText: { color: "#6B7280", fontSize: 15 },
  orangeTextBold: { color: "#F97316", fontWeight: "700", fontSize: 15 },

  browseButton: { flexDirection: "row", borderWidth: 1, borderColor: "#F97316", borderRadius: 12, height: 55, alignItems: "center", justifyContent: "center", width: "100%", marginBottom: 20 },
  browseButtonText: { color: "#F97316", fontWeight: "700", fontSize: 16 },

  terms: { textAlign: "center", fontSize: 13, lineHeight: 20, color: "#4B5563" },
  orangeTextTerms: { color: "#F97316", fontWeight: "500" }
});
