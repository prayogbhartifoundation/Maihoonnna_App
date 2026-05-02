// Web fallback — react-native-maps and expo-location are not supported on web.
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface SelectedAddress {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AddressPickerProps {
  onAddressSelected: (address: SelectedAddress) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

export const AddressPicker: React.FC<AddressPickerProps> = ({
  onAddressSelected,
  onCancel,
  title = 'Enter Address',
}) => {
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  const handleConfirm = () => {
    if (!address.trim()) return;
    onAddressSelected({
      latitude: 0,
      longitude: 0,
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Map picker is available on the mobile app. Enter your address below.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Street / Area / Locality"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={2}
          placeholderTextColor="#94A3B8"
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#94A3B8"
          />
          <TextInput
            style={[styles.input, { width: 110 }]}
            placeholder="Pincode"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="numeric"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, !address.trim() && styles.disabledBtn]}
            onPress={handleConfirm}
            disabled={!address.trim()}
          >
            <Text style={styles.confirmText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 480,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  hint: { fontSize: 13, color: '#94A3B8', marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  row: { flexDirection: 'row' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#FDBA74' },
});
