/**
 * AddressPicker — Zomato/Swiggy-style address picker component (Native Only)
 *
 * Flow:
 *  1. Mounts → immediately requests foreground location permission
 *  2. Permission granted → shows full-screen map with FIXED pin + bottom sheet
 *  3. Permission denied → shows permission info screen with option to open settings
 *  4. User can always fall back to manual text entry
 *
 * Props:
 *  - onAddressSelected: called with { latitude, longitude, address } on confirm
 *  - onCancel: called when user dismisses
 *
 * Usage (any screen):
 *  <AddressPicker onAddressSelected={handleAddress} onCancel={() => setShow(false)} />
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';

const { width, height } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedAddress {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  flatPlot?: string;
  streetArea?: string;
}

interface AddressPickerProps {
  onAddressSelected: (address: SelectedAddress) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

type PermissionStatus = 'checking' | 'granted' | 'denied' | 'blocked';

// ─── Component ────────────────────────────────────────────────────────────────

const INDIA_CENTER: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

export const AddressPicker: React.FC<AddressPickerProps> = ({
  onAddressSelected,
  onCancel,
  title = 'Set Delivery Address',
  subtitle = 'Move the pin to your exact location',
}) => {
  const insets = useSafeAreaInsets();
  const [permStatus, setPermStatus] = useState<PermissionStatus>('checking');
  const [region, setRegion] = useState<Region>(INDIA_CENTER);
  const [addressText, setAddressText] = useState('Detecting address...');
  const [addressDetails, setAddressDetails] = useState<Partial<SelectedAddress>>({});
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [mode, setMode] = useState<'map' | 'manual'>('map');
  const [manualAddress, setManualAddress] = useState('');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  const mapRef = useRef<MapView>(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComponentMounted = useRef(true);

  // ── Web Fallback ───────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.centeredFull}>
        <Feather name="map" size={48} color="#CBD5E1" />
        <Text style={[styles.centeredText, { fontWeight: '600', color: '#0F172A', marginTop: 12 }]}>Map picker is only available on Mobile.</Text>
        <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginHorizontal: 32, marginTop: 8 }}>
          The interactive map requires a physical device. It will work perfectly when you test on your mobile phone.
        </Text>
        <TouchableOpacity style={[styles.primaryBtn, { width: 'auto', marginTop: 24, paddingHorizontal: 24 }]} onPress={onCancel}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Permission & initial location ─────────────────────────────────────────

  useEffect(() => {
    isComponentMounted.current = true;
    requestPermissionAndLocate();
    return () => {
      isComponentMounted.current = false;
      if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    };
  }, []);

  const requestPermissionAndLocate = async () => {
    setPermStatus('checking');
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      setPermStatus('granted');
      locateUser();
    } else {
      // Check if blocked (can't ask again) or just denied
      const { canAskAgain } = await Location.getForegroundPermissionsAsync();
      setPermStatus(canAskAgain ? 'denied' : 'blocked');
    }
  };

  const locateUser = async () => {
    setLocatingUser(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      await reverseGeocode(latitude, longitude);
      revealBottomSheet();
    } catch {
      // Fallback to India center if GPS fails
      setRegion(INDIA_CENTER);
      setAddressText('Could not detect location. Drag map to pin your address.');
      revealBottomSheet();
    } finally {
      if (isComponentMounted.current) setLocatingUser(false);
    }
  };

  // ── Bottom sheet animation ─────────────────────────────────────────────────

  const revealBottomSheet = useCallback(() => {
    setShowBottomSheet(true);
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [bottomSheetAnim]);

  // ── Geocoding ──────────────────────────────────────────────────────────────

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    setAddressText('Fetching address...');
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (!isComponentMounted.current) return;
      
      if (results.length > 0) {
        const p = results[0];
        const parts = [
          p.name,
          p.street,
          p.district || p.subregion,
          p.city,
          p.region,
          p.postalCode,
        ].filter(Boolean);
        const formatted = parts.join(', ');
        setAddressText(formatted || 'Unknown location');
        setAddressDetails({
          flatPlot: p.name && p.name !== p.street ? p.name : '',
          streetArea: [p.street, p.subregion].filter(Boolean).join(', ') || '',
          city: p.city || p.district || '',
          state: p.region || '',
          pincode: p.postalCode || '',
        });
      } else {
        setAddressText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      if (!isComponentMounted.current) return;
      setAddressText('Could not fetch address');
    } finally {
      if (isComponentMounted.current) setLoadingAddress(false);
    }
  };

  const handleQueryAutocomplete = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/public/location/autocomplete?input=${encodeURIComponent(text)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSuggestions(json.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.warn('[Autocomplete error]', err);
    }
  };

  const handleSelectSuggestion = async (placeId: string, description: string) => {
    setSearchQuery(description);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearching(true);
    
    try {
      const res = await fetch(`${API_URL}/public/location/place-details?placeId=${placeId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const newRegion = {
          latitude: json.data.lat,
          longitude: json.data.lng,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 800);
        setAddressText(json.data.address || description);
        setAddressDetails({
          flatPlot: json.data.flatPlot || '',
          streetArea: json.data.streetArea || '',
          city: json.data.city || '',
          state: json.data.state || '',
          pincode: json.data.pincode || '',
        });
      }
    } catch (err) {
      console.error('[Select suggestion error]', err);
    } finally {
      setSearching(false);
    }
  };

  // ── Map interactions ───────────────────────────────────────────────────────

  const onRegionChange = () => {
    if (!isDragging) setIsDragging(true);
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    setIsDragging(false);
    
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    
    // Debounce geocoding for 300ms
    geocodeTimeout.current = setTimeout(() => {
      if (isComponentMounted.current) {
        reverseGeocode(newRegion.latitude, newRegion.longitude);
      }
    }, 300);
  };

  // ── Confirm ────────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (mode === 'manual') {
      if (!manualAddress.trim()) return;
      onAddressSelected({
        latitude: 0,
        longitude: 0,
        address: manualAddress.trim(),
        ...addressDetails,
      });
      return;
    }

    onAddressSelected({
      latitude: region.latitude,
      longitude: region.longitude,
      address: addressText,
      ...addressDetails,
    });
  };

  // ── Render: Checking permission ────────────────────────────────────────────

  if (permStatus === 'checking') {
    return (
      <View style={styles.centeredFull}>
        <ActivityIndicator size="large" color="#FF6A00" />
        <Text style={styles.centeredText}>Checking location permission...</Text>
      </View>
    );
  }

  // ── Render: Permission denied / blocked ───────────────────────────────────

  if (permStatus === 'denied' || permStatus === 'blocked') {
    return (
      <SafeAreaView style={styles.permDeniedContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Permission illustration */}
        <View style={styles.permContent}>
          <View style={styles.permIconCircle}>
            <Feather name="map-pin" size={48} color="#FF6A00" />
          </View>
          <Text style={styles.permTitle}>Enable Location Access</Text>
          <Text style={styles.permSubtitle}>
            We need your location to show your exact address on the map, just like Zomato or Swiggy
            uses it to pin your delivery spot.
          </Text>

          {permStatus === 'blocked' ? (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => Linking.openSettings()}
              >
                <Feather name="settings" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Open App Settings</Text>
              </TouchableOpacity>
              <Text style={styles.permHint}>
                Location is blocked. Go to Settings → Privacy → Location Services to enable it.
              </Text>
            </>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={requestPermissionAndLocate}>
              <Feather name="navigation" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Allow Location</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setMode('manual');
              setPermStatus('granted'); // Show the manual screen
            }}
          >
            <Feather name="edit-2" size={18} color="#FF6A00" />
            <Text style={styles.secondaryBtnText}>Enter Address Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Manual entry mode ──────────────────────────────────────────────

  if (mode === 'manual') {
    return (
      <SafeAreaView style={styles.manualContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMode('map')} style={styles.closeBtn}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Enter Address</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.manualContent}>
            <View style={styles.manualInputGroup}>
              <Feather name="home" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.manualInput}
                placeholder="House / Flat / Floor no."
                placeholderTextColor="#CBD5E1"
                value={manualAddress}
                onChangeText={setManualAddress}
                autoFocus
              />
            </View>
            <Text style={styles.manualHint}>
              Enter your complete address including street name, area, city and pincode.
            </Text>
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.confirmBtn, !manualAddress.trim() && styles.disabledBtn]}
              onPress={handleConfirm}
              disabled={!manualAddress.trim()}
            >
              <Text style={styles.confirmBtnText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Render: Main map view ──────────────────────────────────────────────────

  return (
    <View style={styles.mapContainer}>
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      />
      
      {/* Fixed Center Crosshair Pin */}
      <View style={styles.fixedPinContainer} pointerEvents="none">
        <View style={styles.pin}>
          <View style={styles.pinHead}>
            <Feather name="map-pin" size={28} color="#fff" />
          </View>
          <View style={styles.pinTail} />
        </View>
      </View>

      {/* Header overlay */}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}>
        <View style={styles.mapHeader}>
          <TouchableOpacity onPress={onCancel} style={styles.mapHeaderBtn}>
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.mapHeaderCenter}>
            <Text style={styles.mapHeaderTitle}>{title}</Text>
            <Text style={styles.mapHeaderSub}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setMode('manual')}
            style={styles.mapHeaderBtn}
          >
            <Feather name="edit-2" size={20} color="#FF6A00" />
          </TouchableOpacity>
        </View>

        {/* Address Search Autocomplete Input */}
        <View style={styles.searchSectionWrapper}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search area, landmark, or street..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleQueryAutocomplete}
            />
            <View style={styles.searchIconBtn}>
              {searching ? (
                <ActivityIndicator size="small" color="#FF6A00" />
              ) : (
                <Ionicons name="search" size={18} color="#94A3B8" />
              )}
            </View>
          </View>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item.placeId, item.description)}
                  >
                    <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* "Locate me" FAB */}
        <TouchableOpacity style={styles.locateFab} onPress={locateUser} disabled={locatingUser}>
          {locatingUser ? (
            <ActivityIndicator size="small" color="#FF6A00" />
          ) : (
            <Ionicons name="locate" size={22} color="#FF6A00" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      {showBottomSheet && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [
                {
                  translateY: bottomSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Location type row (like Zomato: Home / Work / Other) */}
          <View style={styles.locationTypeRow}>
            {['Home', 'Work', 'Hotel', 'Other'].map((type) => (
              <TouchableOpacity key={type} style={styles.locationTypeChip}>
                <Text style={styles.locationTypeText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Address preview */}
          <View style={styles.addressPreview}>
            <View style={styles.addressIconBg}>
              <Feather name="map-pin" size={20} color="#FF6A00" />
            </View>
            <View style={{ flex: 1 }}>
              {loadingAddress || isDragging ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FF6A00" />
                  <Text style={styles.addressLoading}>
                    {isDragging ? 'Move pin to select...' : 'Fetching address...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.addressMainText} numberOfLines={2}>
                    {addressText}
                  </Text>
                  {addressDetails.city ? (
                    <Text style={styles.addressSubText}>
                      {[addressDetails.city, addressDetails.state, addressDetails.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
            <TouchableOpacity onPress={() => setMode('manual')} style={styles.changeAddressBtn}>
              <Text style={styles.changeAddressBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            style={[styles.confirmBtn, (loadingAddress || isDragging) && styles.disabledBtn]}
            onPress={handleConfirm}
            disabled={loadingAddress || isDragging}
          >
            <Feather name="check-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Tap hint (shown before user has interacted) */}
      {!showBottomSheet && !locatingUser && (
        <View style={styles.tapHintContainer}>
          <View style={styles.tapHint}>
            <Feather name="navigation" size={16} color="#fff" />
            <Text style={styles.tapHintText}>Drag map to set your address</Text>
          </View>
        </View>
      )}

      {/* Locating spinner overlay */}
      {locatingUser && (
        <View style={styles.locatingOverlay}>
          <ActivityIndicator size="large" color="#FF6A00" />
          <Text style={styles.locatingText}>Finding your location...</Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Full-screen states
  centeredFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 16,
  },
  centeredText: { color: '#64748B', fontSize: 15 },

  // Permission denied screen
  permDeniedContainer: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#0F172A' },

  permContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  permIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: '#FFD6C0',
  },
  permTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  permSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6A00',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permHint: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
    width: '100%',
  },
  divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { color: '#94A3B8', fontSize: 14 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6A00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: '#FF6A00', fontSize: 15, fontWeight: '600' },

  // Manual entry screen
  manualContainer: { flex: 1, backgroundColor: '#fff' },
  manualContent: { padding: 20, paddingTop: 8 },
  manualInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  manualInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  manualHint: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 4,
  },

  // Map view
  mapContainer: { flex: 1, backgroundColor: '#E5E7EB' },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  mapHeaderBtn: { padding: 6, borderRadius: 20 },
  mapHeaderCenter: { flex: 1, alignItems: 'center' },
  mapHeaderTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  mapHeaderSub: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  locateFab: {
    position: 'absolute',
    right: 16,
    bottom: 280,
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  // Fixed Center Pin marker
  fixedPinContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    // offset so the tip of the pin hits the exact center
    marginTop: -28, 
  },
  pin: { alignItems: 'center' },
  pinHead: {
    backgroundColor: '#FF6A00',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pinTail: {
    width: 4,
    height: 14,
    backgroundColor: '#FF6A00',
    borderRadius: 2,
    marginTop: -1,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  locationTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  locationTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  locationTypeText: { fontSize: 13, color: '#475569', fontWeight: '500' },

  addressPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  addressIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressMainText: { fontSize: 15, fontWeight: '600', color: '#0F172A', lineHeight: 22 },
  addressSubText: { fontSize: 13, color: '#64748B', marginTop: 2 },
  addressLoading: { fontSize: 14, color: '#94A3B8' },
  changeAddressBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6A00',
  },
  changeAddressBtnText: { fontSize: 13, color: '#FF6A00', fontWeight: '600' },

  // Shared confirm button
  bottomBar: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  disabledBtn: { backgroundColor: '#FDBA74', shadowOpacity: 0 },

  // Tap hint
  tapHintContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  tapHintText: { color: '#fff', fontSize: 14, fontWeight: '500' },

  // Locating overlay
  locatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  locatingText: { color: '#64748B', fontSize: 16, fontWeight: '500' },
  searchSectionWrapper: {
    zIndex: 10,
    position: 'relative',
    marginHorizontal: 12,
    marginTop: 8
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0
  },
  searchIconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 999
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  suggestionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1
  }
});
