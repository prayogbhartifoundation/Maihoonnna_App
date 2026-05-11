import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkLoginState() {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          setIsLoggedIn(true);
          const userDataStr = await AsyncStorage.getItem("userData");
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            setRole(userData.role);
          }
        }
      } catch (err) {
        console.error("Error loading auth state:", err);
      } finally {
        setIsReady(true);
      }
    }
    checkLoginState();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)" />;
  }

  // Dynamic role-based redirection on startup
  if (role === "care_companion") {
    return <Redirect href="/(care-companion)" />;
  } else if (role === "beneficiary") {
    return <Redirect href="/(beneficiary)" />;
  } else {
    return <Redirect href="/(subscriber)" />;
  }
}
