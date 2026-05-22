import { apiJson } from './api';

export const locationApi = {
  /**
   * Get Google Maps configuration (API Key)
   */
  async getConfig(): Promise<{ apiKey: string }> {
    return apiJson<{ apiKey: string }>('/location/config');
  },

  /**
   * Geocode an address to lat/lng
   * @param address - Full address string
   */
  async geocode(address: string): Promise<{ latitude: number; longitude: number; formattedAddress: string }> {
    return apiJson<{ latitude: number; longitude: number; formattedAddress: string }>(`/location/geocode?address=${encodeURIComponent(address)}`);
  },

  /**
   * Reverse geocode coordinates to address components
   * @param lat - Latitude
   * @param lng - Longitude
   */
  async reverseGeocode(lat: number, lng: number): Promise<{ fullAddress: string; city: string; state: string; pincode: string }> {
    return apiJson<{ fullAddress: string; city: string; state: string; pincode: string }>(`/location/reverse-geocode?lat=${lat}&lng=${lng}`);
  },
};
