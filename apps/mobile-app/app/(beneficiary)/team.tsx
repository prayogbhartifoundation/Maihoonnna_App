import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ConnectContactButton } from '@/components/shared/ConnectContactModal';

import { API_URL } from '@/constants/api';

type TeamMember = {
    id: string;
    level: string;
    name: string;
    role: string;
    bio: string;
    photo: string | null;
    phone: string | null;
};

export default function CareTeamScreen() {
    const router = useRouter();
    const [loggingCall, setLoggingCall] = useState<string | null>(null);

    const { 
        data: team = [], 
        isLoading: loading, 
        isError, 
        error 
    } = useQuery({
        queryKey: ['beneficiaryTeam'],
        queryFn: async () => {
            const token = await AsyncStorage.getItem('userToken');
            const userStr = await AsyncStorage.getItem('userData');

            if (!token || !userStr) {
                throw new Error('Session expired or unauthorized. Please sign in again.');
            }

            const user = JSON.parse(userStr);
            const beneficiaryId = user.id;

            const response = await fetch(`${API_URL}/beneficiary/${beneficiaryId}/team`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                return data.data as TeamMember[];
            } else {
                throw new Error(data.message || 'Failed to fetch team details');
            }
        }
    });

    const handleCall = async (member: TeamMember) => {
        try {
            setLoggingCall(member.id);

            const token = await AsyncStorage.getItem('userToken');
            const userStr = await AsyncStorage.getItem('userData');

            if (token && userStr) {
                const user = JSON.parse(userStr);
                const beneficiaryId = user.id;

                await fetch(`${API_URL}/beneficiary/log-call`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        callerId: beneficiaryId,
                        receiverId: member.id
                    })
                }).catch(e => console.error("Call Log Error:", e));
            }

            const phoneNumber = member.phone || '0000000000';
            Linking.openURL(`tel:${phoneNumber}`);

        } catch (e) {
            console.error("Handle Call Error", e);
        } finally {
            setLoggingCall(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FE6700" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Care Team</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Error State */}
            {isError && (
                <View style={styles.emptyCard}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                    <Text style={styles.errorText}>
                        {error instanceof Error ? error.message : 'Unable to load care team details. Please check your network connection.'}
                    </Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/(beneficiary)' as any)}>
                        <Text style={styles.retryBtnText}>Return to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            )}

                {!isError && team.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>No care team members assigned to this beneficiary yet.</Text>
                    </View>
                )}

                {team.map((member) => {
                    const isPrimary = member.level === 'Primary';

                    return (
                        <View key={member.id} style={styles.card}>

                            {/* Conditional Badge Rendering */}
                            <View style={[
                                styles.badgeContainer,
                                isPrimary ? styles.badgeOrange : styles.badgeGrey
                            ]}>
                                <Text style={[
                                    styles.badgeText,
                                    isPrimary ? styles.badgeTextOrange : styles.badgeTextGrey
                                ]}>
                                    {member.level}
                                </Text>
                            </View>

                            <View style={styles.profileRow}>
                                <View style={styles.avatar}>
                                    {member.photo ? (
                                        <Image source={{ uri: member.photo }} style={styles.avatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={30} color="#9CA3AF" />
                                    )}
                                </View>

                                <View style={styles.profileInfo}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberRole}>{member.role}</Text>
                                </View>
                            </View>

                            <Text style={styles.memberBio}>{member.bio}</Text>

                            {/* FIX: Full Width Action Area */}
                            <View style={styles.actionArea}>
                                <View style={styles.buttonWrapper}>
                                    <ConnectContactButton
                                        name={member.name}
                                        role={member.role}
                                        phone={member.phone}
                                        photo={member.photo}
                                        trigger={
                                            <View style={styles.callButton}>
                                                <Ionicons name="call" size={18} color="#FFFFFF" />
                                                <Text style={styles.callButtonText}>Call</Text>
                                            </View>
                                        }
                                    />
                                </View>
                            </View>

                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF5ED',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFF5ED',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    badgeContainer: {
        alignSelf: 'flex-start',
        height: 24,
        borderRadius: 999,
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 16,
    },
    badgeOrange: {
        backgroundColor: '#FFF0E6', // Light Orange
    },
    badgeGrey: {
        backgroundColor: '#F3F4F6', // Light Grey
    },
    badgeText: {
        color: '#F97316',
        fontSize: 12,
        lineHeight: 16,
    },
    badgeTextOrange: {
        color: '#FE6700',
    },
    badgeTextGrey: {
        color: '#4B5563',
    },

    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    memberRole: {
        fontSize: 14,
        color: '#6B7280',
    },
    memberBio: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 20,
    },

    // --- FIX: Action Button Styles ---
    actionArea: {
        width: '100%',
        marginTop: 4,
    },
    buttonWrapper: {
        width: '100%',
    },
    callButton: {
        width: '100%',
        height: 48, // Slightly taller for a better tap target
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FE6700',
    },
    callButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: '#FFFFFF',
        marginLeft: 8, // Using margin to separate text and icon evenly
    },

    // --- Error & Empty States ---
    errorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    retryBtn: {
        backgroundColor: '#F97316',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});