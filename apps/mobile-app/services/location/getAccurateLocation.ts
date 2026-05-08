import { getCurrentLocation } from './getCurrentLocation';
import { reverseGeocode, ReverseGeocodeResult } from './reverseGeocode';

export interface AccurateLocation extends ReverseGeocodeResult {
  latitude: number;
  longitude: number;
}

export const getAccurateLocation = async (): Promise<AccurateLocation> => {
  try {
    // Step 1: Get REAL coordinates from device sensors
    const coords = await getCurrentLocation();

    // Step 2: Call Reverse Geocoding (via backend proxy)
    const addressData = await reverseGeocode(coords.latitude, coords.longitude);

    return {
      ...addressData,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  } catch (error) {
    console.error('[LocationService] getAccurateLocation error:', error);
    throw error;
  }
};
