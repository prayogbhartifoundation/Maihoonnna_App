/**
 * Mobile App — Push Notification Service
 *
 * Responsibilities:
 *  1. Request notification permissions from the OS
 *  2. Get the Expo Push Token
 *  3. Store the token on our backend (linked to the logged-in user)
 *  4. Configure how notifications appear when app is in foreground
 *
 * Usage:
 *   import { registerForPushNotifications } from '@/services/notifications';
 *   await registerForPushNotifications();
 *
 * Web: all push logic is safely skipped — no errors thrown.
 */

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Device from 'expo-device';
import { API_URL } from '@/constants/api';

// ─── Backend API Base ─────────────────────────────────────────────────────────
const API_BASE = API_URL;

// ─── Foreground notification handler ─────────────────────────────────────────
// Note: setNotificationHandler was removed in expo-notifications SDK 55.
// Foreground display is now controlled via the config plugin (app.json)
// and the addNotificationReceivedListener pattern.
// Nothing needed here at module level.

/**
 * Register for push notifications and store the Expo push token on the backend.
 * Safe to call multiple times — skips on web and simulator.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo push tokens are native-only; skip silently on web
  if (Platform.OS === 'web') {
    console.log('[Notifications] Skipping push registration on web.');
    return null;
  }

  // Push tokens require a physical device
  if (!Device.isDevice) {
    console.log('[Notifications] Skipping push registration on simulator.');
    return null;
  }

  try {
    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Push permission not granted.');
      return null;
    }

    // Android: create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MaiHoonNa',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF7A00',
      });
    }

    // Get Expo Push Token
    const projectId: string | undefined =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      console.warn('[Notifications] No EAS projectId found in app config.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data;

    console.log('[Notifications] Expo Push Token:', expoPushToken);

    // Persist locally
    await AsyncStorage.setItem('expo_push_token', expoPushToken);

    // Sync to backend
    await syncTokenToBackend(expoPushToken);

    return expoPushToken;
  } catch (err: any) {
    console.error('[Notifications] Registration error:', err.message ?? err);
    return null;
  }
}

/**
 * POST the Expo push token to the backend so the server can send pushes.
 * Stores it in User.fcmToken on the backend.
 */
async function syncTokenToBackend(token: string): Promise<void> {
  try {
    const savedAuth = await AsyncStorage.getItem('userToken');
    if (!savedAuth) return;

    let authToken: string | undefined = savedAuth;

    const res = await fetch(`${API_BASE}/shared/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      console.warn('[Notifications] Failed to sync push token:', res.status);
    } else {
      console.log('[Notifications] Push token synced to backend.');
    }
  } catch (err: any) {
    console.warn('[Notifications] syncTokenToBackend error:', err.message ?? err);
  }
}

/**
 * Listen for notifications received while app is in foreground.
 * Returns a subscription — call .remove() to clean up.
 */
export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Listen for when the user taps a notification.
 * Returns a subscription — call .remove() to clean up.
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Dismiss all notifications from the tray and reset badge count.
 */
export async function clearAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}
