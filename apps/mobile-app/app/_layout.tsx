import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import type { Subscription } from 'expo-notifications';
import * as Notifications from 'expo-notifications';

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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(subscriber)" />
        <Stack.Screen name="(beneficiary)" />
        <Stack.Screen name="(care-companion)" />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
