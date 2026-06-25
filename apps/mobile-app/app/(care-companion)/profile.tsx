import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ProfilePhotoUploader } from '@/components/ui/ProfilePhotoUploader';
import { CompanionBackButton } from '../../components/care-companion/CompanionBackButton';
import { useLogoutWithConfirm } from '@/utils/logout';
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
const LIGHT_BEIGE = '#FAF3EB';

import { API_URL } from '@/constants/api';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
const API_BASE_URL = API_URL;

// ðŸš€ PREMIUM REANIMATED TOGGLE COMPONENT
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
    const { push, replace, pop } = useNavigationStack();
    useAndroidBackHandler();
    const handleSafeBack = () => {
        if (router.canGoBack()) {
            pop();
        } else {
            replace('/(care-companion)');
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

    // ðŸš€ ZERO-TOUCH AUTO-FALLBACK FETCH
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchProfileData = async () => {
                setLoading(true);
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    if (!token) {
                        replace('/(auth)');
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

    const logoutWithConfirm = useLogoutWithConfirm();
    const { width } = useWindowDimensions();

    if (!fontsLoaded || loading || !profileData) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DEEP_ORANGE} />
                <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', marginTop: 12 }}>Loading profile...</Text>
            </View>
        );
    }
    const contentWidth = Math.min(Math.max(width - 40, 0), 440);

    const responsiveContentStyle = {
        width: contentWidth,
        alignSelf: 'center' as const,
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.deepOrangeHeader}>
                    <View style={[styles.headerRow, responsiveContentStyle]}>
                        <CompanionBackButton style={styles.backButton} />
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headerTitle}>Profile</Text>
                            <Text style={styles.headerSub}>Manage your account</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.contentArea, responsiveContentStyle]}>
                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={[styles.card, styles.identityCard]}>
                        <View style={styles.avatarWrapper}>
                            <ProfilePhotoUploader
                                config={{
                                    targetType: 'self',
                                    currentPhotoUrl: profileData.photo || null,
                                    size: 96,
                                    editable: true,
                                    initials: profileData.initials || 'CC',
                                    accentColor: '#EF4444',
                                    onSuccess: (url) => setProfileData((prev: any) => ({ ...prev, photo: url })),
                                }}
                            />
                        </View>

                        <Text style={styles.profileName}>{profileData.name}</Text>
                        <Text style={styles.profileRole}>{profileData.role}</Text>

                        {profileData.verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="shield-checkmark-outline" size={16} color="#16A34A" />
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.infoList}>
                            <View style={styles.infoRow}>
                                <Ionicons name="mail-outline" size={16} color="#333333" />
                                <Text style={styles.infoText}>{profileData.email}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="call-outline" size={16} color="#333333" />
                                <Text style={styles.infoText}>{profileData.phone}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={16} color="#333333" />
                                <Text style={styles.infoText}>{profileData.location}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={16} color="#333333" />
                                <Text style={styles.infoText}>Member since {profileData.memberSince}</Text>
                            </View>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="notifications-outline" size={20} color="#111827" />
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
                        <View style={[styles.switchRow, styles.lastRow]}>
                            <Text style={styles.switchLabel}>Geofence Alerts</Text>
                            <CustomToggle value={toggles.geofence} onValueChange={v => setToggles({ ...toggles, geofence: v })} />
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="settings-outline" size={20} color="#111827" />
                            <Text style={styles.cardSectionTitle}>Settings</Text>
                        </View>

                        <TouchableOpacity style={styles.settingsButton} activeOpacity={0.75}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="person-outline" size={16} color="#0A0A0A" />
                                <Text style={styles.settingsText}>Edit Profile</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingsButton} activeOpacity={0.75}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="shield-outline" size={16} color="#0A0A0A" />
                                <Text style={styles.settingsText}>Privacy & Security</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.settingsButton} activeOpacity={0.75}>
                            <View style={styles.settingsRowLeft}>
                                <Ionicons name="options-outline" size={16} color="#0A0A0A" />
                                <Text style={styles.settingsText}>App Preferences</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.card}>
                        <Text style={styles.impactTitle}>Your Impact</Text>
                        <View style={styles.impactGrid}>
                            <View style={styles.impactBox}>
                                <Text style={styles.impactNumber}>{profileData.impact.visits}</Text>
                                <Text style={styles.impactLabel}>Total Visits</Text>
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

                    <TouchableOpacity style={styles.logoutBtn} onPress={logoutWithConfirm} activeOpacity={0.75}>
                        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            <CompanionBottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BEIGE },
    scrollContent: { flexGrow: 1 },

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
        backgroundColor: DEEP_ORANGE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
    },
    headerTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#FFFFFF',
        fontSize: 20,
        lineHeight: 28,
    },
    headerSub: {
        fontFamily: 'Poppins_400Regular',
        color: '#DBEAFE',
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.9,
    },

    contentArea: {
        paddingHorizontal: 0,
        paddingTop: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    identityCard: {
        alignItems: 'center',
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    profileName: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 20,
        lineHeight: 28,
        color: '#000000',
        textAlign: 'center',
    },
    profileRole: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
        textAlign: 'center',
        marginTop: 2,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    verifiedText: {
        fontFamily: 'Poppins_500Medium',
        color: '#16A34A',
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 6,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        width: '100%',
        marginVertical: 24,
    },
    infoList: {
        width: '100%',
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        gap: 12,
    },
    infoText: {
        flex: 1,
        minWidth: 0,
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },

    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    cardSectionTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#000000',
        marginLeft: 8,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    lastRow: {
        marginBottom: 0,
    },
    switchLabel: {
        flex: 1,
        minWidth: 0,
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A0A0A',
    },

    settingsButton: {
        height: 40,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsText: {
        flex: 1,
        minWidth: 0,
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A0A0A',
        marginLeft: 12,
    },

    impactTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#000000',
        marginBottom: 24,
    },
    impactGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    impactBox: {
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    impactNumber: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 24,
        lineHeight: 32,
        color: DEEP_ORANGE,
        textAlign: 'center',
    },
    impactLabel: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        lineHeight: 16,
        color: '#333333',
        textAlign: 'center',
        marginTop: 4,
    },

    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        marginBottom: 20,
    },
    logoutText: {
        fontFamily: 'Poppins_600SemiBold',
        color: '#DC2626',
        fontSize: 16,
        marginLeft: 8,
    },
    bottomSpacer: {
        height: 100,
    },
});


