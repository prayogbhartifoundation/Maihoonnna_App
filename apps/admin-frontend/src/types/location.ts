export interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, addressDetails?: {
    fullAddress: string;
    city: string;
    state: string;
    pincode: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}
