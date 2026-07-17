import { API_URL } from '@/constants/api';

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> => {
  try {
    const response = await fetch(
      `${API_URL}/public/location/reverse-geocode?lat=${lat}&lng=${lng}`
    );
    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch address from coordinates');
    }

    return result.data;
  } catch (error) {
    console.error('[LocationService] reverseGeocode error:', error);
    throw error;
  }
};
