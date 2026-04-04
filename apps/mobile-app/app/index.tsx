import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkLoginState() {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        setIsLoggedIn(true);
      }
      setIsReady(true);
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

  // If logged in, go straight to their specific Dashboard! Otherwise, go to Login.
  return isLoggedIn ? <Redirect href="/(subscriber)" /> : <Redirect href="/(auth)" />;
}
