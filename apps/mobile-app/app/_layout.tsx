import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import type { Subscription } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // Keep cache for 24 hours
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

import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '@/services/notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const notifListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);
  // --- ADDED: Font loading hook ---
  const [fontsLoaded, error] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'), // Added for modal headers
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications();

    // Handle notification received while app is open (foreground)
    notifListener.current = addNotificationReceivedListener(notification => {
      console.log('[App] Notification received:', notification.request.content.title);
    });

    // Handle notification tap (user opens app from notification)
    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      console.log('[App] Notification tapped, data:', data);
      // TODO: Navigate to relevant screen based on data.type
      // e.g., if data.type === 'cc_assignment' → navigate to profile/visits
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // React Query AppState Listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(subscriber)" />
          <Stack.Screen name="(beneficiary)" />
          <Stack.Screen name="(care-companion)" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
