import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/constants/api';
import { useLogoutWithConfirm } from '@/utils/logout';

// Components
import { ProfileHero } from './components/profile/ProfileHero';
import { PersonalTab } from './components/profile/PersonalTab';
import { SecurityTab } from './components/profile/SecurityTab';
import SubscriptionTab from './components/profile/SubscriptionTab';
import GlobalHeader from './components/shared/GlobalHeader';
import GlobalDrawer from './components/shared/GlobalDrawer';
import { Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'Personal' | 'Security' | 'Subscription';

export default function ProfileScreen() {
    const router = useRouter();
    const logoutWithConfirm = useLogoutWithConfirm();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<TabType>('Personal');
    
    // Drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { width } = Dimensions.get('window');
    const DRAWER_WIDTH = width * 0.75;
    const drawerAnim = React.useRef(new Animated.Value(DRAWER_WIDTH)).current;

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/(auth)');
                return;
            }

            const res = await fetch(`${API_URL}/subscriber/profile`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (data.success) {
                setProfileData(data.data);
            }
        } catch (e) {
            console.error('Profile fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F97316" />
            </SafeAreaView>
        );
    }

    if (!profileData) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Failed to load profile.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <GlobalHeader 
                title="My Profile" 
                onMenuPress={openDrawer} 
                showBack={true} 
            />

            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 36 }}
            >
                {/* Hero section */}
                <ProfileHero
                    user={profileData.user}
                    stats={profileData.stats}
                    onPhotoUpdated={fetchProfile}
                />

                {/* Tabs Selector */}
                <View style={styles.tabsWrapper}>
                    <View style={styles.tabsContainer}>
                        {(['Personal', 'Security', 'Subscription'] as TabType[]).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Ionicons 
                                    name={tab === 'Personal' ? 'person-outline' : tab === 'Security' ? 'lock-closed-outline' : 'ribbon-outline'}
                                    size={17}
                                    color={activeTab === tab ? '#FFF' : '#3A3A3A'}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Tab Content */}
                {activeTab === 'Personal' && <PersonalTab user={profileData.user} onUpdate={fetchProfile} />}
                {activeTab === 'Security' && <SecurityTab />}
                {activeTab === 'Subscription' && <SubscriptionTab plan={profileData.currentPlan} beneficiaries={profileData.beneficiaries} />}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logoutWithConfirm}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            <GlobalDrawer 
                isOpen={drawerOpen} 
                onClose={closeDrawer} 
                drawerAnim={drawerAnim} 
                userData={profileData.user} 
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF2E8' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF2E8' },
    scrollView: { flex: 1 },
    tabsWrapper: { paddingHorizontal: 15, marginTop: 22, marginBottom: 23 },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 5,
        borderWidth: 1,
        borderColor: '#F1DED0',
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
            android: { elevation: 3 }
        })
    },
    tabBtn: {
        flex: 1, flexDirection: 'row',
        minHeight: 46, alignItems: 'center', justifyContent: 'center',
        borderRadius: 13
    },
    tabBtnActive: { backgroundColor: '#FF5B0A' },
    tabText: { fontSize: 15, fontWeight: '500', color: '#4B5563' },
    tabTextActive: { color: '#FFFFFF' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFFFF', marginHorizontal: 15, marginTop: 20,
        minHeight: 55, borderRadius: 15,
        borderWidth: 1, borderColor: '#F2E7DE',
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 2 }
        })
    },
    logoutText: { marginLeft: 10, fontSize: 17, fontWeight: '700', color: '#DC2626' },
    errorText: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
    retryBtn: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryText: { color: '#FFFFFF', fontWeight: '700' }
});
