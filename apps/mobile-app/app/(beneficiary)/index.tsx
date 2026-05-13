import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Feather, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

// Temporary Mock ID until Auth Context is provided
const MOCK_BENEFICIARY_ID = "8340d860-2641-479c-b26a-8b9a71bcec29"; // A valid UUID format

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
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [storedUser, storedToken] = await Promise.all([
                AsyncStorage.getItem('userData'),
                AsyncStorage.getItem('userToken')
            ]);

            if (!storedUser) {
                router.replace('/(auth)');
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/dashboard/dashboard/me`, {
                headers: {
                    'Authorization': storedToken ? `Bearer ${storedToken}` : '',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Backend error");
            const res = await response.json();
            if (res.success) {
                setData(res.data);
            }
        } catch (error) {
            console.log("Fetch error. Using fallback data.", error);
            // Fallback for demo
            setData({
                greeting: "Good Morning",
                firstName: "Beneficiary",
                emotionalScore: 8,
                nextVisit: "2026-03-25T10:00:00Z",
                adherence: "95%",
                subscription: {
                    packageName: "Silver Plan",
                    hoursTotal: 20,
                    hoursUsed: 5,
                    remainingHours: 15
                },
                careCoordinator: {
                    id: "1",
                    name: "Dr. Sarah Johnson",
                    role: "Primary Care Coordinator",
                    bio: "Board-certified nurse practitioner with 15+ years of experience in geriatric care.",
                    photo: "https://i.pravatar.cc/150?img=32"
                },
                todaysMedications: [
                    { id: '1', name: 'Lisinopril', dosage: '10mg', condition: 'Blood Pressure', time: '08:00 AM', completed: true, adherenceScore: 95 },
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6A00" />
            </View>
        );
    }

    // Handle case where API fails or ID is invalid - we still need to show the UI structure
    const displayData = data || {
        greeting: "Good Morning",
        firstName: "User",
        emotionalScore: 8,
        nextVisit: "Feb 27",
        adherence: "95%",
        careCoordinator: {
            id: "1",
            name: "Dr. Sarah Johnson",
            role: "Primary Care Coordinator",
            bio: "Board-certified nurse practitioner with 15+ years of experience in geriatric care.",
            photo: null
        },
        todaysMedications: [
            { id: '1', name: 'Lisinopril', dosage: '10mg', condition: 'Blood Pressure', time: '08:00 AM', completed: false, adherenceScore: 95 },
            { id: '2', name: 'Metformin', dosage: '500mg', condition: 'Diabetes', time: '08:00 AM', completed: false, adherenceScore: 92 }
        ]
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not Scheduled";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* Header Section */}
            <View style={styles.headerBackground}>
                {/* Placeholder for the geometric orange background pattern */}
                <LinearGradient
                    colors={['#FDE6D2', '#FFDDC2']}
                    style={StyleSheet.absoluteFillObject}
                />
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greetingTitle}>{displayData.greeting}</Text>
                            <Text style={styles.greetingSubtitle}>How are you feeling today?</Text>
                        </View>
                        <TouchableOpacity style={styles.notificationIcon}>
                            <Feather name="bell" size={24} color="#FF6A00" />
                        </TouchableOpacity>
                    </View>

                    {/* Emergency Button */}
                    <TouchableOpacity style={styles.emergencyBtn}>
                        <Feather name="alert-circle" size={20} color="white" />
                        <Text style={styles.emergencyText}>Emergency Support</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Main Content Area - overlaps header */}
            <View style={styles.mainContent}>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#EBF4FF' }]}>
                            <Feather name="calendar" size={20} color="#4A90E2" />
                        </View>
                        <Text style={styles.statLabel}>Next Visit</Text>
                        <Text style={styles.statValue}>{formatDate(displayData.nextVisit)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBadge, { backgroundColor: '#E6F8ED' }]}>
                            <Feather name="trending-up" size={20} color="#2ECC71" />
                        </View>
                        <Text style={styles.statLabel}>Adherence</Text>
                        <Text style={styles.statValue}>{displayData.adherence}</Text>
                    </View>
                </View>



                {/* Care Coordinator Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Care Coordinator</Text>
                    <TouchableOpacity onPress={() => router.push('/(beneficiary)/team')}><Text style={styles.linkText}>View Team</Text></TouchableOpacity>
                </View>

                {displayData.careCoordinator && (
                    <View style={styles.card}>
                        <View style={styles.ccHeader}>
                            <View style={styles.ccAvatar}>
                                {displayData.careCoordinator.photo ? (
                                    <Image source={{ uri: displayData.careCoordinator.photo }} style={styles.ccImage} />
                                ) : (
                                    <AntDesign name="user" size={32} color="#aaa" />
                                )}
                            </View>
                            <View style={styles.ccInfo}>
                                <Text style={styles.ccName}>{displayData.careCoordinator.name}</Text>
                                <Text style={styles.ccRole}>{displayData.careCoordinator.role}</Text>
                            </View>
                        </View>
                        <Text style={styles.ccBio}>{displayData.careCoordinator.bio}</Text>

                        <TouchableOpacity style={styles.primaryBtn}>
                            <Text style={styles.primaryBtnText}>Call Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Medications Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Medications</Text>
                    <TouchableOpacity onPress={() => router.push('/(beneficiary)/meds' as any)}>
                        <Text style={styles.linkText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {displayData.todaysMedications.map(med => (
                    <View key={med.id} style={styles.medCard}>
                        <View style={styles.medIconBadge}>
                            <MaterialCommunityIcons name="pill" size={24} color="#4A90E2" />
                        </View>
                        <View style={styles.medInfo}>
                            <Text style={styles.medName}>{med.name} - {med.dosage}</Text>
                            <Text style={styles.medCondition}>{med.condition}</Text>
                            <Text style={styles.medTime}>{med.time}</Text>
                        </View>
                        <View style={styles.adherenceBadge}>
                            <Text style={styles.adherenceBadgeText}>{med.adherenceScore}% adherence</Text>
                        </View>
                    </View>
                ))}

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>

                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(beneficiary)/request-service' as any)}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#F3E8FF' }]}>
                            <Feather name="calendar" size={24} color="#9B51E0" />
                        </View>
                        <Text style={styles.actionTitle}>Book Appointment</Text>
                        <Text style={styles.actionSubtitle}>Schedule visit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#FFEDD5' }]}>
                            <MaterialCommunityIcons name="pill" size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionTitle}>Order Meds</Text>
                        <Text style={styles.actionSubtitle}>Refill now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Feather name="calendar" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionTitle}>Events</Text>
                        <Text style={styles.actionSubtitle}>Local events</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.actionIconBadge, { backgroundColor: '#FCE7F3' }]}>
                            <Feather name="alert-circle" size={24} color="#EC4899" />
                        </View>
                        <Text style={styles.actionTitle}>Saathi</Text>
                        <Text style={styles.actionSubtitle}>Companion</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF5ED', // Off-white/cream background matching the design
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAF5ED'
    },
    headerBackground: {
        height: 280, // Extended height for overlap
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        position: 'relative'
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: Platform.OS === 'android' ? 20 : 10,
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'Outfit-Bold'
    },
    greetingSubtitle: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Outfit-Regular',
        marginTop: 4
    },
    notificationIcon: {
        width: 45,
        height: 45,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyBtn: {
        backgroundColor: '#E70000', // Bright emergency red
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 24,
        shadowColor: '#E70000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emergencyText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: 'Outfit-SemiBold'
    },
    mainContent: {
        paddingHorizontal: 20,
        marginTop: -40, // Pulls content up over the header background
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Outfit-Medium',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        fontFamily: 'Outfit-Bold',
    },
    hoursCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    hoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    hoursTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'Outfit-SemiBold'
    },
    hoursSubtitle: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Outfit-Regular'
    },
    hoursGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAF5ED',
        borderRadius: 16,
        padding: 16,
    },
    hourItem: {
        alignItems: 'center',
        flex: 1,
    },
    hourValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
        marginBottom: 4,
    },
    hourLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular'
    },
    hourDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'Outfit-SemiBold'
    },
    linkText: {
        fontSize: 14,
        color: '#FF6A00',
        fontWeight: '600',
        fontFamily: 'Outfit-Medium'
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    ccHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    ccAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden'
    },
    ccImage: {
        width: '100%',
        height: '100%'
    },
    ccInfo: {
        flex: 1
    },
    ccName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 4
    },
    ccRole: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Outfit-Regular'
    },
    ccBio: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 20,
        fontFamily: 'Outfit-Regular'
    },
    primaryBtn: {
        backgroundColor: '#FF6A00',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold'
    },
    medCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    medIconBadge: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    medInfo: {
        flex: 1
    },
    medName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 4
    },
    medCondition: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Outfit-Regular',
        marginBottom: 8
    },
    medTime: {
        fontSize: 13,
        color: '#555',
        fontFamily: 'Outfit-Medium'
    },
    adherenceBadge: {
        backgroundColor: '#E6F8ED',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        position: 'absolute',
        bottom: 16,
        right: 16
    },
    adherenceBadgeText: {
        color: '#2ECC71',
        fontSize: 11,
        fontWeight: '600',
        fontFamily: 'Outfit-Medium'
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        paddingBottom: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        fontFamily: 'Outfit-SemiBold',
        marginBottom: 4
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Outfit-Regular'
    }
});
