import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BeneficiaryInfoScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [showRelationshipModal, setShowRelationshipModal] = useState(false);
    const relationships = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Sibling', 'Guardian', 'Friend', 'Other'];

    const [beneficiaryForm, setBeneficiaryForm] = useState({
        fullName: '',
        dob: '',
        gender: '',
        maritalStatus: '',
        relationship: '',
        phone: '',
        address: ''
    });

    const handleNext = () => {
        router.push({
            pathname: '/(setup)/medical-info',
            params: {
                packageId: params.packageId,
                subscriberData: params.subscriberData,
                beneficiaryData: JSON.stringify(beneficiaryForm)
            }
        });
    };

    const handleBack = () => {
        router.back();
    };

    const SegmentedButton = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={onPress}
        >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
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
                            <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
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
                            <TouchableOpacity style={styles.photoBox}>
                                <MaterialCommunityIcons name="image-plus" size={32} color="#4B5563" />
                                <Text style={styles.uploadLabel}>Upload Photo</Text>
                                <TouchableOpacity style={styles.editIconBadge}>
                                    <Ionicons name="pencil" size={12} color="white" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                            <Text style={styles.photoHint}>Add a clear photo for identification</Text>
                        </View>

                        {/* Beneficiary Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Beneficiary Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter beneficiary's full name"
                                placeholderTextColor="#9CA3AF"
                                value={beneficiaryForm.fullName}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, fullName: t })}
                            />
                        </View>

                        {/* Date of Birth */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth *</Text>
                            <View style={styles.inputWithIcon}>
                                <TextInput
                                    style={styles.flexInput}
                                    placeholder="dd-mm-yyyy"
                                    placeholderTextColor="#9CA3AF"
                                    value={beneficiaryForm.dob}
                                    onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, dob: t })}
                                />
                                <Ionicons name="calendar-outline" size={20} color="#4B5563" />
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
                                value={beneficiaryForm.phone}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, phone: t })}
                            />
                        </View>

                        {/* Address Area */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter complete address"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                value={beneficiaryForm.address}
                                onChangeText={(t) => setBeneficiaryForm({ ...beneficiaryForm, address: t })}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.prevBtn} onPress={handleBack}>
                        <Text style={styles.prevBtnText}>Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                </View>

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

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    header: { backgroundColor: '#FFFFFF', paddingTop: 10 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40 },
    headerTextContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
    notifBadge: { position: 'absolute', right: -4, top: -2, backgroundColor: '#E46C2B', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 4, backgroundColor: '#F97316', width: '40%' },

    scrollContent: { padding: 15 },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 },

    label: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 10 },
    inputGroup: { marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12 },
    flexInput: { flex: 1, fontSize: 15, color: '#111827' },
    textArea: { height: 80, textAlignVertical: 'top' },

    photoUploadContainer: { alignItems: 'center', marginBottom: 25 },
    photoBox: { width: 150, height: 90, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    uploadLabel: { fontSize: 12, color: '#4B5563', marginTop: 5 },
    editIconBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#F97316', padding: 5, borderRadius: 10 },
    photoHint: { fontSize: 11, color: '#4B5563', marginTop: 10 },

    segmentContainer: { flexDirection: 'row', marginBottom: 5 },
    segmentBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    segmentBtnActive: { backgroundColor: '#F97316' },
    segmentText: { fontSize: 13, color: '#4B5563' },
    segmentTextActive: { color: '#FFFFFF', fontWeight: '500' },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20 },
    prevBtn: { flex: 0.48, borderWidth: 1, borderColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    prevBtnText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
    nextBtn: { flex: 0.48, backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '70%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    optionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5 },
    optionBtnActive: { backgroundColor: '#FFF5ED' },
    optionText: { fontSize: 16, color: '#4B5563' },
    optionTextActive: { color: '#F97316', fontWeight: '600' }
});
