import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable, Animated, Dimensions, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

import GlobalDrawer from '../(subscriber)/components/shared/GlobalDrawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { AddressPicker, SelectedAddress } from '../../components/ui/AddressPicker';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { PhotoPickerInput } from '../../components/ui/PhotoPickerInput';
import { AddressInputField } from '../../components/ui/AddressInputField';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSpacer from '@/components/HeaderSpacer';
// ⚠️ DEV ONLY — remove this import when done testing
import { useState as useDevState } from 'react';

export default function BeneficiaryInfoScreen() {
    const router = useRouter();
    const { push } = useNavigationStack();
    const safeBack = useSafeBack();
    useAndroidBackHandler();
    const params = useLocalSearchParams();
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_500Medium,
        Poppins_600SemiBold
    });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        AsyncStorage.getItem('userData').then(data => {
            if (data) setUserData(JSON.parse(data));
        });
    }, []);

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
    const relationships = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Sibling', 'Guardian', 'Friend', 'Other'];

    // Request location permission immediately on screen load
    const { location: userLocation } = useLocationPermission({ requestOnMount: true });

    const [beneficiaryForm, setBeneficiaryForm] = useState({
        fullName: '',
        dob: '',
        gender: '',
        maritalStatus: '',
        relationship: '',
        phone: '',
        address: '',
        flatPlot: '',
        streetArea: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        latitude: 0,
        longitude: 0,
    });

    // ⚠️ DEV ONLY — remove this block when done testing
    const [devPassword, setDevPassword] = useState('');
    const [devPwdVisible, setDevPwdVisible] = useState(false);
    // end DEV ONLY

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleDobChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
        }
        if (cleaned.length > 4) {
            formatted = formatted.substring(0, 5) + '/' + cleaned.substring(4);
        }
        if (formatted.length > 10) {
            formatted = formatted.substring(0, 10);
        }
        setBeneficiaryForm({ ...beneficiaryForm, dob: formatted });
    };

    const handleConfirmDate = (date: Date) => {
        setDatePickerVisibility(false);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setBeneficiaryForm({ ...beneficiaryForm, dob: `${day}/${month}/${year}` });
    };

    const handleNext = () => {
        push('/(setup)/medical-info', {
            packageId: params.packageId,
            subscriberData: params.subscriberData,
            // ⚠️ DEV ONLY — devPassword is included so checkout can call /api/dev/set-beneficiary-password
            beneficiaryData: JSON.stringify({ ...beneficiaryForm, photoUri: pickedPhotoUri, devPassword: devPassword || undefined })
        });
    };

    const handleBack = () => {
        safeBack();
    };

    const SegmentedButton = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={onPress}
        >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    if (!fontsLoaded) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#FF5C00" />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.safeArea}>
            <HeaderSpacer backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Subscribe to Care</Text>
                            <Text style={styles.headerSubtitle}>Step 2 of 5</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#111827" />
                                <View style={styles.notifBadge}><Text style={styles.notifText}>2</Text></View>
                            </View>
                            <TouchableOpacity onPress={openDrawer}>
                                <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '40%' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Beneficiary Information</Text>

                        {/* Profile Photo Upload UI */}
                        <Text style={styles.label}>Profile Photo</Text>
                        <View style={styles.photoUploadContainer}>
                            <PhotoPickerInput
                                currentUri={pickedPhotoUri}
                                onPhotoSelected={(uri) => setPickedPhotoUri(uri)}
                                onPhotoClear={() => setPickedPhotoUri(null)}
                                size={108}
                                width={190}
                                height={119}
                                shape="square"
                                accentColor="#FE6700"
                                emptyImageSource={require("../../assets/images/camera.png")}
                                label="Upload Photo"
                                hint="Add a clear photo for identification"
                            />
                        </View>

                        {/* Beneficiary Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Beneficiary Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter beneficiary's full name"
                                placeholderTextColor="#9CA3AF"
                                value={beneficiaryForm.fullName}
                                maxLength={50}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, fullName: t })}
                            />
                        </View>

                        {/* Date of Birth */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth *</Text>
                            <View style={styles.inputWithIcon}>
                                <TextInput
                                    style={styles.flexInput}
                                    placeholder="dd/mm/yyyy"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    value={beneficiaryForm.dob}
                                    onChangeText={handleDobChange}
                                />
                                <TouchableOpacity onPress={() => {
                                    if (Platform.OS === 'web') {
                                        alert("Please type the date directly (dd/mm/yyyy). The calendar picker will work natively on the mobile app.");
                                    } else {
                                        setDatePickerVisibility(true);
                                    }
                                }}>
                                    <Ionicons name="calendar-outline" size={20} color="#4B5563" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Gender Segmented Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender *</Text>
                            <View style={styles.segmentContainer}>
                                <SegmentedButton
                                    label="Male"
                                    active={beneficiaryForm.gender === 'Male'}
                                    onPress={() => setBeneficiaryForm({ ...beneficiaryForm, gender: 'Male' })}
                                />
                                <SegmentedButton
                                    label="Female"
                                    active={beneficiaryForm.gender === 'Female'}
                                    onPress={() => setBeneficiaryForm({ ...beneficiaryForm, gender: 'Female' })}
                                />
                            </View>
                        </View>

                        {/* Marital Status Segmented Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Marital Status *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentContainer}>
                                {['Single', 'Married', 'Widowed', 'Divorced'].map((status) => (
                                    <SegmentedButton
                                        key={status}
                                        label={status}
                                        active={beneficiaryForm.maritalStatus === status}
                                        onPress={() => setBeneficiaryForm({ ...beneficiaryForm, maritalStatus: status })}
                                    />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Relationship Dropdown */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Relationship to Subscriber *</Text>
                            <TouchableOpacity
                                style={styles.inputWithIcon}
                                onPress={() => setShowRelationshipModal(true)}
                            >
                                <Text style={[styles.flexInput, !beneficiaryForm.relationship && { color: '#9CA3AF' }]}>
                                    {beneficiaryForm.relationship || 'Please Select'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Custom Relationship Input for 'Other' */}
                        {(beneficiaryForm.relationship === 'Other' || !relationships.includes(beneficiaryForm.relationship)) && beneficiaryForm.relationship !== '' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Please Specify Relationship *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Grandfather, Aunt, etc."
                                    placeholderTextColor="#9CA3AF"
                                    value={beneficiaryForm.relationship === 'Other' ? '' : beneficiaryForm.relationship}
                                    maxLength={50}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, relationship: t })}
                                    autoFocus
                                />
                            </View>
                        )}

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="10-digit mobile number"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                maxLength={10}
                                value={beneficiaryForm.phone}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, phone: t.replace(/[^0-9]/g, '').slice(0, 10) })}
                            />
                        </View>

                        {/* ⚠️ DEV ONLY — inline test password field — remove this block when done testing */}
                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={styles.label}>Test Password</Text>
                                <View style={{ marginLeft: 6, backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#92400E', letterSpacing: 0.3 }}>DEV ONLY</Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F59E0B', borderRadius: 9, backgroundColor: '#FFFBEB', overflow: 'hidden' }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', marginBottom: 0 }]}
                                    placeholder="Set login password (optional)"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!devPwdVisible}
                                    value={devPassword}
                                    onChangeText={setDevPassword}
                                />
                                <TouchableOpacity onPress={() => setDevPwdVisible(v => !v)} style={{ paddingHorizontal: 12 }}>
                                    <Ionicons name={devPwdVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#92400E" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* end DEV ONLY */}

                        {/* Address Area */}
                        <AddressInputField
                            label=""
                            value={beneficiaryForm.address}
                            onChangeText={(t) => setBeneficiaryForm(prev => ({ ...prev, address: t }))}
                            onLocationFetched={(details) => setBeneficiaryForm(prev => ({
                                ...prev,
                                address: details.address || prev.address,
                                streetArea: details.address?.split(',')[0] || prev.streetArea,
                                city: details.city || prev.city,
                                state: details.state || prev.state,
                                pincode: details.pincode || prev.pincode,
                                latitude: details.latitude || 0,
                                longitude: details.longitude || 0,
                            }))}
                        />

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={[styles.label, styles.rowLabel]}>Flat / Plot / Building</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 402, Sunshine"
                                    placeholderTextColor="#9CA3AF"
                                    value={beneficiaryForm.flatPlot}
                                    maxLength={50}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, flatPlot: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                <Text style={[styles.label, styles.rowLabel]}>Street / Area *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Sector 15"
                                    placeholderTextColor="#9CA3AF"
                                    value={beneficiaryForm.streetArea}
                                    maxLength={80}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, streetArea: t })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Landmark (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Near HDFC Bank"
                                placeholderTextColor="#9CA3AF"
                                value={beneficiaryForm.landmark}
                                maxLength={80}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, landmark: t })}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>City *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="City"
                                    placeholderTextColor="#9CA3AF"
                                    value={beneficiaryForm.city}
                                    maxLength={50}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, city: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Pincode *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Pincode"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    maxLength={6}
                                    value={beneficiaryForm.pincode}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, pincode: t.replace(/[^0-9]/g, '').slice(0, 6) })}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>State *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="#9CA3AF"
                                value={beneficiaryForm.state}
                                maxLength={50}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, state: t })}
                            />
                        </View>
                        {beneficiaryForm.latitude !== 0 && (
                            <View style={[styles.coordsBadge, { marginBottom: 20 }]}>
                                <Ionicons name="location" size={12} color="#10B981" />
                                <Text style={styles.coordsText}>GPS coordinates saved</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.prevBtn} onPress={handleBack}>
                                <Text style={styles.prevBtnText}>Previous</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

                {/* Relationship Selection Modal */}
                <Modal visible={showRelationshipModal} transparent animationType="slide">
                    <Pressable style={styles.modalOverlay} onPress={() => setShowRelationshipModal(false)}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Relationship</Text>
                                <TouchableOpacity onPress={() => setShowRelationshipModal(false)}>
                                    <Ionicons name="close" size={24} color="#111827" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {relationships.map((rel) => (
                                    <TouchableOpacity
                                        key={rel}
                                        style={[
                                            styles.optionBtn,
                                            beneficiaryForm.relationship === rel && styles.optionBtnActive
                                        ]}
                                        onPress={() => {
                                            setBeneficiaryForm({ ...beneficiaryForm, relationship: rel });
                                            setShowRelationshipModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            beneficiaryForm.relationship === rel && styles.optionTextActive
                                        ]}>{rel}</Text>
                                        {beneficiaryForm.relationship === rel && (
                                            <Ionicons name="checkmark-circle" size={20} color="#F97316" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>

                {/* Address Picker Modal handled internally by AddressInputField */}

                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmDate}
                    onCancel={() => setDatePickerVisibility(false)}
                />

                {/* ⚠️ DEV ONLY — auto-set password after form next — remove when done testing */}

            </KeyboardAvoidingView>

            <GlobalDrawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                drawerAnim={drawerAnim}
                userData={userData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF1E6' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    header: { backgroundColor: '#FFFFFF' },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 11 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 44, height: 44, justifyContent: 'center' },
    headerTextContainer: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 7 },
    headerTitle: { fontFamily: 'Poppins_400Regular', fontSize: 18, lineHeight: 24, color: '#000000' },
    headerSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 22, color: '#8F95A3', marginTop: 2 },
    notifBadge: { position: 'absolute', right: -7, top: -7, backgroundColor: '#FF5C00', borderRadius: 10, width: 19, height: 19, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
    progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 4, backgroundColor: '#FF5C00', width: '40%' },

    scrollContent: { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 36 },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 26,
        paddingTop: 27,
        paddingBottom: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
        elevation: 5
    },
    sectionTitle: { fontFamily: 'Poppins_400Regular', fontSize: 20, lineHeight: 28, color: '#000000', marginBottom: 18 },

    label: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#000000', marginBottom: 12 },
    rowLabel: { minHeight: 40 },
    inputGroup: { marginBottom: 14 },
    input: { height: 53, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 0, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#111827' },
    inputWithIcon: { height: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 9, paddingHorizontal: 16 },
    flexInput: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#111827' },
    textArea: { height: 103, textAlignVertical: 'top', paddingTop: 14 },

    photoUploadContainer: { alignItems: 'center', marginTop: 14, marginBottom: 25 },
    photoBox: { width: 150, height: 90, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    uploadLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#4B5563', marginTop: 5 },
    editIconBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#F97316', padding: 5, borderRadius: 10 },
    photoHint: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#4B5563', marginTop: 10 },

    segmentContainer: { flexDirection: 'row', marginBottom: 6 },
    segmentBtn: { backgroundColor: '#E5E5E5', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginRight: 9 },
    segmentBtnActive: { backgroundColor: '#FF5C00' },
    segmentText: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16, color: '#000000' },
    segmentTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginTop: 8, marginBottom: 14 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    prevBtn: { flex: 0.48, height: 53, borderWidth: 1, borderColor: '#FF5C00', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    prevBtnText: { color: '#FF5C00', fontSize: 18, lineHeight: 25, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
    nextBtn: { flex: 0.48, height: 53, backgroundColor: '#FF5C00', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    nextBtnText: { color: '#FFFFFF', fontSize: 18, lineHeight: 25, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, fontWeight: '600', color: '#111827' },
    optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5 },
    optionBtnActive: { backgroundColor: '#FFF5ED' },
    optionText: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#4B5563' },
    optionTextActive: { color: '#F97316', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
    coordsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    coordsText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#10B981', fontWeight: '500' },
});
