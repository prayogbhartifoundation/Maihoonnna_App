import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, Dimensions, Image } from 'react-native';
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 390;
const scale = (size: number) => Math.round((width / BASE_WIDTH) * size);
const vscale = (size: number) => Math.round((height / 844) * size);

export default function AuthScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
    const { push, replace, pop } = useNavigationStack();
    useAndroidBackHandler();
    const { login } = useAuth();

  useEffect(() => {
    const checkAutoBiometric = async () => {
      if (Platform.OS === 'web') return;
      try {
        const secureToken = await SecureStore.getItemAsync('secureUserToken');
        if (secureToken) {
          handleBiometricLogin(true);
        }
      } catch (e) {
        console.warn('SecureStore not available:', e);
      }
    };
    checkAutoBiometric();
  }, []);

  const handleBiometricLogin = async (silent = false) => {
    if (Platform.OS === 'web') return;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        if (!silent) Alert.alert("Not Supported", "Your device does not support biometric authentication.");
        return;
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        if (!silent) Alert.alert("Not Enrolled", "No biometrics enrolled on this device.");
        return;
      }

      const secureToken = await SecureStore.getItemAsync('secureUserToken');
      const secureUser = await SecureStore.getItemAsync('secureUserData');

      if (!secureToken || !secureUser) {
        if (!silent) Alert.alert("Setup Required", "Please login with your phone number or password first to enable biometric login.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login to Mai-Hoonaa",
        fallbackLabel: "Use Passcode",
      });

      if (result.success) {
        await login(secureToken, JSON.parse(secureUser));
      } else {
        console.log("Biometric failed or cancelled");
      }
    } catch (error) {
      console.error("Biometric error:", error);
      if (!silent) Alert.alert("Error", "Biometric login failed. Please try again.");
    }
  };

  const handleLogin = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid input", "Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `91${phone}` }),
      });

      const data = await response.json();

      if (data.success) {
        push({
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
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo_full.png")}
              style={styles.logoFullImage}
            />
          </View>

          {/* Login Card */}
          <LinearGradient
            colors={["#FFFFFF", "#FFE3D1"]}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.line} />
          </View>

          {/* Biometric Login */}
          <TouchableOpacity style={styles.bioButton} disabled={isLoading} activeOpacity={0.85} onPress={() => handleBiometricLogin(false)}>
            <MaterialCommunityIcons name="fingerprint" size={scale(22)} color="#FFFFFF" />
            <Text style={styles.bioButtonText}>Biometric Login</Text>
          </TouchableOpacity>

          {/* Password Login */}
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => push("/(auth)/login-password" as any)}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="lock-outline" size={scale(22)} color="#111827" style={{ marginRight: scale(8) }} />
            <Text style={styles.passwordButtonText}>Login with Password</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signUpRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => push("/(auth)/register")}>
                <Text style={styles.orangeTextBold}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => push("/(setup)/subscription-packages")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="package-variant-closed" size={scale(22)} color="#FF8E4D" />
              <Text style={styles.browseButtonText}>Browse Packages</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.orangeTextTerms}>Terms of Service</Text>
              {"\n"}and <Text style={styles.orangeTextTerms}>Privacy Policy</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingTop: vscale(40),
    paddingBottom: scale(32),
    alignItems: "center",
  },

  /* Logo */
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vscale(32),
  },
  logoFullImage: {
    width: scale(220),
    height: scale(220 / 5.333),
    resizeMode: 'contain',
  },

  /* Card */
  card: {
    width: "100%",
    borderRadius: scale(16),
    paddingHorizontal: scale(28),
    paddingTop: scale(30),
    paddingBottom: scale(36),
    borderWidth: 1,
    borderColor: "#FFE2CC",
    shadowColor: "#FE6700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: scale(22),
    lineHeight: scale(30),
    color: "#000000",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    marginBottom: scale(24),
  },
  label: {
    fontSize: scale(14),
    lineHeight: scale(20),
    color: "#1F2937",
    fontFamily: "Poppins-Medium",
    marginBottom: scale(8),
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: scale(14),
  },
  countryCodeContainer: {
    width: scale(64),
    height: scale(48),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  countryCode: {
    fontSize: scale(15),
    color: "#111827",
    fontFamily: "Poppins-Medium",
  },
  input: {
    flex: 1,
    height: scale(48),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(14),
    fontSize: scale(15),
    color: "#111827",
    fontFamily: "Poppins-Regular",
  },
  otpButton: {
    height: scale(50),
    borderRadius: scale(10),
    backgroundColor: "#FF8E4D",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(8),
    shadowColor: "#FF8E4D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  otpButtonDisabled: {
    backgroundColor: "#FFBFA0",
  },
  otpButtonText: {
    fontSize: scale(16),
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },

  /* Divider */
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: vscale(28),
    marginBottom: vscale(24),
    paddingHorizontal: scale(4),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: scale(16),
    fontSize: scale(14),
    color: "#6B7280",
    fontFamily: "Poppins-Medium",
  },

  /* Buttons */
  bioButton: {
    width: "100%",
    height: scale(50),
    borderRadius: scale(10),
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    marginBottom: scale(14),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bioButtonText: {
    fontSize: scale(16),
    color: "#FFFFFF",
    fontFamily: "Poppins-SemiBold",
  },
  passwordButton: {
    width: "100%",
    height: scale(50),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(20),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  passwordButtonText: {
    fontSize: scale(16),
    color: "#111827",
    fontFamily: "Poppins-SemiBold",
  },

  /* Footer */
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: vscale(24),
  },
  signUpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  footerText: {
    fontSize: scale(15),
    color: "#6B7280",
    fontFamily: "Poppins-Regular",
  },
  orangeTextBold: {
    fontSize: scale(15),
    color: "#FE6700",
    fontFamily: "Poppins-SemiBold",
  },
  browseButton: {
    width: "100%",
    height: scale(50),
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: "#FF8E4D",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(10),
    marginBottom: scale(24),
  },
  browseButtonText: {
    fontSize: scale(16),
    color: "#FF8E4D",
    fontFamily: "Poppins-SemiBold",
  },
  terms: {
    fontSize: scale(12),
    lineHeight: scale(18),
    color: "#9CA3AF",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
  },
  orangeTextTerms: {
    color: "#FF8E4D",
    fontFamily: "Poppins-Medium",
  },
});

