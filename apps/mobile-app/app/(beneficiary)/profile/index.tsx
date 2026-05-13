import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Image, Platform, TextInput, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { logoutWithConfirm } from '@/utils/logout';

interface ContactInfo {
    phone: string;
    email: string;
    address: string;
}

interface ProfileData {
    name: string;
    age: number;
    gender: string;
    bloodGroup: string;
    allergiesCount: number;
    conditionsCount: number;
    contact: ContactInfo;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData>({
        name: 'Margaret Williams',
        age: 71,
        gender: 'Female',
        bloodGroup: 'A+',
        allergiesCount: 2,
        conditionsCount: 2,
        contact: {
            phone: '+1 (555) 987-6543',
            email: 'margaret.williams@email.com',
            address: '123 Maple Street, San Francisco, CA 94102'
        }
    });

    // Edit Modal States
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const mapFromEnum = (enumVal: string): string => {
        switch(enumVal) {
            case 'A_positive': return 'A+';
            case 'A_negative': return 'A-';
            case 'B_positive': return 'B+';
            case 'B_negative': return 'B-';
            case 'O_positive': return 'O+';
            case 'O_negative': return 'O-';
            case 'AB_positive': return 'AB+';
            case 'AB_negative': return 'AB-';
            default: return 'A+';
        }
    };

