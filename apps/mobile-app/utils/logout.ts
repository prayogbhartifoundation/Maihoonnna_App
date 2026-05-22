import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

/**
 * Global logout utility.
 * Clears all session data and redirects to the login screen.
 *
 * Usage:
 *   import { logout } from '@/utils/logout';
 *   await logout();
 *
 * With confirmation dialog:
 *   import { logoutWithConfirm } from '@/utils/logout';
 *   logoutWithConfirm();
 */

export const logout = async (): Promise<void> => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    router.replace('/(auth)');
};

/**
 * Shows an "Are you sure?" dialog before logging out.
 * Uses window.confirm on web (Alert.alert doesn't work on Expo Web).
 */
export const logoutWithConfirm = (): void => {
    if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to log out?')) {
            logout();
        }
    } else {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: logout },
            ],
            { cancelable: true }
        );
    }
};
