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
import { LinearGradient } from "expo-linear-gradient";
// API source of truth from central constants
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
      // 2. Call the Real Backend API to trigger the Twilio/Dev/MSG91 OTP
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `91${phone}` }),
      });

      const data = await response.json();

      if (data.success) {
        // 3. Navigate ONLY if the backend confirms OTP was sent
        // We pass the phone number forward so the verify screen knows what to verify against
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { phone: `+91${phone}` },
        });
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP.");
      }
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
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>म</Text>
          </View>
          <Text style={styles.logoText}>
            Mai<Text style={styles.logoOrange}>Hoon</Text>Na
          </Text>
        </View>

        <LinearGradient
          colors={["#FFFFFF", "#FFE2CC"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.card}
        >
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
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.otpButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.bioButton} disabled={isLoading} activeOpacity={0.85}>
          <MaterialCommunityIcons name="fingerprint" size={20} color="#FFFFFF" />
          <Text style={styles.bioButtonText}>Biometric Login</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.signUpRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.orangeTextBold}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(setup)/subscription-packages")}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={24}
              color="#FE6700"
            />
            <Text style={styles.browseButtonText}>Browse Packages</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.orangeTextTerms}>Terms of Service</Text>
            {"\n"}and <Text style={styles.orangeTextTerms}>Privacy Policy</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 78 : 88,
    paddingBottom: 34,
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 42,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FE6700",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoLetter: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 32,
    fontFamily: "Poppins-SemiBold",
  },
  logoText: {
    fontSize: 28,
    lineHeight: 36,
    color: "#000000",
    fontFamily: "Poppins-SemiBold",
  },
  logoOrange: {
    color: "#FE6700",
  },
  card: {
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 47,
    paddingTop: 38,
    paddingBottom: 50,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    marginBottom: 31,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: "#000000",
    fontFamily: "Poppins-Regular",
    marginBottom: 9,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  countryCodeContainer: {
    width: 64,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  countryCode: {
    fontSize: 14,
    lineHeight: 20,
    color: "#000000",
    fontFamily: "Poppins-Regular",
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  otpButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFA366",
    justifyContent: "center",
    alignItems: "center",
  },
  otpButtonDisabled: {
    opacity: 0.75,
  },
  otpButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 48,
    marginBottom: 48,
    paddingHorizontal: 9,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  dividerText: {
    marginHorizontal: 32,
    fontSize: 14,
    lineHeight: 20,
    color: "#000000",
    fontFamily: "Poppins-Regular",
  },
  bioButton: {
    width: 298,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bioButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: 52,
  },
  signUpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  footerText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#6B6B6B",
    fontFamily: "Poppins-Regular",
  },
  orangeTextBold: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FE6700",
    fontFamily: "Poppins-Medium",
  },
  browseButton: {
    width: 268,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FE6700",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  browseButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#FE6700",
    fontFamily: "Poppins-Medium",
  },
  terms: {
    fontSize: 14,
    lineHeight: 20,
    color: "#000000",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  orangeTextTerms: {
    color: "#FE6700",
  },
});
