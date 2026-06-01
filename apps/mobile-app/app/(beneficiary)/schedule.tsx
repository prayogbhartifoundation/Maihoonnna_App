import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

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
                setError('User session not found. Please log in again.');
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
                    <ActivityIndicator size="large" color="#FE6700" />
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
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

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
                                <TouchableOpacity style={styles.requestButton} activeOpacity={0.7}>
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
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    navBar: {
        height: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    navBarTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    content: {
        backgroundColor: '#FFF0E6', // <-- Corrected exactly to your hex code
        flexGrow: 1,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    sectionHeader: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    badgeUpcoming: {
        alignSelf: 'flex-start',
        backgroundColor: '#E6F7EB',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 16,
    },
    badgeUpcomingText: {
        fontSize: 13,
        color: '#10B981',
        fontFamily: 'Poppins-Medium',
    },
    badgeCompleted: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 16,
    },
    badgeCompletedText: {
        fontSize: 13,
        color: '#4B5563',
        fontFamily: 'Poppins-Medium',
    },
    visitTitle: {
        fontSize: 17,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        marginBottom: 12,
    },
    detailsContainer: {
        gap: 8,
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
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'Poppins-Regular',
    },
    requestButton: {
        borderWidth: 1,
        borderColor: '#FE6700',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    requestButtonText: {
        color: '#FE6700',
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFF0E6', // <-- Corrected here as well
    },
    loaderText: {
        fontSize: 15,
        color: '#6B7280',
        fontFamily: 'Poppins-Medium',
        marginTop: 12,
    },
    errorText: {
        fontSize: 15,
        color: '#EF4444',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        marginTop: 12,
    },
    retryButton: {
        backgroundColor: '#FE6700',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        marginTop: 8,
    },
});