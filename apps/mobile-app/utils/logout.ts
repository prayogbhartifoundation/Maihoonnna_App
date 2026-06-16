/**
 * Logout utilities.
 *
 * PRIMARY WAY (recommended for all components):
 *   const { logout } = useAuth();
 *   await logout();
 *
 * WITH CONFIRM DIALOG — use the useLogoutWithConfirm hook:
 *   const logoutWithConfirm = useLogoutWithConfirm();
 *   <TouchableOpacity onPress={logoutWithConfirm} />
 *
 * LEGACY (kept for compatibility): logoutWithConfirm(logoutFn)
 */

import { Alert, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import { router } from 'expo-router';

/**
 * Hook that returns a confirm-then-logout function, ready to be used as onPress.
 *
 * Example:
 *   const logoutWithConfirm = useLogoutWithConfirm();
 *   <TouchableOpacity onPress={logoutWithConfirm} />
 */
export function useLogoutWithConfirm(): () => void {
    const { logout } = useAuth();

    return useCallback(() => {
        const performLogout = async () => {
            await logout();
            router.replace('/(auth)');
        };

        if (Platform.OS === 'web') {
            // eslint-disable-next-line no-alert
            if (window.confirm('Are you sure you want to log out?')) {
                performLogout();
            }
        } else {
            Alert.alert(
                'Log Out',
                'Are you sure you want to log out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', style: 'destructive', onPress: performLogout },
                ],
                { cancelable: true }
            );
        }
    }, [logout]);
}

/**
 * @deprecated Use `useLogoutWithConfirm()` hook instead.
 * Shows an "Are you sure?" dialog before calling the provided logout function.
 */
export const logoutWithConfirm = (logoutFn: () => Promise<void>): void => {
    const performLogout = async () => {
        await logoutFn();
        router.replace('/(auth)');
    };

    if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to log out?')) {
            performLogout();
        }
    } else {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: performLogout },
            ],
            { cancelable: true }
        );
    }
};
