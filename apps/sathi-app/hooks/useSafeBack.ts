import { useNavigationStack } from '../contexts/NavigationStackContext';

/**
 * A custom hook that provides a safe way to go back in navigation.
 * Uses the global NavigationStackContext to track logical history.
 */
export function useSafeBack() {
    const { pop } = useNavigationStack();

    const safeBack = (fallbackRoute: string = '/') => {
        pop(fallbackRoute);
    };

    return safeBack;
}
