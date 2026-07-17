import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';

/**
 * Hook to handle Android hardware back button on root dashboard screens.
 * Pressing back once shows a toast message.
 * Pressing back again within 2 seconds exits the app.
 */
export function useExitOnBack() {
  const exitToastShownRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (exitToastShownRef.current) {
        // Exits the app
        BackHandler.exitApp();
        return true;
      }

      exitToastShownRef.current = true;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

      // Reset the flag after 2 seconds
      setTimeout(() => {
        exitToastShownRef.current = false;
      }, 2000);

      return true; // Prevents default back navigation
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backHandler.remove();
  }, []);
}
