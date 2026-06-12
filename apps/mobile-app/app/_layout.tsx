import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { AppState, Platform, View, ActivityIndicator } from 'react-native';
import type { AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { registerForPushNotifications } from '@/services/notifications';

// Keep splash screen visible while we load fonts + session
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

// ─── Inner navigator — reads auth state to decide which screens exist ─────────

/**
 * KEY FIX: When the user is NOT logged in, only `(auth)` screens exist in
 * the stack — so back gestures cannot reach app screens.
 *
 * When the user IS logged in, only app screens exist — so back gestures
 * cannot reach the login screen. This is exactly how Swiggy/Zomato/Uber work.
 */
function RootNavigator() {
  const { isLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Route protection logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      // If not logged in and trying to access an app screen, redirect to auth
      // Note: we allow (setup) for browsing packages
      if (segments[0] !== '(setup)') {
        router.replace('/(auth)');
      }
    } else if (isLoggedIn) {
      // Register for push notifications when logged in
      registerForPushNotifications();
    }
  }, [isLoggedIn, isLoading, segments]);

  // While we're checking AsyncStorage, show a native splash-compatible loader
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FE6700" />
      </View>
    );
  }

  // ── UNIFIED STACK ──
  // Expo Router strictly recommends against conditionally hiding <Stack.Screen>.
  // Instead, all screens are registered, and we use the effect above + gestureEnabled:false
  // on root dashboards to prevent backing into auth.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(subscriber)" />
      <Stack.Screen name="(beneficiary)" />
      <Stack.Screen name="(care-companion)" />
      <Stack.Screen name="(setup)" />
      <Stack.Screen name="package-utilization" />
    </Stack>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, error] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  // React Query AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Hide splash screen once fonts have loaded
  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
