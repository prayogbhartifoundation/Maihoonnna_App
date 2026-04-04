import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggingCall, setLoggingCall] = useState<string | null>(null); // Track ID of member being called

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userStr = await AsyncStorage.getItem('user');

            // Fallback for UI demo when backend is offline
            if (!token || !userStr) {
                setTeam([
                    {
                        id: 'mock-1',
                        level: 'Primary',
                        name: 'Dr. Sarah Johnson',
                        role: 'Primary Care Coordinator',
                        bio: 'Board-certified nurse practitioner with 15+ years of experience in geriatric care. Specialized in chronic disease management and patient education.',
                        photo: null,
                        phone: '1234567890'
                    },
                    {
                        id: 'mock-2',
                        level: 'Secondary',
                        name: 'Mark Thompson',
                        role: 'Secondary Care Coordinator',
                        bio: 'Registered nurse with expertise in home healthcare coordination. Passionate about improving quality of life for seniors.',
                        photo: null,
                        phone: '0987654321'
                    },
                    {
                        id: 'mock-3',
                        level: 'Field Manager',
                        name: 'Emily Chen',
                        role: 'Field Manager',
                        bio: 'Healthcare operations manager overseeing care delivery in the region. Available for escalations and support.',
                        photo: null,
                        phone: '5555555555'
                    }
                ]);
                setLoading(false);
                return;
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
                setTeam(data.data);
            } else {
                setError(data.message || 'Failed to fetch team');
            }
        } catch (e: any) {
            console.error('Fetch Team Error:', e);
            // Fallback
            setTeam([
                {
                    id: 'mock-1',
                    level: 'Primary',
                    name: 'Dr. Sarah Johnson',
                    role: 'Primary Care Coordinator',
                    bio: 'Board-certified nurse practitioner with 15+ years of experience in geriatric care. Specialized in chronic disease management and patient education.',
                    photo: null,
                    phone: '1234567890'
                },
                {
                    id: 'mock-2',
                    level: 'Secondary',
                    name: 'Mark Thompson',
                    role: 'Secondary Care Coordinator',
                    bio: 'Registered nurse with expertise in home healthcare coordination. Passionate about improving quality of life for seniors.',
                    photo: null,
                    phone: '0987654321'
                },
                {
                    id: 'mock-3',
                    level: 'Field Manager',
                    name: 'Emily Chen',
                    role: 'Field Manager',
                    bio: 'Healthcare operations manager overseeing care delivery in the region. Available for escalations and support.',
                    photo: null,
                    phone: '5555555555'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = async (member: TeamMember) => {
        try {
            setLoggingCall(member.id);

            // 1. Try to get caller info
            const token = await AsyncStorage.getItem('userToken');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                const user = JSON.parse(userStr);
                const beneficiaryId = user.id;

                // 2. Log call to backend
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

            // 3. Initiate native phone call
            const phoneNumber = member.phone || '0000000000'; // Default if none
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
                <ActivityIndicator size="large" color="#F97316" />
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
                <View style={{ width: 40 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {team.map((member) => (
                    <View key={member.id} style={styles.card}>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{member.level}</Text>
                        </View>

                        <View style={styles.profileRow}>
                            <View style={styles.avatar}>
                                {member.photo ? (
                                    <Image source={{ uri: member.photo }} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="person" size={32} color="#9CA3AF" />
                                )}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberRole}>{member.role}</Text>
                            </View>
                        </View>

                        <Text style={styles.memberBio}>{member.bio}</Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.callButton]}
                                onPress={() => handleCall(member)}
                                disabled={loggingCall === member.id}
                            >
                                {loggingCall === member.id ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                                        <Text style={styles.callButtonText}>Call</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionButton, styles.emailButton]}>
                                <Ionicons name="mail-outline" size={18} color="#4B5563" />
                                <Text style={styles.emailButtonText}>Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
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
        backgroundColor: '#FFEED9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    badgeText: {
        color: '#F97316',
        fontSize: 12,
        fontWeight: '500',
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    callButton: {
        backgroundColor: '#F97316',
    },
    callButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emailButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emailButtonText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
    },
});
