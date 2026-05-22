/**
 * useLocationPermission — Reusable hook
 *
 * Requests foreground location permission and optionally fetches the user's
 * current coordinates as soon as the hook mounts.
 *
 * Usage:
 *   const { status, location, requestPermission } = useLocationPermission();
 *
 * status: 'checking' | 'granted' | 'denied' | 'blocked'
 * location: { latitude, longitude } | null
 */

import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'checking' | 'granted' | 'denied' | 'blocked';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseLocationPermissionOptions {
  /** If true (default), requests permission immediately on mount */
  requestOnMount?: boolean;
  /** If true (default), fetches GPS coords after permission is granted */
  fetchLocationOnGrant?: boolean;
}

export const useLocationPermission = (options: UseLocationPermissionOptions = {}) => {
  const { requestOnMount = true, fetchLocationOnGrant = true } = options;

  const [status, setStatus] = useState<LocationPermissionStatus>('checking');
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (requestOnMount) {
      requestPermission();
    }
  }, []);

  const requestPermission = async () => {
    setStatus('checking');
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();

      if (permStatus === 'granted') {
        setStatus('granted');
        if (fetchLocationOnGrant) {
          await fetchCurrentLocation();
        }
      } else {
        const { canAskAgain } = await Location.getForegroundPermissionsAsync();
        setStatus(canAskAgain ? 'denied' : 'blocked');
      }
    } catch {
      setStatus('denied');
    }
  };

  const fetchCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // GPS failed silently — user can still pick on map
    } finally {
      setIsLocating(false);
    }
  };

  return {
    status,
    location,
    isLocating,
    requestPermission,
    fetchCurrentLocation,
  };
};
