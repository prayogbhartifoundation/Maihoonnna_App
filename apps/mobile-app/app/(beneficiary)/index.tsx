import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ImageBackground,
    Platform,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/constants/api';
import { ConnectContactButton } from '@/components/shared/ConnectContactModal';
import NotificationBell from '@/components/shared/NotificationBell';
import { useExitOnBack } from '@/hooks/useExitOnBack';

const MOCK_BENEFICIARY_ID = '8340d860-2641-479c-b26a-8b9a71bcec29';

const headerPattern =
    'https://www.figma.com/api/mcp/asset/f148e029-aa29-4b67-96a9-94d739e89bb9';

interface DashboardData {
    greeting: string;
    firstName: string;
    emotionalScore: number;
    nextVisit: string | null;
    adherence: string;
    careCoordinator: {
        id: string;
        name: string;
        role: string;
        bio: string;
        photo: string | null;
        phone?: string | null;
    } | null;
    subscription?: {
        packageName: string;
        hoursTotal: number;
        hoursUsed: number;
        remainingHours: number;
    } | null;
    todaysMedications: Array<{
        id: string;
        name: string;
        dosage: string;
        condition: string;
        time: string;
        completed: boolean;
        adherenceScore: number;
    }>;
}

export default function BeneficiaryDashboard() {
    const { width } = useWindowDimensions();
    const MAX_CONTENT_WIDTH = 440;
    const BASE_HORIZONTAL_PADDING = 16;
    const contentWidth = Math.min(Math.max(width - BASE_HORIZONTAL_PADDING * 2, 0), MAX_CONTENT_WIDTH);
    const responsiveContentStyle = { width: contentWidth, alignSelf: 'center' as const };
    useExitOnBack();
    const {
        data,
        isLoading: loading,
    } = useQuery({
        queryKey: ['beneficiaryDashboardInfo', MOCK_BENEFICIARY_ID],
        queryFn: async () => {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('userToken'),
            ]);

            if (!storedUser || !storedToken) {
                // Auth missing — root layout will redirect automatically.
                throw new Error('Auth missing');
            }

            const response = await fetch(`${API_URL}/beneficiary/dashboard/dashboard/me`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Backend error');
            }

            const res = await response.json();
            if (res.success) {
                return res.data;
            }

            throw new Error('API returned false success');
        },
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FE6700" />
            </View>
        );
    }

    const displayData: DashboardData = data || {
        greeting: 'Good Morning',
        firstName: 'User',
        emotionalScore: 8,
        nextVisit: 'Feb 27',
        adherence: '95%',
        careCoordinator: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            role: 'Primary Care Coordinator',
            bio: 'Board-certified nurse practitioner with 15+ years of experience in geriatric care.',
            photo: null,
            phone: '+91 98765 43210',
        },
        todaysMedications: [
            {
                id: '1',
                name: 'Lisinopril',
                dosage: '10mg',
                condition: 'Blood Pressure',
                time: '08:00 AM',
                completed: false,
                adherenceScore: 95,
            },
            {
                id: '2',
                name: 'Metformin',
                dosage: '500mg',
                condition: 'Diabetes',
                time: '08:00 AM',
                completed: false,
                adherenceScore: 92,
            },
        ],
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not Scheduled';

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <ScrollView
            style={styles.container}
            bounces={false}
            showsVerticalScrollIndicator={false}
        >
            <ImageBackground
                source={{ uri: headerPattern }}
                style={styles.headerBackground}
                resizeMode="cover"
            >
                <SafeAreaView edges={['top']}>
                    <View style={[styles.headerContent, responsiveContentStyle]}>
                        <View>
                            <Text style={styles.greetingTitle}>{displayData.greeting}</Text>
                            <Text style={styles.greetingSubtitle}>
                                How are you feeling today?
                            </Text>
                        </View>

                        <View style={styles.notificationWrapper}>
                            <NotificationBell />
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.emergencyBtn, responsiveContentStyle]} activeOpacity={0.85}>
                        <Feather name="alert-circle" size={28} color="#FFFFFF" />
                        <Text style={styles.emergencyText}>Emergency Support</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </ImageBackground>

            <View style={[styles.mainContent, responsiveContentStyle]}>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="calendar" size={20} color="#2563FF" />
                        </View>

                        <Text style={styles.statLabel}>Next Visit</Text>
                        <Text style={styles.statValue}>
                            {formatDate(displayData.nextVisit)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Feather name="trending-up" size={20} color="#16A34A" />
                        </View>

                        <Text style={styles.statLabel}>Adherence</Text>
                        <Text style={styles.statValue}>{displayData.adherence}</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Care Coordinator</Text>
                    <TouchableOpacity onPress={() => router.push('/(beneficiary)/team')}>
                        <Text style={styles.linkText}>View Team</Text>
                    </TouchableOpacity>
                </View>

                {displayData.careCoordinator && (
                    <View style={styles.card}>
                        <View style={styles.ccHeader}>
                            <View style={styles.ccAvatar}>
                                {displayData.careCoordinator.photo ? (
                                    <Image
                                        source={{ uri: displayData.careCoordinator.photo }}
                                        style={styles.ccImage}
                                    />
                                ) : (
                                    <AntDesign name="user" size={30} color="#AAAAAA" />
                                )}
                            </View>

                            <View style={styles.ccInfo}>
                                <Text style={styles.ccName}>
                                    {displayData.careCoordinator.name}
                                </Text>
                                <Text style={styles.ccRole}>
                                    {displayData.careCoordinator.role}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.ccBio} numberOfLines={2}>
                            {displayData.careCoordinator.bio}
                        </Text>

                        <ConnectContactButton
                            name={displayData.careCoordinator.name}
                            role={displayData.careCoordinator.role}
                            phone={displayData.careCoordinator.phone || null}
                            photo={displayData.careCoordinator.photo}
                            trigger={
                                <View style={styles.primaryBtn}>
                                    <Text style={styles.primaryBtnText}>Call Now</Text>
                                </View>
                            }
                        />
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Medications</Text>
                    <TouchableOpacity onPress={() => router.push('/(beneficiary)/meds' as any)}>
                        <Text style={styles.linkText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {displayData.todaysMedications.slice(0, 2).map((med) => (
                    <View key={med.id} style={styles.medCard}>
                        <View style={styles.medIconBadge}>
                            <MaterialCommunityIcons name="pill" size={24} color="#2563FF" />
                        </View>

                        <View style={styles.medInfo}>
                            <Text style={styles.medName}>
                                {med.name} - {med.dosage}
                            </Text>
                            <Text style={styles.medCondition}>{med.condition}</Text>

                            <View style={styles.medFooter}>
                                <Text style={styles.medTime}>{med.time}</Text>
                                <View style={styles.adherenceBadge}>
                                    <Text style={styles.adherenceBadgeText}>
                                        {med.adherenceScore}% adherence
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(beneficiary)/request-service' as any)}
                    >
                        <View style={[styles.actionIconBadge, { backgroundColor: '#F3E8FF' }]}>
                            <Feather name="calendar" size={24} color="#9810FA" />
                        </View>
                        <Text style={styles.actionTitle}>Book Appointment</Text>
                        <Text style={styles.actionSubtitle}>Schedule visit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/(beneficiary)/vitals' as any)}
                    >
                        <View style={[styles.actionIconBadge, { backgroundColor: '#FFEDD4' }]}>
                            <Ionicons name="pulse-outline" size={24} color="#FF6900" />
                        </View>
                        <Text style={styles.actionTitle}>Vitals</Text>
                        <Text style={styles.actionSubtitle}>Track health</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Feather name="calendar" size={24} color="#00A63E" />
                        </View>
                        <Text style={styles.actionTitle}>Events</Text>
                        <Text style={styles.actionSubtitle}>Join activities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#FCE7F3' }]}>
                            <Feather name="alert-circle" size={24} color="#E60076" />
                        </View>
                        <Text style={styles.actionTitle}>Saathi</Text>
                        <Text style={styles.actionSubtitle}>Find volunteers</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: Platform.OS === 'ios' ? 112 : 96 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF0E6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E6',
    },

    headerBackground: {
        minHeight: 260,
        paddingBottom: 40,
        paddingHorizontal: 0,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        overflow: 'hidden',
    },
    headerContent: {
        marginTop: 34,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greetingTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 24,
        lineHeight: 32,
        color: '#000000',
    },
    greetingSubtitle: {
        marginTop: 0,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    notificationWrapper: {
        width: 40,
        height: 40,
        marginTop: 0,
        borderRadius: 999,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyBtn: {
        height: 60,
        marginHorizontal: 0,
        marginTop: 18,
        borderRadius: 16,
        backgroundColor: '#E7000B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 7.5,
        elevation: 8,
    },
    emergencyText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        lineHeight: 28,
        color: '#FFFFFF',
    },

    mainContent: {
        paddingHorizontal: 0,
        marginTop: -40,
    },

    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        height: 124,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    statIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        marginTop: 12,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        lineHeight: 16,
        color: '#333333',
    },
    statValue: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },

    sectionHeader: {
        height: 28,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        lineHeight: 28,
        color: '#000000',
    },
    linkText: {
        paddingTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#FE6700',
    },

    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingTop: 16,
        paddingBottom: 12,
        marginBottom: 22,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    ccHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ccAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    ccImage: {
        width: '100%',
        height: '100%',
    },
    ccInfo: {
        flex: 1,
    },
    ccName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        lineHeight: 27,
        color: '#000000',
    },
    ccRole: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#4A5565',
    },
    ccBio: {
        marginTop: 12,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },
    primaryBtn: {
        height: 44,
        marginTop: 10,
        marginHorizontal: 18,
        borderRadius: 10,
        backgroundColor: '#FE6700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },

    medCard: {
        minHeight: 115,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        gap: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    medIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    medInfo: {
        flex: 1,
    },
    medName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        lineHeight: 27,
        color: '#000000',
    },
    medCondition: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },
    medFooter: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    medTime: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
    },
    adherenceBadge: {
        height: 24,
        borderRadius: 999,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    adherenceBadgeText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        lineHeight: 16,
        color: '#16A34A',
    },

    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48.3%',
        height: 132,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    actionIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        marginTop: 12,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    actionSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        lineHeight: 16,
        color: '#333333',
    },
});