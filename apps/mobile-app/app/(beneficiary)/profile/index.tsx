import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { useLogoutWithConfirm } from '@/utils/logout';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const safeBack = useSafeBack();
    const logoutWithConfirm = useLogoutWithConfirm();
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
        switch (enumVal) {
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
                <ActivityIndicator size="large" color="#FE6700" />
                <Text style={styles.loadingText}>Retrieving profile information...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#FFF0E6' }}>
            <SafeAreaView style={{ flex: 0, backgroundColor: '#FE6700' }} edges={['top']} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Gradient Header Banner (Figma Match) */}
                <View style={styles.gradientHeader}>
                    {/* Top Action Row */}
                    <View style={styles.topRow}>
                        <TouchableOpacity onPress={() => safeBack()} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Feather name="arrow-left" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                        {/* Preserved developer feature */}
                        <TouchableOpacity onPress={handleOpenEdit} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Feather name="edit-2" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar Wrap */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarFrame}>
                            <Image
                                source={require('../../../assets/images/group4.png')}
                                style={styles.largeAvatar}
                                defaultSource={require('../../../assets/images/group4.png')}
                            />
                            <TouchableOpacity style={styles.pencilBadge} activeOpacity={0.8} onPress={handleOpenEdit}>
                                <Feather name="edit-2" size={14} color="#FE6700" />
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
                        <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
                            <AntDesign name="heart" size={18} color="#EF4444" />
                        </View>
                        <Text style={styles.statLabel}>Blood Type</Text>
                        <Text style={styles.statValue}>{profile.bloodGroup}</Text>
                    </View>

                    {/* Stat Card 2: Allergies */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                            <Feather name="alert-circle" size={18} color="#F97316" />
                        </View>
                        <Text style={styles.statLabel}>Allergies</Text>
                        <Text style={styles.statValue}>{profile.allergiesCount}</Text>
                    </View>

                    {/* Stat Card 3: Conditions */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: '#FDF2F8' }]}>
                            <Ionicons name="heart-outline" size={20} color="#A855F7" />
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
                            {/* Preserved developer feature */}
                            <TouchableOpacity onPress={handleOpenEdit}>
                                <Text style={styles.editLink}>Edit</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="phone" size={18} color="#6B7280" style={styles.contactIcon} />
                            <View style={styles.contactTextCol}>
                                <Text style={styles.contactLabel}>Phone</Text>
                                <Text style={styles.contactValue}>{profile.contact.phone}</Text>
                            </View>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="mail" size={18} color="#6B7280" style={styles.contactIcon} />
                            <View style={styles.contactTextCol}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>{profile.contact.email}</Text>
                            </View>
                        </View>

                        <View style={styles.contactRow}>
                            <Feather name="map-pin" size={18} color="#6B7280" style={styles.contactIcon} />
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
                            <View style={[styles.navIconWrap, { backgroundColor: '#FEF2F2' }]}>
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
                                <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#F97316" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Emergency Contacts</Text>
                                <Text style={styles.navDesc}>2 contacts</Text>
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
                                <Text style={styles.navDesc}>Manage your preferences</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>

                        <View style={styles.navDivider} />

                        {/* Settings */}
                        {/* Settings */}
                        <TouchableOpacity
                            style={styles.navRow}
                            onPress={() => router.push('/(beneficiary)/profile/settings')}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.navIconWrap, { backgroundColor: '#F3F4F6' }]}>
                                <Feather name="settings" size={18} color="#6B7280" />
                            </View>
                            <View style={styles.navTextCol}>
                                <Text style={styles.navTitle}>Settings</Text>
                                <Text style={styles.navDesc}>Accessibility & preferences</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Logout Trigger */}
                    <TouchableOpacity
                        style={styles.logoutCard}
                        onPress={logoutWithConfirm}
                        activeOpacity={0.8}
                    >
                        <Feather name="log-out" size={18} color="#DC2626" style={{ marginRight: 10 }} />
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
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Feather name="x" size={22} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
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
                                style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
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
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FE6700', // Matches the header visually
    },
    scrollContent: {
        flexGrow: 1,
        backgroundColor: '#FFF0E6', // Figma Peach background for the main body
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E6',
    },
    loadingText: {
        marginTop: 12,
        color: '#4B5563',
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
    },
    gradientHeader: {
        backgroundColor: '#FE6700', // Figma Orange
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        paddingBottom: 60, // Extra padding to allow stats cards to overlap
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        color: '#FFFFFF',
        fontFamily: 'Poppins-Medium',
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatarFrame: {
        position: 'relative',
        marginBottom: 16,
    },
    largeAvatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
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
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileName: {
        fontSize: 22,
        color: '#FFFFFF',
        fontFamily: 'Poppins-Medium',
        marginBottom: 2,
    },
    profileAge: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Poppins-Regular',
    },
    statsDeck: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: -35, // This causes the overlap seen in Figma
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        width: '31%', // Slight adjustment for even spacing
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 15,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    innerContent: {
        paddingHorizontal: 20,
    },
    panel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000000',
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
        marginBottom: 20,
    },
    panelTitle: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    editLink: {
        fontSize: 14,
        color: '#FE6700',
        fontFamily: 'Poppins-Medium',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    contactIcon: {
        marginRight: 16,
        marginTop: 2,
    },
    contactTextCol: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'Poppins-Regular',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 15,
        color: '#374151',
        fontFamily: 'Poppins-Regular',
        lineHeight: 22,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    navIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    navTextCol: {
        flex: 1,
    },
    navTitle: {
        fontSize: 16,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        marginBottom: 2,
    },
    navDesc: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Poppins-Regular',
    },
    navDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    logoutCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        color: '#DC2626', // Deep red
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000000',
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
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    inputLabel: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'Poppins-Medium',
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        fontFamily: 'Poppins-Regular',
        backgroundColor: '#F9FAFB',
        color: '#111827',
    },
    saveBtn: {
        backgroundColor: '#FE6700',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: Platform.OS === 'ios' ? 20 : 0, // Avoid bottom bar on iOS
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
});