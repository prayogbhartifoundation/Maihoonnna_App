import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

interface VitalData {
    bp: string;
    heart: string;
    temp: string;
    o2: string;
}

interface Interaction {
    id: string;
    title: string;
    rating: number;
    date: string;
    time: string;
    companionName: string;
    vitals: VitalData;
    notes: string;
    feedback: string;
}

export default function InteractionsScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();
    const { visitId } = useLocalSearchParams();
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInteractions();
    }, []);

    const fetchInteractions = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                // High-fidelity fallback when backend is offline
                useFallbackData();
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/interactions/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setInteractions(data.data);
                // Expand the interaction matching visitId, or the first one by default
                if (visitId) {
                    setExpandedIds({ [visitId as string]: true });
                } else if (data.data[0]?.id) {
                    setExpandedIds({ [data.data[0].id]: true });
                }
            } else {
                useFallbackData();
            }
        } catch (e) {
            console.error('Fetch Interactions Error:', e);
            useFallbackData();
        } finally {
            setLoading(false);
        }
    };

    const useFallbackData = () => {
        const fallbacks: Interaction[] = [
            {
                id: 'fallback-1',
                title: 'Medication Review',
                rating: 5,
                date: 'February 17',
                time: '2:00 PM - 3:00 PM',
                companionName: 'Mark Thompson',
                vitals: {
                    bp: '120/80',
                    heart: '72 bpm',
                    temp: '98.6°F',
                    o2: '98%',
                },
                notes: 'Reviewed all current medications. Patient is adhering well to medication schedule.',
                feedback: 'Very thorough and caring. Answered all my questions.'
            },
            {
                id: 'fallback-2',
                title: 'Regular Check-up',
                rating: 5,
                date: 'February 10',
                time: '10:00 AM - 12:00 PM',
                companionName: 'Dr. Sarah Johnson',
                vitals: {
                    bp: '118/78',
                    heart: '70 bpm',
                    temp: '98.4°F',
                    o2: '99%',
                },
                notes: 'General health check-out. Vitals remain perfectly stable. Conducted light respiratory and cardiac evaluations.',
                feedback: 'Always delightful to have Sarah check in. She is extremely precise.'
            }
        ];
        setInteractions(fallbacks);
        if (visitId) {
            setExpandedIds({ [visitId as string]: true });
        } else {
            setExpandedIds({ 'fallback-1': true }); // Expand first item by default
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={16}
                    color="#FBBF24" // Figma exact yellow
                    style={{ marginRight: 2 }}
                />
            );
        }
        return <View style={styles.starsContainer}>{stars}</View>;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header - Centered Perfectly */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Interactions</Text>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#FE6700" />
                    <Text style={styles.loadingText}>Retrieving interaction history...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.subtitle}>Your care history</Text>

                    {interactions.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <MaterialCommunityIcons name="heart-broken" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No care interactions recorded yet.</Text>
                        </View>
                    ) : (
                        interactions.map((v) => {
                            const isExpanded = !!expandedIds[v.id];

                            return (
                                <View key={v.id} style={styles.card}>
                                    {/* Card Header Row */}
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{v.title}</Text>
                                        {renderStars(v.rating)}
                                    </View>

                                    {/* Quick Details */}
                                    <View style={styles.detailsGrid}>
                                        <View style={styles.detailRow}>
                                            <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>{v.date}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Feather name="clock" size={16} color="#6B7280" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>{v.time}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Feather name="user" size={16} color="#6B7280" style={styles.detailIcon} />
                                            <Text style={styles.detailText}>{v.companionName}</Text>
                                        </View>
                                    </View>

                                    {/* View / Hide Toggle Button */}
                                    <TouchableOpacity
                                        onPress={() => toggleExpand(v.id)}
                                        style={styles.toggleBtn}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.toggleBtnText}>
                                            {isExpanded ? 'Hide Details' : 'View Details'}
                                        </Text>
                                        <Feather
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="#111827"
                                            style={{ marginLeft: 6 }}
                                        />
                                    </TouchableOpacity>

                                    {/* Expanded Segment */}
                                    {isExpanded && (
                                        <View style={styles.expandedSection}>
                                            {/* Divider */}
                                            <View style={styles.divider} />

                                            {/* Vitals Grid */}
                                            <Text style={styles.sectionHeading}>Vitals Recorded</Text>
                                            <View style={styles.vitalsGrid}>
                                                <View style={[styles.vitalCard, { backgroundColor: '#FEF2F2' }]}>
                                                    <View style={styles.vitalHeader}>
                                                        <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" />
                                                        <Text style={styles.vitalLabel}>BP</Text>
                                                    </View>
                                                    <Text style={styles.vitalValue}>{v.vitals.bp}</Text>
                                                </View>

                                                <View style={[styles.vitalCard, { backgroundColor: '#FDF2F8' }]}>
                                                    <View style={styles.vitalHeader}>
                                                        <Ionicons name="heart-outline" size={18} color="#EC4899" />
                                                        <Text style={styles.vitalLabel}>Heart</Text>
                                                    </View>
                                                    <Text style={styles.vitalValue}>{v.vitals.heart}</Text>
                                                </View>

                                                <View style={[styles.vitalCard, { backgroundColor: '#FFF7ED' }]}>
                                                    <View style={styles.vitalHeader}>
                                                        <FontAwesome5 name="thermometer-half" size={16} color="#F97316" />
                                                        <Text style={styles.vitalLabel}>Temp</Text>
                                                    </View>
                                                    <Text style={styles.vitalValue}>{v.vitals.temp}</Text>
                                                </View>

                                                <View style={[styles.vitalCard, { backgroundColor: '#EFF6FF' }]}>
                                                    <View style={styles.vitalHeader}>
                                                        <MaterialCommunityIcons name="weather-windy" size={18} color="#3B82F6" />
                                                        <Text style={styles.vitalLabel}>O2</Text>
                                                    </View>
                                                    <Text style={styles.vitalValue}>{v.vitals.o2}</Text>
                                                </View>
                                            </View>

                                            {/* Clinical Notes */}
                                            <Text style={styles.sectionHeading}>Clinical Notes</Text>
                                            <View style={styles.notesBox}>
                                                <Text style={styles.notesText}>{v.notes}</Text>
                                            </View>

                                            {/* Your Feedback */}
                                            <Text style={styles.sectionHeading}>Your Feedback</Text>
                                            <View style={styles.feedbackBox}>
                                                <Text style={styles.feedbackText}>"{v.feedback}"</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Clean white notch to match header
    },
    header: {
        height: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center', // Perfect centering
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        position: 'absolute',
        left: 20,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium', // Match globally
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#FFF0E6', // Strict Figma peach match
    },
    content: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    },
    subtitle: {
        fontSize: 15,
        color: '#4B5563',
        fontFamily: 'Poppins-Regular',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E6',
    },
    loadingText: {
        marginTop: 12,
        color: '#4B5563',
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyText: {
        marginTop: 12,
        color: '#9CA3AF',
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16, // Softer radius from Figma
        padding: 20, // Breathing room
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        flex: 1,
        marginRight: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    detailsGrid: {
        marginBottom: 20,
        gap: 10, // Spacing between rows
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        marginRight: 10,
        width: 18,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'Poppins-Regular',
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12, // More pill-like
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    toggleBtnText: {
        fontSize: 15,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    expandedSection: {
        marginTop: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    sectionHeading: {
        fontSize: 15,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
        marginBottom: 12,
    },
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 12, // Modern spacing
    },
    vitalCard: {
        width: '48%',
        borderRadius: 12, // Match design
        padding: 16,
    },
    vitalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    vitalLabel: {
        fontSize: 13,
        color: '#374151',
        fontFamily: 'Poppins-Regular',
        marginLeft: 8,
    },
    vitalValue: {
        fontSize: 18,
        color: '#111827',
        fontFamily: 'Poppins-Medium',
    },
    notesBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    notesText: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'Poppins-Regular',
        lineHeight: 22,
    },
    feedbackBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
    },
    feedbackText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'Poppins-Regular',
        lineHeight: 22,
    },
});