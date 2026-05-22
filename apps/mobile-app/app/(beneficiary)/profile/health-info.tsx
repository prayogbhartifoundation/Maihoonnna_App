import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Modal, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

const BLOOD_GROUPS_ENUM_MAP: Record<string, string> = {
    'A+': 'A_positive', 'A-': 'A_negative',
    'B+': 'B_positive', 'B-': 'B_negative',
    'O+': 'O_positive', 'O-': 'O_negative',
    'AB+': 'AB_positive', 'AB-': 'AB_negative',
    'unknown': 'unknown'
};

const ENUM_BLOOD_GROUPS_MAP: Record<string, string> = {
    'A_positive': 'A+', 'A_negative': 'A-',
    'B_positive': 'B+', 'B_negative': 'B-',
    'O_positive': 'O+', 'O_negative': 'O-',
    'AB_positive': 'AB+', 'AB_negative': 'AB-',
    'unknown': 'unknown'
};

export default function HealthInformationScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [selectedBlood, setSelectedBlood] = useState('A+');
    const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Peanuts']);
    const [conditions, setConditions] = useState<string[]>(['Hypertension', 'Type 2 Diabetes']);

    // Modal Add States
    const [addModalType, setAddModalType] = useState<'allergy' | 'condition' | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    useEffect(() => {
        fetchHealthInfo();
    }, []);

    const fetchHealthInfo = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success && result.data) {
                const b = result.data;
                const localBlood = ENUM_BLOOD_GROUPS_MAP[b.bloodGroup] || 'A+';
                setSelectedBlood(localBlood);
                if (b.allergies) {
                    setAllergies(b.allergies);
                }
                if (b.conditions) {
                    const parsedConditions = b.conditions
                        .filter((c: any) => c.isActive)
                        .map((c: any) => c.condition?.name || '');
                    setConditions(parsedConditions.filter(Boolean));
                }
            }
        } catch (e) {
            console.error('Error fetching health details:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('userToken');

            const backendBloodEnum = BLOOD_GROUPS_ENUM_MAP[selectedBlood] || 'A_positive';

            if (token) {
                const response = await fetch(`${API_URL}/beneficiary/profile/health-info`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        bloodGroup: backendBloodEnum,
                        allergies,
                        conditions
                    })
                });

                const result = await response.json();
                if (result.success) {
                    Alert.alert('Success', 'Health information updated successfully!');
                    router.back();
                } else {
                    Alert.alert('Error', result.message || 'Failed to update health info');
                }
            } else {
                // Mock Success
                Alert.alert('Success (Offline Demo)', 'Health information updated successfully!');
                router.back();
            }
        } catch (e) {
            console.error('Error saving health info:', e);
            Alert.alert('Error', 'An unexpected error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const removeAllergy = (index: number) => {
        setAllergies(prev => prev.filter((_, i) => i !== index));
    };

    const removeCondition = (index: number) => {
        setConditions(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenAddModal = (type: 'allergy' | 'condition') => {
        setNewItemName('');
        setAddModalType(type);
    };

    const handleAddItem = () => {
        const cleaned = newItemName.trim();
        if (!cleaned) return;

        if (addModalType === 'allergy') {
            if (allergies.some(item => item.toLowerCase() === cleaned.toLowerCase())) {
                Alert.alert('Info', 'This allergy is already recorded.');
                return;
            }
            setAllergies(prev => [...prev, cleaned]);
        } else if (addModalType === 'condition') {
            if (conditions.some(item => item.toLowerCase() === cleaned.toLowerCase())) {
                Alert.alert('Info', 'This chronic condition is already recorded.');
                return;
            }
            setConditions(prev => [...prev, cleaned]);
        }

        setAddModalType(null);
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#FF6F00" />
                <Text style={styles.loadingText}>Retrieving health records...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Health Information</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Section 1: Blood Type selectors */}
                <View style={styles.panel}>
                    <Text style={styles.panelLabel}>Blood Type</Text>
                    <View style={styles.bloodGrid}>
                        {bloodTypes.map((type) => {
                            const isSelected = selectedBlood === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.bloodBtn,
                                        isSelected && styles.bloodBtnSelected
                                    ]}
                                    onPress={() => setSelectedBlood(type)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.bloodBtnText,
                                        isSelected && styles.bloodBtnTextSelected
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Section 2: Allergies */}
                <View style={styles.panel}>
                    <View style={styles.panelHeaderRow}>
                        <Text style={styles.panelLabel}>Allergies</Text>
                        <TouchableOpacity style={styles.addIconBtn} onPress={() => handleOpenAddModal('allergy')}>
                            <Feather name="plus" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {allergies.length === 0 ? (
                        <Text style={styles.emptyLabel}>No allergies recorded.</Text>
                    ) : (
                        allergies.map((allergy, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <Text style={styles.itemText}>{allergy}</Text>
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removeAllergy(idx)}
                                    activeOpacity={0.6}
                                >
                                    <Feather name="x" size={14} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Section 3: Chronic Conditions 
                     NOTE: This section maps directly to the "Medical Information / Medical History" of the Beneficiary.
                     Any entries saved here are synced to the DB's BeneficiaryCondition relations. */}
                <View style={styles.panel}>
                    <View style={styles.panelHeaderRow}>
                        <Text style={styles.panelLabel}>Chronic Conditions</Text>
                        <TouchableOpacity style={styles.addIconBtn} onPress={() => handleOpenAddModal('condition')}>
                            <Feather name="plus" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {conditions.length === 0 ? (
                        <Text style={styles.emptyLabel}>No chronic conditions recorded.</Text>
                    ) : (
                        conditions.map((condition, idx) => (
                            <View key={idx} style={[styles.itemRow, { backgroundColor: '#F5F3FF' }]}>
                                <Text style={[styles.itemText, { color: '#6D28D9' }]}>{condition}</Text>
                                <TouchableOpacity
                                    style={[styles.removeBtn, { backgroundColor: '#EDE9FE' }]}
                                    onPress={() => removeCondition(idx)}
                                    activeOpacity={0.6}
                                >
                                    <Feather name="x" size={14} color="#8B5CF6" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                {/* Important alert note block */}
                <View style={styles.alertCard}>
                    <Ionicons name="information-circle-outline" size={20} color="#B45309" style={styles.alertIcon} />
                    <View style={styles.alertTextWrap}>
                        <Text style={styles.alertTitle}>Important</Text>
                        <Text style={styles.alertDesc}>
                            Keep this information up to date. It's shared with your care team and emergency contacts.
                        </Text>
                    </View>
                </View>

                {/* Bottom Trigger Save changes */}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.8 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>

                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </ScrollView>

            {/* Item Adding Modal */}
            <Modal visible={addModalType !== null} animationType="fade" transparent={true}>
                <View style={styles.backdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            Add New {addModalType === 'allergy' ? 'Allergy' : 'Condition'}
                        </Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder={addModalType === 'allergy' ? 'e.g. Shellfish, Penicillin' : 'e.g. Asthma, Thyroid'}
                            value={newItemName}
                            onChangeText={setNewItemName}
                            autoFocus={true}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalType(null)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddItem}>
                                <Text style={styles.confirmText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FDF8F3',
    },
    backBtn: {
        marginRight: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    content: {
        padding: 20,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDF8F3',
    },
    loadingText: {
        marginTop: 12,
        color: '#4B5563',
        fontSize: 15,
        fontFamily: 'Outfit-Medium',
    },
    panel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    panelHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    panelLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
        marginBottom: 8,
    },
    bloodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    bloodBtn: {
        width: '23%',
        aspectRatio: 1.5,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
    },
    bloodBtnSelected: {
        borderColor: '#FF6F00',
        backgroundColor: '#FFF2EB',
        borderWidth: 2,
    },
    bloodBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        fontFamily: 'Outfit-SemiBold',
    },
    bloodBtnTextSelected: {
        color: '#FF6F00',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Outfit-Bold',
    },
    addIconBtn: {
        backgroundColor: '#FF6F00',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        fontFamily: 'Outfit-Regular',
        fontStyle: 'italic',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 10,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#991B1B',
        fontFamily: 'Outfit-SemiBold',
    },
    removeBtn: {
        backgroundColor: '#FEE2E2',
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertCard: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FCD34D',
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 24,
    },
    alertIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    alertTextWrap: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 4,
    },
    alertDesc: {
        fontSize: 12,
        color: '#B45309',
        fontFamily: 'Outfit-Regular',
        lineHeight: 18,
    },
    saveBtn: {
        backgroundColor: '#FF6F00',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        backgroundColor: '#F9FAFB',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        fontFamily: 'Outfit-SemiBold',
    },
    confirmBtn: {
        backgroundColor: '#FF6F00',
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Outfit-SemiBold',
    },
});
