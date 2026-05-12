import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ProfilePhotoUploader } from '@/components/ui/ProfilePhotoUploader';
import { CompanionBackButton } from '../../components/care-companion/CompanionBackButton';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    interpolateColor,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';

// Fonts & Colors
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { CompanionBottomNav } from '../../components/care-companion/CompanionBottomNav';

const DEEP_ORANGE = '#FE6700';
const VIBRANT_ORANGE = '#FF8C42';
const LIGHT_BEIGE = '#FAF3EB';

import { API_URL } from '@/constants/api';
const API_BASE_URL = API_URL;

// 🚀 PREMIUM REANIMATED TOGGLE COMPONENT
const CustomToggle = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => {
    const isOn = useSharedValue(value ? 1 : 0);

    React.useEffect(() => {
        isOn.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 120 });
    }, [value]);

    const trackStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            isOn.value,
            [0, 1],
            ['#D1D5DB', DEEP_ORANGE]
        );
        return { backgroundColor };
    });

    const thumbStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: isOn.value * 20 }]
        };
    });

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <Animated.View style={[styles.toggleTrack, trackStyle]}>
                <Animated.View style={[styles.toggleThumb, thumbStyle]} />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function ProfileScreen() {
    const router = useRouter();
    const handleSafeBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(care-companion)');
        }
    };
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);

    // Toggle States
    const [toggles, setToggles] = useState({
        reminders: true,
        celebrations: true,
        training: false,
        geofence: true
    });

    let [fontsLoaded] = useFonts({
        Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
    });

    // 🚀 ZERO-TOUCH AUTO-FALLBACK FETCH
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchProfileData = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    if (!token) {
                        router.replace('/(auth)');
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/care-companion/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error("Backend offline");

                    const json = await response.json();
                    if (isActive) setProfileData(json.data || json);
                } catch (error) {
                    console.log("Backend not detected or error. Loading Mock Profile UI...", error);
                    if (isActive) {
                        setProfileData({
                            name: "Sarah Chen",
                            initials: "SC",
                            role: "Care Companion",
                            verified: true,
                            email: "sarah.chen@carecompanion.com",
                            phone: "+1 (555) 123-4567",
                            location: "San Francisco, CA",
                            memberSince: "Jan 2026",
                            impact: { visits: 87, hours: 156, clients: 12 }
                        });
                    }
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            if (fontsLoaded) fetchProfileData();
            return () => { isActive = false; };
        }, [fontsLoaded])
    );

    const handleLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(auth)' as any);
    };

    if (!fontsLoaded || loading || !profileData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DEEP_ORANGE} />
                <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', marginTop: 12 }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Added Stack.Screen to hide default header */}
            <Stack.Screen options={{ headerShown: false }} />
            
            <ScrollView bounces={true} contentContainerStyle={styles.scrollContent}>

                {/* Gradient Header */}
                <LinearGradient
                    colors={[DEEP_ORANGE, VIBRANT_ORANGE]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.deepOrangeHeader}
                >
                    <View style={styles.headerRow}>
                        <CompanionBackButton style={styles.backButton} />
                        <View>
                            <Text style={styles.headerTitle}>Profile</Text>
                            <Text style={styles.headerSub}>Manage your account</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    {/* Identity Card */}
                    <Animated.View 
                        entering={FadeInUp.delay(200).duration(600)}
                        style={[styles.card, styles.identityCard]}
                    >
                        {/* Profile Photo Uploader */}
                        <View style={styles.avatarWrapper}>
                            <ProfilePhotoUploader
                                config={{
                                    targetType: 'self',
                                    currentPhotoUrl: profileData.photo || null,
                                    size: 90,
                                    editable: true,
                                    initials: profileData.initials || 'CC',
                                    accentColor: DEEP_ORANGE,
                                    onSuccess: (url) => setProfileData((prev: any) => ({ ...prev, photo: url })),
                                }}
                            />
                        </View>

                        <Text style={styles.profileName}>{profileData.name}</Text>
                        <Text style={styles.profileRole}>{profileData.role}</Text>

                        {profileData.verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                                <Text style={styles.verifiedText}>Verified Professional</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="mail-outline" size={18} color={DEEP_ORANGE} />
                            </View>
                            <Text style={styles.infoText}>{profileData.email}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="call-outline" size={18} color={DEEP_ORANGE} />
                            </View>
                            <Text style={styles.infoText}>{profileData.phone}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="location-outline" size={18} color={DEEP_ORANGE} />
                            </View>
                            <Text style={styles.infoText}>{profileData.location}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="calendar-outline" size={18} color={DEEP_ORANGE} />
                            </View>
                            <Text style={styles.infoText}>Member since {profileData.memberSince}</Text>
                        </View>
                    </Animated.View>

                    {/* Notifications Card */}
                    <Animated.View 
                        entering={FadeInUp.delay(400).duration(600)}
                        style={styles.card}
                    >
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                                <Ionicons name="notifications-outline" size={20} color="#111827" />
                            </View>
                            <Text style={styles.cardSectionTitle}>Notifications</Text>
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Visit Reminders</Text>
                            <CustomToggle value={toggles.reminders} onValueChange={v => setToggles({ ...toggles, reminders: v })} />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Celebration Alerts</Text>
                            <CustomToggle value={toggles.celebrations} onValueChange={v => setToggles({ ...toggles, celebrations: v })} />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.switchLabel}>Training Updates</Text>
                            <CustomToggle value={toggles.training} onValueChange={v => setToggles({ ...toggles, training: v })} />
                        </View>
                    </Animated.View>

                    {/* Your Impact */}
                    <Animated.View 
                        entering={FadeInUp.delay(600).duration(600)}
                        style={styles.card}
                    >
                        <Text style={[styles.cardSectionTitle, { marginLeft: 0, marginBottom: 20 }]}>Your Impact</Text>
                        <View style={styles.impactGrid}>
                            <View style={styles.impactBox}>
                                <Text style={styles.impactNumber}>{profileData.impact.visits}</Text>
                                <Text style={styles.impactLabel}>Visits</Text>
                            </View>
                            <View style={styles.impactBox}>
                                <Text style={styles.impactNumber}>{profileData.impact.hours}</Text>
                                <Text style={styles.impactLabel}>Hours</Text>
                            </View>
                            <View style={styles.impactBox}>
                                <Text style={styles.impactNumber}>{profileData.impact.clients}</Text>
                                <Text style={styles.impactLabel}>Clients</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Settings Links */}
                    <Animated.View 
                        entering={FadeInUp.delay(800).duration(600)}
                        style={styles.card}
                    >
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.iconCircle, { backgroundColor: '#F3F4F6' }]}>
                                <Ionicons name="settings-outline" size={20} color="#111827" />
                            </View>
                            <Text style={styles.cardSectionTitle}>Settings</Text>
                        </View>

                        <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="person-outline" size={20} color="#4B5563" />
                                <Text style={styles.settingsText}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="shield-outline" size={20} color="#4B5563" />
                                <Text style={styles.settingsText}>Privacy & Security</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.settingsRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]} activeOpacity={0.7}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="options-outline" size={20} color="#4B5563" />
                                <Text style={styles.settingsText}>App Preferences</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Logout */}
                    <TouchableOpacity 
                        style={styles.logoutBtn} 
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <CompanionBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BEIGE },
    scrollContent: { flexGrow: 1 },

    // --- Custom Toggle Styles ---
    toggleTrack: {
        width: 44,
        height: 24,
        borderRadius: 15,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 2,
    },

    deepOrangeHeader: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 16 },
    headerTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 22, lineHeight: 30 },
    headerSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 13, opacity: 0.9, marginTop: -2 },

    contentArea: { paddingHorizontal: 20 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },

    identityCard: {
        marginTop: -30,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginTop: -45,
        marginBottom: 16,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#FFFFFF',
        fontSize: 32,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },

    profileName: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, color: '#111827' },
    profileRole: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#4B5563', marginTop: 2 },

    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    verifiedText: { fontFamily: 'Poppins_500Medium', color: '#10B981', fontSize: 12, marginLeft: 6 },

    divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginVertical: 20 },

    infoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151' },

    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    cardSectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: '#111827', marginLeft: 12 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    switchLabel: { fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#374151' },

    impactGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    impactBox: { alignItems: 'center', flex: 1 },
    impactNumber: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: DEEP_ORANGE },
    impactLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginTop: 4 },

    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    settingsText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 15,
        color: '#374151',
        marginLeft: 12
    },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        marginBottom: 20
    },
    logoutText: { fontFamily: 'Poppins_600SemiBold', color: '#DC2626', fontSize: 16, marginLeft: 8 },
});
