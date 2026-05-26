import { useRouter } from 'expo-router';

/**
 * A custom hook that provides a safe way to go back in navigation.
 * If the navigation stack has history, it goes back.
 * If there is no history (e.g., accessed via deep link or direct page load),
 * it redirects to a fallback route to prevent app crashes.
 */
export function useSafeBack() {
    const router = useRouter();

    const safeBack = (fallbackRoute: string = '/') => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace(fallbackRoute as any);
        }
    };

    return safeBack;
}
