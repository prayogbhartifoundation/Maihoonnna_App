import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

type Visit = {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    companionName: string;
    type: string;
    status: string;
};

export default function ScheduleScreen() {
    const router = useRouter();
    const [upcomingVisits, setUpcomingVisits] = useState<Visit[]>([]);
    const [pastVisits, setPastVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await AsyncStorage.getItem('userToken');
            const userStr = await AsyncStorage.getItem('userData');

            if (!token || !userStr) {
                // High-fidelity fallback for offline or preview states
                setUpcomingVisits([
                    {
                        id: 'mock-1',
                        title: 'Regular Check-up',
                        date: 'Thursday, February 26',
                        time: '11:00 AM',
                        duration: '2 hours',
                        companionName: 'Dr. Sarah Johnson',
                        type: 'Home Visit',
                        status: 'scheduled',
                    },
                    {
                        id: 'mock-2',
                        title: 'Health Assessment',
                        date: 'Thursday, March 5',
                        time: '3:00 PM',
                        duration: '1.5 hours',
                        companionName: 'Mark Thompson',
                        type: 'Home Visit',
                        status: 'scheduled',
                    }
                ]);
                setPastVisits([
                    {
                        id: 'mock-3',
                        title: 'Regular Check-up',
                        date: 'Feb 10',
                        time: '10:00 AM',
                        duration: '1 hour',
                        companionName: 'Dr. Sarah Johnson',
                        type: 'Home Visit',
                        status: 'completed',
                    },
                    {
                        id: 'mock-4',
                        title: 'Medication Review',
                        date: 'Feb 17',
                        time: '12:30 PM',
                        duration: '1 hour',
                        companionName: 'Mark Thompson',
                        type: 'Home Visit',
                        status: 'completed',
                    }
                ]);
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            const beneficiaryId = user.id;

            const response = await fetch(`${API_URL}/beneficiary/${beneficiaryId}/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setUpcomingVisits(data.data.upcoming || []);
                setPastVisits(data.data.past || []);
            } else {
                setError(data.message || 'Failed to fetch schedules');
            }
        } catch (e: any) {
            console.error('Fetch Visits Error:', e);
            setError('An error occurred while loading your schedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top Navigation Bar */}
            <View style={styles.navBar}>
                <Text style={styles.navBarTitle}>Visit Schedule</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.loaderText}>Loading schedule...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Feather name="alert-triangle" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchVisits}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    
                    {/* Upcoming Visits Section */}
                    <Text style={styles.sectionHeader}>Upcoming Visits</Text>
                    {upcomingVisits.length > 0 ? (
                        upcomingVisits.map(visit => (
                            <View key={visit.id} style={styles.card}>
                                {/* Upcoming green badge */}
                                <View style={styles.badgeUpcoming}>
                                    <Text style={styles.badgeUpcomingText}>Upcoming</Text>
                                </View>

                                {/* Visit Title */}
                                <Text style={styles.visitTitle}>{visit.title}</Text>

                                {/* Icon-based Details */}
                                <View style={styles.detailsContainer}>
                                    <View style={styles.detailRow}>
                                        <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.date}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Feather name="clock" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.time} ({visit.duration})</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Feather name="user" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.companionName}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Feather name="map-pin" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.type}</Text>
                                    </View>
                                </View>

                                {/* Request Change Action Button */}
                                <TouchableOpacity style={styles.requestButton}>
                                    <Text style={styles.requestButtonText}>Request Change</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="calendar" size={40} color="#9CA3AF" />
                            <Text style={styles.emptySubtitle}>No upcoming visits scheduled.</Text>
                        </View>
                    )}

                    {/* Past Visits Section */}
                    <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Past Visits</Text>
                    {pastVisits.length > 0 ? (
                        pastVisits.map(visit => (
                            <TouchableOpacity 
                                key={visit.id} 
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => router.push({
                                    pathname: '/(beneficiary)/interactions',
                                    params: { visitId: visit.id }
                                })}
                            >
                                {/* Completed gray badge */}
                                <View style={styles.badgeCompleted}>
                                    <Text style={styles.badgeCompletedText}>Completed</Text>
                                </View>

                                {/* Visit Title */}
                                <Text style={styles.visitTitle}>{visit.title}</Text>

                                {/* Icon-based Details */}
                                <View style={styles.detailsContainer}>
                                    <View style={styles.detailRow}>
                                        <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.date}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Feather name="user" size={16} color="#6B7280" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{visit.companionName}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="clock" size={40} color="#9CA3AF" />
                            <Text style={styles.emptySubtitle}>No past visits logged.</Text>
                        </View>
                    )}

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5ED' },
    navBar: {
        height: 56,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: { elevation: 2 },
            web: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }
        })
    },
    navBarTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    content: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        fontFamily: 'Outfit-Bold',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
            },
            android: { elevation: 3 },
            web: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 10,
            }
        })
    },
    badgeUpcoming: {
        alignSelf: 'flex-start',
        backgroundColor: '#DEF7EC',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 12,
    },
    badgeUpcomingText: {
        fontSize: 13,
        color: '#03543F',
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
    badgeCompleted: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 12,
    },
    badgeCompletedText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
    visitTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
        marginBottom: 12,
    },
    detailsContainer: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 20,
        marginRight: 8,
    },
    detailText: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'Outfit-Regular',
    },
    requestButton: {
        borderWidth: 1.5,
        borderColor: '#FF6B00',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 18,
    },
    requestButtonText: {
        color: '#FF6B00',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Outfit-Bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loaderText: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'Outfit-Medium',
        marginTop: 12,
    },
    errorText: {
        fontSize: 15,
        color: '#EF4444',
        textAlign: 'center',
        fontFamily: 'Outfit-Medium',
        marginTop: 12,
    },
    retryButton: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Outfit-Bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        fontFamily: 'Outfit-Regular',
        marginTop: 8,
    },
});
