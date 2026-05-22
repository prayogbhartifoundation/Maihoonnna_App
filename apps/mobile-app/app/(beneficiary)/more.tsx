import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, SafeAreaView, Platform, Image
} from 'react-native';
import { router } from 'expo-router';
import {
    Feather, MaterialCommunityIcons,
    FontAwesome5, Ionicons, AntDesign
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutWithConfirm } from '@/utils/logout';
import { API_URL } from '@/constants/api';

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    iconBg: string;
    onPress: () => void;
}

function MenuItem({ icon, label, iconBg, onPress }: MenuItemProps) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                {icon}
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );
}

export default function MoreOptionsScreen() {
    const [profileName, setProfileName] = useState('Margaret Williams');

    useEffect(() => {
        loadProfileName();
    }, []);

    const loadProfileName = async () => {
        try {
            const userDataStr = await AsyncStorage.getItem('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                if (userData.name) {
                    setProfileName(userData.name);
                }
            }
        } catch (e) {
            console.error('Error loading profile name:', e);
        }
    };

    const menuItems: MenuItemProps[] = [
        {
            icon: <FontAwesome5 name="user-friends" size={18} color="#3B82F6" />,
            label: 'Care Team',
            iconBg: '#EFF6FF',
            onPress: () => router.push('/(beneficiary)/team'),
        },
        {
            icon: <MaterialCommunityIcons name="history" size={20} color="#8B5CF6" />,
            label: 'Interactions',
            iconBg: '#F5F3FF',
            onPress: () => router.push('/(beneficiary)/interactions'),
        },
        {
            icon: <MaterialCommunityIcons name="file-document-outline" size={20} color="#10B981" />,
            label: 'Medical Records',
            iconBg: '#ECFDF5',
            onPress: () => router.push('/(beneficiary)/medical-records'),
        },
        {
            icon: <FontAwesome5 name="stethoscope" size={16} color="#EF4444" />,
            label: 'Appointments',
            iconBg: '#FEF2F2',
            onPress: () => {},
        },
        {
            icon: <Feather name="shopping-cart" size={18} color="#F59E0B" />,
            label: 'Pharmacy',
            iconBg: '#FFFBEB',
            onPress: () => {},
        },
        {
            icon: <Feather name="calendar" size={18} color="#6366F1" />,
            label: 'Community Events',
            iconBg: '#EEF2FF',
            onPress: () => {},
        },
        {
            icon: <Ionicons name="chatbubble-outline" size={18} color="#06B6D4" />,
            label: 'Social Network',
            iconBg: '#ECFEFF',
            onPress: () => {},
        },
        {
            icon: <AntDesign name="heart" size={18} color="#EC4899" />,
            label: 'Saathi Network',
            iconBg: '#FDF2F8',
            onPress: () => {},
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>More Options</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Orange Profile Card at the Top */}
                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={() => router.push('/(beneficiary)/profile')}
                    activeOpacity={0.9}
                >
                    <Image
                        source={require('../../assets/images/group4.png')}
                        style={styles.profileAvatar}
                        defaultSource={require('../../assets/images/group4.png')}
                    />
                    <View style={styles.profileTextWrap}>
                        <Text style={styles.profileName}>{profileName}</Text>
                        <Text style={styles.profileSubtitle}>View & edit profile</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Menu List */}
                <View style={styles.card}>
                    {menuItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <MenuItem {...item} />
                            {index < menuItems.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={logoutWithConfirm}
                    activeOpacity={0.75}
                >
                    <View style={styles.logoutIconWrap}>
                        <Feather name="log-out" size={20} color="#EF4444" />
                    </View>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </ScrollView>
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
    profileCard: {
        backgroundColor: '#FF6F00',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    profileAvatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginRight: 16,
    },
    profileTextWrap: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Outfit-Bold',
        marginBottom: 2,
    },
    profileSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Outfit-Regular',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 4,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        fontFamily: 'Outfit-Medium',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    logoutText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        fontFamily: 'Outfit-SemiBold',
    },
});
