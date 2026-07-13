import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Root entry point — redirects based on auth state from the global context.
 * No AsyncStorage reads here; the AuthProvider already loaded the session.
 */
export default function Index() {
  const { isLoading, isLoggedIn, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  // Role-based redirection to the correct home dashboard
  if (role === "care_companion" || role === "volunteer") {
    return <Redirect href="/(care-companion)" />;
  } else if (role === "beneficiary") {
    return <Redirect href="/(beneficiary)" />;
  } else if (role === "prospect") {
    return <Redirect href="/(setup)/subscription-packages" />;
  } else {
    // Default: subscriber dashboard
    return <Redirect href="/(subscriber)" />;
  }
}
