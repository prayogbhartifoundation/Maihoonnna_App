import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAccurateLocation } from '../../services/location';

export interface LocationDetails {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
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
    label = "Address *",
    placeholder = "Enter your complete address"
}) => {
    const [isLocating, setIsLocating] = useState(false);

    const handleDetectLocation = async () => {
        setIsLocating(true);
        try {
            const locationData = await getAccurateLocation();

            console.log('[Location] Successfully fetched accurate location:', locationData);

            // Fill in the address field (editable by user)
            onChangeText(locationData.address);

            // Pass all fields back to the parent form
            onLocationFetched({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                address: locationData.address,
                city: locationData.city,
                state: locationData.state,
                pincode: locationData.pincode
            });
        } catch (error: any) {
            console.log('[Location] Error:', error);

            if (
                error?.message?.includes('denied') ||
                error?.code === 1
            ) {
                Alert.alert(
                    "Location Blocked",
                    Platform.OS === 'web'
                        ? "Please allow location access in your browser settings and try again."
                        : "Location access was denied. Please enable it in your device settings."
                );
            } else {
                Alert.alert("Location Error", "Could not fetch your location. Please enter it manually.");
            }
        } finally {
            setIsLocating(false);
        }
    };


    return (
        <View style={styles.inputGroup}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <TouchableOpacity
                style={styles.detectBtn}
                onPress={handleDetectLocation}
                disabled={isLocating}
            >
                <View style={styles.detectBtnIcon}>
                    <Ionicons name="location" size={24} color="#F97316" />
                </View>
                <View style={styles.detectBtnTextContainer}>
                    <Text style={styles.detectBtnTitle}>
                        {isLocating ? 'Detecting Location...' : 'Use Current Location'}
                    </Text>
                    <Text style={styles.detectBtnSubtitle} numberOfLines={2}>
                        {value ? value : 'Tap to fetch GPS coordinates & auto-fill'}
                    </Text>
                </View>
                {isLocating ? (
                    <ActivityIndicator size="small" color="#F97316" />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 10 },
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
