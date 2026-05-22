import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, TextInput, Modal, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

interface EmergencyContact {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    isPrimary: boolean;
}

export default function EmergencyContactsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);

    // Edit/Add Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactRelation, setContactRelation] = useState('');
    const [isPrimaryContact, setIsPrimaryContact] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                useFallbackContacts();
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success && result.data && result.data.emergencyContacts) {
                const ec = result.data.emergencyContacts;
                if (ec.length > 0) {
                    setContacts(ec.map((c: any) => ({
                        name: c.name,
                        phone: c.phone,
                        email: c.email || '',
                        relationship: c.relationship,
                        isPrimary: !!c.isPrimary
                    })));
                } else {
                    useFallbackContacts();
                }
            } else {
                useFallbackContacts();
            }
        } catch (e) {
            console.error('Error fetching emergency contacts:', e);
            useFallbackContacts();
        } finally {
            setLoading(false);
        }
    };

    const useFallbackContacts = () => {
        setContacts([
            {
                name: 'Mayur Jain',
                phone: '+1 (555) 123-4567',
                email: 'robert.williams@email.com',
                relationship: 'Son',
                isPrimary: true
            },
            {
                name: 'Sonali Jain',
                phone: '+1 (555) 234-5678',
                email: 'jennifer.davis@email.com',
                relationship: 'Daughter',
                isPrimary: false
            }
        ]);
    };

    const handleSaveContacts = async (updatedContacts: EmergencyContact[]) => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                const response = await fetch(`${API_URL}/beneficiary/profile/emergency-contacts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ contacts: updatedContacts })
                });

                const result = await response.json();
                if (result.success) {
                    setContacts(updatedContacts);
                } else {
                    Alert.alert('Error', result.message || 'Failed to save emergency contacts');
                }
            } else {
                setContacts(updatedContacts);
            }
        } catch (e) {
            console.error('Save Contacts Error:', e);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEdit = (index: number) => {
        const c = contacts[index];
        setEditIndex(index);
        setContactName(c.name);
        setContactPhone(c.phone);
        setContactEmail(c.email || '');
        setContactRelation(c.relationship);
        setIsPrimaryContact(c.isPrimary);
        setModalVisible(true);
    };

    const handleOpenAdd = () => {
        setEditIndex(null);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactRelation('');
        // If there are no contacts, make this one primary by default
        setIsPrimaryContact(contacts.length === 0);
        setModalVisible(true);
    };

    const handleSetPrimary = (index: number) => {
        const updated = contacts.map((c, i) => ({
            ...c,
            isPrimary: i === index
        }));
        handleSaveContacts(updated);
    };

    const handleConfirmSave = () => {
        const nameClean = contactName.trim();
        const phoneClean = contactPhone.trim();
        const emailClean = contactEmail.trim();
        const relationClean = contactRelation.trim();

        if (!nameClean || !phoneClean || !relationClean) {
            Alert.alert('Error', 'Please fill in Name, Phone, and Relationship.');
            return;
        }

        let updated = [...contacts];

        // If setting this one as primary, ensure all others are marked false
        if (isPrimaryContact) {
            updated = updated.map(c => ({ ...c, isPrimary: false }));
        }

        const newContact: EmergencyContact = {
            name: nameClean,
            phone: phoneClean,
            email: emailClean || undefined,
            relationship: relationClean,
            isPrimary: isPrimaryContact || (contacts.length === 0) // force true if first contact
        };

        if (editIndex !== null) {
            updated[editIndex] = newContact;
        } else {
            updated.push(newContact);
        }

        setModalVisible(false);
        handleSaveContacts(updated);
    };

    const handleDeleteContact = (index: number) => {
        const contactName = contacts[index]?.name || 'this contact';

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to delete ${contactName}?`);
            if (confirmed) {
                let updated = contacts.filter((_, i) => i !== index);
                if (contacts[index].isPrimary && updated.length > 0) {
                    updated[0].isPrimary = true;
                }
                handleSaveContacts(updated);
            }
            return;
        }

        Alert.alert(
            'Delete Contact',
            `Are you sure you want to delete ${contactName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        let updated = contacts.filter((_, i) => i !== index);
                        // If we deleted the primary contact, and there are others left, make the first one primary
                        if (contacts[index].isPrimary && updated.length > 0) {
                            updated[0].isPrimary = true;
                        }
                        handleSaveContacts(updated);
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#FF6F00" />
                <Text style={styles.loadingText}>Loading emergency contacts...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header with Back & Add Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency Contacts</Text>
                <TouchableOpacity onPress={handleOpenAdd} style={styles.addCircleHeaderBtn} activeOpacity={0.8}>
                    <Feather name="plus" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {contacts.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <MaterialCommunityIcons name="phone-off" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No emergency contacts found. Tap '+' to add one!</Text>
                    </View>
                ) : (
                    contacts.map((c, idx) => (
                        <View key={idx} style={[styles.contactCard, c.isPrimary && styles.primaryCard]}>
                            {/* Card Header Row with Name & Quick Edit / Trash */}
                            <View style={styles.cardHeader}>
                                <View style={styles.leftLabelCol}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.contactName}>{c.name}</Text>
                                        {c.isPrimary && (
                                            <FontAwesome name="star" size={16} color="#FFB000" style={{ marginLeft: 6, marginTop: 2 }} />
                                        )}
                                    </View>
                                    <Text style={styles.relationshipText}>{c.relationship}</Text>
                                </View>
                                <View style={styles.cardHeaderRight}>
                                    <TouchableOpacity onPress={() => handleOpenEdit(idx)} style={styles.editCardBtn}>
                                        <Feather name="edit-2" size={16} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteContact(idx)} style={styles.deleteCardBtn}>
                                        <Feather name="trash-2" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Contact Details Body */}
                            <View style={styles.cardBody}>
                                <View style={styles.infoLine}>
                                    <Feather name="phone" size={14} color="#4B5563" style={{ marginRight: 8 }} />
                                    <Text style={styles.orangeLinkText}>{c.phone}</Text>
                                </View>

                                {c.email ? (
                                    <View style={[styles.infoLine, { marginTop: 6 }]}>
                                        <Feather name="mail" size={14} color="#4B5563" style={{ marginRight: 8 }} />
                                        <Text style={styles.orangeLinkText}>{c.email}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Set as Primary Button (if not already primary) */}
                            {!c.isPrimary && (
                                <TouchableOpacity
                                    style={styles.setPrimaryBtn}
                                    onPress={() => handleSetPrimary(idx)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.setPrimaryBtnText}>Set as Primary</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}

                {/* Info Note Card inspired by Figma */}
                <View style={styles.infoNoteCard}>
                    <Text style={styles.infoNoteTitle}>Emergency Contact Info</Text>
                    <Text style={styles.infoNoteDesc}>
                        These contacts will be notified in case of emergency. The primary contact will be called first.
                    </Text>
                </View>

                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </ScrollView>

            {/* Form Editor Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.backdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editIndex !== null ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                                <Feather name="x" size={20} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Mayur Jain"
                                value={contactName}
                                onChangeText={setContactName}
                            />

                            <Text style={styles.label}>Relationship</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. Son, Daughter, Doctor"
                                value={contactRelation}
                                onChangeText={setContactRelation}
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. +1 (555) 123-4567"
                                value={contactPhone}
                                onChangeText={setContactPhone}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Email Address (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g. robert.williams@email.com"
                                value={contactEmail}
                                onChangeText={setContactEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Toggle Primary Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setIsPrimaryContact(prev => !prev)}
                                activeOpacity={0.8}
                                disabled={editIndex !== null && contacts[editIndex].isPrimary} // Can't un-primary the only primary contact
                            >
                                <View style={[
                                    styles.checkbox,
                                    (isPrimaryContact || (editIndex !== null && contacts[editIndex].isPrimary)) && styles.checkboxActive
                                ]}>
                                    {(isPrimaryContact || (editIndex !== null && contacts[editIndex].isPrimary)) && (
                                        <Feather name="check" size={13} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as Primary Contact</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.8 }]}
                                onPress={handleConfirmSave}
                                activeOpacity={0.8}
                                disabled={saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Contact'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FDF8F3',
    },
    backBtn: {
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
        textAlign: 'center',
        flex: 1,
    },
    addCircleHeaderBtn: {
        backgroundColor: '#FF6F00',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
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
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        color: '#9CA3AF',
        fontFamily: 'Outfit-Medium',
        textAlign: 'center',
        fontSize: 14,
    },
    contactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 2,
    },
    primaryCard: {
        borderColor: '#FFD7C2',
        backgroundColor: '#FFFBF9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    leftLabelCol: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    relationshipText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
        marginTop: 2,
    },
    cardHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editCardBtn: {
        padding: 4,
        marginRight: 12,
    },
    deleteCardBtn: {
        padding: 4,
    },
    cardBody: {
        marginBottom: 16,
    },
    infoLine: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orangeLinkText: {
        fontSize: 14,
        color: '#FF6F00',
        fontFamily: 'Outfit-SemiBold',
        fontWeight: '600',
    },
    setPrimaryBtn: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    setPrimaryBtnText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
    infoNoteCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 24,
        padding: 20,
        marginTop: 10,
    },
    infoNoteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
        marginBottom: 6,
    },
    infoNoteDesc: {
        fontSize: 13,
        color: '#4B5563',
        fontFamily: 'Outfit-Regular',
        lineHeight: 18,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    closeModalBtn: {
        padding: 6,
    },
    label: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 6,
        marginTop: 14,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        backgroundColor: '#FFFFFF',
    },
    checkboxActive: {
        backgroundColor: '#FF6F00',
        borderColor: '#FF6F00',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'Outfit-Medium',
    },
    saveBtn: {
        backgroundColor: '#FF6F00',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
});
