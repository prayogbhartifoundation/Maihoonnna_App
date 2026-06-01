import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Animated, TouchableWithoutFeedback, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
const bellIcon = require('../../assets/icons/bell.png');
const calendarIcon = require('../../assets/icons/calendar.png');

// --- PIXEL PERFECT CUSTOM SVG ICONS ---
const CustomPillIcon = ({ size = 24, color = '#FE6700' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M4.5 12.5l8-8a4.95 4.95 0 017 7l-8 8a4.95 4.95 0 01-7-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8.5 8.5l7 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);


const CustomCheckIcon = ({ size = 18, color = '#16A34A' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CustomCrossIcon = ({ size = 18, color = '#E7000B' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CustomShieldIcon = ({ size = 42, color = '#9CA3AF' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// --- INLINE MICRO CUSTOM SWITCH (32x18.4px) ---
const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (v: boolean) => void }) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 250,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 16], // Micro travel distance
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', '#FE6700'],
    });

    return (
        <TouchableWithoutFeedback onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
                <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};
// ------------------------------------------------

type MedScheduleItem = {
    id: string;
    logId: string | null;
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
    scheduleTimeText: string;
    scheduledTimeIso: string;
    status: 'taken' | 'missed' | 'pending';
    adherencePercentage: number;
};

type Metrics = {
    average: number;
    taken: number;
    missed: number;
};

type Props = {
    beneficiaryId?: string;
};

export default function MedsTracker({ beneficiaryId: propBeneficiaryId }: Props) {
    const [schedule, setSchedule] = useState<MedScheduleItem[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({ average: 100, taken: 0, missed: 0 });
    const [loading, setLoading] = useState(true);
    const [remindersActive, setRemindersActive] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [propBeneficiaryId]);

    const loadData = async () => {
        try {
            setLoading(true);
            let targetBeneficiaryId = propBeneficiaryId;

            if (!targetBeneficiaryId) {
                const userStr = await AsyncStorage.getItem('userData');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    targetBeneficiaryId = user.id;
                }
            }

            if (!targetBeneficiaryId) {
                loadMocks();
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                loadMocks();
                setLoading(false);
                return;
            }

            const [scheduleRes, metricsRes] = await Promise.all([
                fetch(`${API_URL}/shared/medications/beneficiary/${targetBeneficiaryId}/today`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/shared/medications/beneficiary/${targetBeneficiaryId}/metrics`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const scheduleData = await scheduleRes.json();
            const metricsData = await metricsRes.json();

            if (scheduleData.success) {
                setSchedule(scheduleData.data || []);
            }
            if (metricsData.success) {
                setMetrics(metricsData.data || { average: 100, taken: 0, missed: 0 });
            }

        } catch (err) {
            console.error('Failed to load medication data', err);
            loadMocks();
        } finally {
            setLoading(false);
        }
    };

    const loadMocks = () => {
        setMetrics({ average: 95, taken: 87, missed: 5 });
        setSchedule([
            {
                id: '1', logId: null,
                name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily',
                instructions: 'Blood Pressure', scheduleTimeText: '08:00 AM',
                scheduledTimeIso: new Date().toISOString(),
                status: 'pending', adherencePercentage: 95
            },
            {
                id: '2', logId: null,
                name: 'Metformin', dosage: '500mg', frequency: 'Twice daily',
                instructions: 'Diabetes', scheduleTimeText: '08:00 AM, 08:00 PM',
                scheduledTimeIso: new Date().toISOString(),
                status: 'pending', adherencePercentage: 92
            },
            {
                id: '3', logId: null,
                name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily',
                instructions: 'Cholesterol', scheduleTimeText: '08:00 PM',
                scheduledTimeIso: new Date().toISOString(),
                status: 'pending', adherencePercentage: 98
            }
        ]);
    };

    const handleLogAdherence = async (item: MedScheduleItem, taken: boolean) => {
        try {
            setSubmittingId(`${item.id}-${item.scheduleTimeText}`);
            let targetBeneficiaryId = propBeneficiaryId;

            if (!targetBeneficiaryId) {
                const userStr = await AsyncStorage.getItem('userData');
                if (userStr) {
                    targetBeneficiaryId = JSON.parse(userStr).id;
                }
            }

            if (!targetBeneficiaryId) {
                updateLocalStatus(item, taken);
                setSubmittingId(null);
                return;
            }

            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                updateLocalStatus(item, taken);
                setSubmittingId(null);
                return;
            }

            const res = await fetch(`${API_URL}/shared/medications/adherence/log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    beneficiaryId: targetBeneficiaryId,
                    medicationId: item.id,
                    scheduledTimeIso: item.scheduledTimeIso,
                    taken,
                    recordedBy: 'beneficiary'
                })
            });

            const responseData = await res.json();
            if (responseData.success) {
                await loadData();
            } else {
                Alert.alert('Error', responseData.message || 'Failed to update schedule');
            }

        } catch (err) {
            console.error('Failed to log adherence', err);
            updateLocalStatus(item, taken);
        } finally {
            setSubmittingId(null);
        }
    };

    const updateLocalStatus = (item: MedScheduleItem, taken: boolean) => {
        setSchedule(prev => prev.map(s => {
            if (s.id === item.id && s.scheduleTimeText === item.scheduleTimeText) {
                return { ...s, status: taken ? 'taken' : 'missed' };
            }
            return s;
        }));
        setMetrics(m => ({
            average: m.average,
            taken: taken ? m.taken + 1 : m.taken,
            missed: !taken ? m.missed + 1 : m.missed
        }));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FE6700" />
                    <Text style={styles.loadingText}>Loading Medications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* --- NEW WHITE TOP BANNER --- */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Medications</Text>
                <Text style={styles.headerSub}>Today's medication schedule</Text>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Top Row inside Peach Area */}
                <View style={styles.topRow}>
                    <Text style={styles.topTitle}>Medications</Text>
                    <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>Reminders</Text>
                        <CustomSwitch value={remindersActive} onValueChange={setRemindersActive} />
                    </View>
                </View>

                {/* Overall Adherence Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statsHeader}>
                        <Image source={calendarIcon} style={styles.statsIconImage} resizeMode="contain" />
                        <View style={styles.statsTitleBlock}>
                            <Text style={styles.statsTitle}>Overall Adherence</Text>
                            <Text style={styles.statsSubtitle}>Last 30 days</Text>
                        </View>
                    </View>

                    <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{metrics.average}%</Text>
                            <Text style={styles.metricLabel}>Average</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{metrics.taken}</Text>
                            <Text style={styles.metricLabel}>Taken</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricValue}>{metrics.missed}</Text>
                            <Text style={styles.metricLabel}>Missed</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Your Medications</Text>

                {schedule.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <CustomShieldIcon size={42} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No medications scheduled for today.</Text>
                    </View>
                ) : (
                    schedule.map((item, index) => {
                        const isSubmitting = submittingId === `${item.id}-${item.scheduleTimeText}`;

                        return (
                            <View key={`${item.id}-${index}`} style={styles.medCard}>
                                <View style={styles.medMainRow}>
                                    <View style={styles.iconCircle}>
                                        <CustomPillIcon size={24} color="#FE6700" />
                                    </View>

                                    <View style={styles.medDetails}>
                                        <Text style={styles.medName}>{item.name}</Text>
                                        <Text style={styles.medSub}>
                                            {item.dosage} - {item.frequency}
                                        </Text>
                                        <Text style={styles.medInstructions}>
                                            For: {item.instructions}
                                        </Text>
                                    </View>

                                    <View style={styles.actionColumn}>
                                        {isSubmitting ? (
                                            <ActivityIndicator size="small" color="#FE6700" />
                                        ) : (
                                            <View style={styles.btnRow}>
                                                <TouchableOpacity
                                                    onPress={() => handleLogAdherence(item, true)}
                                                    style={[
                                                        styles.actionBtn,
                                                        styles.checkBtn,
                                                        item.status === 'taken' && styles.activeCheck
                                                    ]}
                                                >
                                                    <CustomCheckIcon
                                                        size={18}
                                                        color={item.status === 'taken' ? '#FFFFFF' : '#16A34A'}
                                                    />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => handleLogAdherence(item, false)}
                                                    style={[
                                                        styles.actionBtn,
                                                        styles.crossBtn,
                                                        item.status === 'missed' && styles.activeCross
                                                    ]}
                                                >
                                                    <CustomCrossIcon
                                                        size={18}
                                                        color={item.status === 'missed' ? '#FFFFFF' : '#EF4444'}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.innerDivider} />

                                <View style={styles.medFooter}>
                                    <View style={styles.scheduleRow}>
                                        <Text style={styles.scheduleTime}>
                                            Schedule: {item.scheduleTimeText}
                                        </Text>
                                        <Text style={styles.percentText}>{item.adherencePercentage}%</Text>
                                    </View>

                                    <View style={styles.trackBackground}>
                                        <View
                                            style={[
                                                styles.trackFill,
                                                { width: `${item.adherencePercentage}%` }
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Bottom Reminder Active Card */}
                <View style={styles.bannerCard}>
                    <View style={styles.bannerIconContainer}>
                        <Image source={bellIcon} style={styles.bannerIconImage} resizeMode="contain" />
                    </View>
                    <View style={styles.bannerCopy}>
                        <Text style={styles.bannerTitle}>Medication Reminders Active</Text>
                        <Text style={styles.bannerText}>
                            You'll receive notifications based on your medication schedule. Confirming helps track adherence.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Ensures the notch area remains white
    },
    header: {
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        color: '#111827',
    },
    headerSub: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    // -------------------------
    container: {
        flex: 1,
        backgroundColor: '#FCFAF7',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 96,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF0E6',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#374151',
    },

    // --- Micro Switch Styles ---
    switchTrack: {
        width: 32,
        height: 18.4,
        borderRadius: 10,
        justifyContent: 'center',
    },
    switchThumb: {
        width: 14.4,
        height: 14.4,
        borderRadius: 8,
        position: 'absolute',
        left: 0,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },

    // --- Top Row ---
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 8,
    },
    topTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#111827',
    },
    statsIconImage: {
        width: 32,
        height: 32,
    },
    bannerIconImage: {
        width: 26,
        height: 26,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#374151',
        marginRight: 8,
    },

    // --- Stats Card ---
    statsCard: {
        backgroundColor: '#FE6700',
        borderRadius: 14,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#FE6700',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsTitleBlock: {
        marginLeft: 12,
    },
    statsTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        color: '#FFFFFF',
    },
    statsSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: -2,
    },
    metricsRow: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricValue: {
        fontFamily: 'Poppins-Medium',
        fontSize: 28,
        color: '#FFFFFF',
    },
    metricLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },

    sectionTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#111827',
        marginBottom: 12,
        marginLeft: 4,
    },

    // --- Medication List Cards ---
    medCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    medMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    medDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    medName: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#111827',
    },
    medSub: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    medInstructions: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#4B5563',
        marginTop: 1,
    },

    // --- Action Buttons ---
    actionColumn: {
        marginLeft: 12,
        justifyContent: 'center',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBtn: {
        backgroundColor: '#DCFCE7',
    },
    crossBtn: {
        backgroundColor: '#FEE2E2',
    },
    activeCheck: {
        backgroundColor: '#16A34A',
    },
    activeCross: {
        backgroundColor: '#EF4444',
    },

    innerDivider: {
        height: 0,
        marginVertical: 6,
    },
    medFooter: {
        marginTop: 4,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    scheduleTime: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#374151',
    },
    percentText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: '#111827',
    },
    trackBackground: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    trackFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#16A34A',
    },

    // --- Bottom Bell Banner ---
    bannerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    bannerIconContainer: {
        marginTop: 2,
        marginRight: 14,
    },
    bannerCopy: {
        flex: 1,
    },
    bannerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#111827',
        marginBottom: 4,
    },
    bannerText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },

    emptyContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 40,
        alignItems: 'center',
        marginBottom: 12,
    },
    emptyText: {
        marginTop: 12,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});
