import React, { useState } from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AddressPicker, SelectedAddress } from './AddressPicker';

export interface LocationDetails {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  flatPlot?: string;
  streetArea?: string;
}

interface AddressInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onLocationFetched: (details: Partial<LocationDetails>) => void;
  label?: string;
  placeholder?: string;
}

export const AddressInputField: React.FC<AddressInputFieldProps> = ({
  value,
  onChangeText,
  onLocationFetched,
  label = 'Address',
  placeholder = 'Enter your complete address',
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleAddressSelected = (selected: SelectedAddress) => {
    setShowPicker(false);
    onChangeText(selected.address);
    onLocationFetched({
      latitude: selected.latitude,
      longitude: selected.longitude,
      address: selected.address,
      city: selected.city,
      state: selected.state,
      pincode: selected.pincode,
      flatPlot: selected.flatPlot,
      streetArea: selected.streetArea,
    });
  };

  // ── WEB: render a plain text input (no GPS/Maps modal) ──────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.inputGroup}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TextInput
          style={styles.webInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
        />
      </View>
    );
  }

  // ── NATIVE: GPS button + full-screen AddressPicker modal ────────────────────
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={styles.detectBtn}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
      >
        <View style={styles.detectBtnIcon}>
          <Ionicons name="location" size={24} color="#F97316" />
        </View>
        <View style={styles.detectBtnTextContainer}>
          <Text style={styles.detectBtnTitle}>Pick accurate location</Text>
          <Text style={styles.detectBtnSubtitle} numberOfLines={2}>
            {value ? value : 'Tap to fetch GPS coordinates & auto-fill'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide" transparent={false}>
        <AddressPicker
          onAddressSelected={handleAddressSelected}
          onCancel={() => setShowPicker(false)}
          title="Set Accurate Location"
          subtitle="Move the pin to your exact location"
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },

  // Web plain input
  webInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 44,
  },

  // Native GPS button
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5ED',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 12,
    padding: 16,
  },
  detectBtnIcon: {
    marginRight: 12,
    backgroundColor: '#FFE1CC',
    padding: 8,
    borderRadius: 20,
  },
  detectBtnTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  detectBtnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 4,
  },
  detectBtnSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
