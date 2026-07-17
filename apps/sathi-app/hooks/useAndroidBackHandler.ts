import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigationStack } from '../contexts/NavigationStackContext';

/**
 * Custom hook to intercept Android hardware back button and integrate it with our global NavigationStack.
 * @param fallback Route to go to if stack is empty and expo router can't go back.
 */
export function useAndroidBackHandler(fallback?: string) {
    const { pop, canGoBack } = useNavigationStack();
    const router = useRouter();

    useEffect(() => {
        if (Platform.OS !== 'android') return;

        const onBackPress = () => {
            // 1. Try popping from our explicit logical stack
            if (canGoBack()) {
                pop(fallback);
                return true; // Prevent default OS back
            }

            // 2. If stack is empty but Expo Router has history, let Expo Router handle it
            if (router.canGoBack()) {
                router.back();
                return true;
            }

            // 3. Use explicit fallback if provided
            if (fallback) {
                router.replace(fallback as any);
                return true;
            }

            // 4. Default OS behavior (which may close the app or trigger `useExitOnBack` elsewhere)
            return false; 
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        return () => subscription.remove();
    }, [canGoBack, pop, router, fallback]);
}