    const fetchProfile = async () => {
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
                const formattedGender = b.gender ? b.gender.charAt(0).toUpperCase() + b.gender.slice(1) : 'Female';

                setProfile({
                    name: b.name || b.user?.name || 'Margaret Williams',
                    age: b.age || 71,
                    gender: formattedGender,
                    bloodGroup: mapFromEnum(b.bloodGroup),
                    allergiesCount: b.allergies ? b.allergies.length : 0,
                    conditionsCount: b.conditions ? b.conditions.length : 0,
                    contact: {
                        phone: b.user?.phone || b.phone || '+1 (555) 987-6543',
                        email: b.user?.email || b.email || 'margaret.williams@email.com',
                        address: b.address || '123 Maple Street, San Francisco, CA 94102'
                    }
                });
            }
        } catch (e) {
            console.error('Error fetching beneficiary profile:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEdit = () => {
        setEditName(profile.name);
        setEditPhone(profile.contact.phone);
        setEditEmail(profile.contact.email);
        setEditAddress(profile.contact.address);
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                const response = await fetch(`${API_URL}/beneficiary/profile/me`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: editName,
                        phone: editPhone,
                        email: editEmail,
                        address: editAddress
                    })
                });

                const result = await response.json();
                if (result.success) {
                    // Update local storage name
                    const userDataStr = await AsyncStorage.getItem('userData');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        userData.name = editName;
                        await AsyncStorage.setItem('userData', JSON.stringify(userData));
                    }
                }
            }

            setProfile(prev => ({
                ...prev,
                name: editName,
                contact: {
                    phone: editPhone,
                    email: editEmail,
                    address: editAddress
                }
            }));
            setEditModalVisible(false);
        } catch (e) {
            console.error('Save Profile Error:', e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#FF6F00" />
                <Text style={styles.loadingText}>Retrieving profile information...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Gradient Header Banner */}
                <View style={styles.gradientHeader}>
                    {/* Top Action Row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Feather name="arrow-left" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <TouchableOpacity onPress={handleOpenEdit} style={styles.headerBtn}>
                            <Feather name="edit-2" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar Wrap */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarFrame}>
                            <Image
                                source={require('../../../assets/images/group4.png')}
                                style={styles.largeAvatar}
                            />
                            <TouchableOpacity style={styles.pencilBadge} activeOpacity={0.8} onPress={handleOpenEdit}>
                                <Feather name="edit-3" size={14} color="#FF6F00" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        <Text style={styles.profileAge}>{profile.age} years old • {profile.gender}</Text>
                    </View>
                </View>

                {/* Overlapping Stats Deck */}
                <View style={styles.statsDeck}>
                    {/* Stat Card 1: Blood Group */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FFF5F5' }]}>
                            <AntDesign name="heart" size={16} color="#EF4444" />
                        </View>
                        <Text style={styles.statLabel}>Blood Type</Text>
                        <Text style={styles.statValue}>{profile.bloodGroup}</Text>
                    </View>

                    {/* Stat Card 2: Allergies */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F59E0B" />
                        </View>
                        <Text style={styles.statLabel}>Allergies</Text>
                        <Text style={styles.statValue}>{profile.allergiesCount}</Text>
                    </View>

                    {/* Stat Card 3: Conditions */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FDF2F8' }]}>
                            <MaterialCommunityIcons name="heart-flash" size={18} color="#EC4899" />
                        </View>
                        <Text style={styles.statLabel}>Conditions</Text>
                        <Text style={styles.statValue}>{profile.conditionsCount}</Text>
                    </View>
                </View>

                <View style={styles.innerContent}>
                    {/* Contact Information Panel */}
                    <View style={styles.panel}>
                        <View style={styles.panelHeaderRow}>
                            <Text style={styles.panelTitle}>Contact Information</Text>
                            <TouchableOpacity onPress={handleOpenEdit}>
                                <Text style={styles.editLink}>Edit</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="phone" size={16} color="#6B7280" style={styles.contactIcon} />
                            <View style={styles.contactTextCol}>
                                <Text style={styles.contactLabel}>Phone</Text>
                                <Text style={styles.contactValue}>{profile.contact.phone}</Text>
                            </View>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="mail" size={16} color="#6B7280" style={styles.contactIcon} />
                            <View style={styles.contactTextCol}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>{profile.contact.email}</Text>
                            </View>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="map-pin" size={16} color="#6B7280" style={styles.contactIcon} />
                            <View style={styles.contactTextCol}>
                                <Text style={styles.contactLabel}>Address</Text>
                                <Text style={styles.contactValue}>{profile.contact.address}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Sub-Pages Navigation panel */}
                    <View style={styles.panel}>
                        {/* Health Information */}
                        <TouchableOpacity
                            style={styles.navRow}
                            onPress={() => router.push('/(beneficiary)/profile/health-info')}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.navIconWrap, { backgroundColor: '#FFF2F2' }]}>
                                <Ionicons name="heart-outline" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Health Information</Text>
                                <Text style={styles.navDesc}>Allergies, conditions, blood type</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View style={styles.navDivider} />

                        {/* Emergency Contacts */}
                        <TouchableOpacity
                            style={styles.navRow}
                            onPress={() => router.push('/(beneficiary)/profile/emergency-contacts')}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.navIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                <MaterialCommunityIcons name="phone-alert-outline" size={20} color="#F97316" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Emergency Contacts</Text>
                                <Text style={styles.navDesc}>Primary & secondary contacts</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View style={styles.navDivider} />

                        {/* Notifications */}
                        <TouchableOpacity
                            style={styles.navRow}
                            onPress={() => router.push('/(beneficiary)/profile/notifications')}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.navIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Notifications</Text>
                                <Text style={styles.navDesc}>Manage your alerts & preferences</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View style={styles.navDivider} />

                        {/* Settings placeholder */}
                        <View style={styles.navRow}>
                            <View style={[styles.navIconWrap, { backgroundColor: '#F3F4F6' }]}>
                                <Feather name="settings" size={18} color="#4B5563" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Settings</Text>
                                <Text style={styles.navDesc}>Accessibility & preferences</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </View>
                    </View>

                    {/* Logout Trigger */}
                    <TouchableOpacity
                        style={styles.logoutCard}
                        onPress={logoutWithConfirm}
                        activeOpacity={0.8}
                    >
                        <Feather name="log-out" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: Platform.OS === 'ios' ? 140 : 100 }} />
            </ScrollView>

            {/* Quick Contact Editor Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile Information</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Feather name="x" size={22} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Margaret Williams"
                            />

                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editPhone}
                                onChangeText={setEditPhone}
                                keyboardType="phone-pad"
                                placeholder="+1 (555) 987-6543"
                            />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                keyboardType="email-address"
                                placeholder="margaret.williams@email.com"
                                autoCapitalize="none"
                            />

                            <Text style={styles.inputLabel}>Residential Address</Text>
                            <TextInput
                                style={[styles.textInput, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
                                value={editAddress}
                                onChangeText={setEditAddress}
                                multiline={true}
                                placeholder="123 Maple Street, San Francisco, CA 94102"
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={handleSaveProfile}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                        </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
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
    gradientHeader: {
        backgroundColor: '#FF6F00',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Outfit-Bold',
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatarFrame: {
        position: 'relative',
        marginBottom: 12,
    },
    largeAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    pencilBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Outfit-Bold',
        marginBottom: 4,
    },
    profileAge: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Outfit-Regular',
    },
    statsDeck: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: -25,
        marginBottom: 16,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        width: '30%',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontFamily: 'Outfit-Medium',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    innerContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
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
    panelTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    editLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6F00',
        fontFamily: 'Outfit-SemiBold',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    contactIcon: {
        marginRight: 14,
        width: 18,
    },
    contactTextCol: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'Outfit-Medium',
        marginBottom: 1,
    },
    contactValue: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'Outfit-Regular',
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    navIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    navTextCol: {
        flex: 1,
    },
    navTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 2,
    },
    navDesc: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
    },
    navDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 10,
    },
    logoutCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    inputLabel: {
        fontSize: 13,
        color: '#4B5563',
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
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: 'Outfit-Regular',
        backgroundColor: '#F9FAFB',
        color: '#1F2937',
    },
    saveBtn: {
        backgroundColor: '#FF6F00',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
});
