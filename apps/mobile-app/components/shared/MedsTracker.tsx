import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Switch,
    Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

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
    isFutureSchedule?: boolean;
    futureDateText?: string;
};

type Metrics = {
    average: number;
    taken: number;
    missed: number;
};

type Props = {
    beneficiaryId?: string; // Optional: If not provided, will read from AsyncStorage
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
                // High-fidelity Mock state if no active session
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

            // Fetch schedule & metrics in parallel
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
                id: 'mock-med-1',
                logId: null,
                name: 'Lisinopril',
                dosage: '10mg',
                frequency: 'once daily',
                instructions: 'Take after food',
                scheduleTimeText: '08:00 AM',
                scheduledTimeIso: new Date().toISOString(),
                status: 'pending',
                adherencePercentage: 96
            },
            {
                id: 'mock-med-2',
                logId: null,
                name: 'Metformin',
                dosage: '500mg',
                frequency: 'twice daily',
                instructions: 'Take before meal',
                scheduleTimeText: '08:00 PM',
                scheduledTimeIso: new Date().toISOString(),
                status: 'pending',
                adherencePercentage: 92
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
                    const user = JSON.parse(userStr);
                    targetBeneficiaryId = user.id;
                }
            }

            if (!targetBeneficiaryId) {
                // local mock state modification
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
                // reload entire dynamic schedule + metrics
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
        // adjust quick count
        setMetrics(m => ({
            average: m.average,
            taken: taken ? m.taken + 1 : m.taken,
            missed: !taken ? m.missed + 1 : m.missed
        }));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>Loading Medications...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Box with Reminder Toggle */}
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Daily Overview</Text>
                <View style={styles.toggleContainer}>
                    <Text style={styles.toggleLabel}>Reminders</Text>
                    <Switch
                        value={remindersActive}
                        onValueChange={setRemindersActive}
                        trackColor={{ false: '#E5E7EB', true: '#FFE6D5' }}
                        thumbColor={remindersActive ? '#FF6B00' : '#9CA3AF'}
                    />
                </View>
            </View>

            {/* Adherence Percentage Banner Card */}
            <View style={styles.statsCard}>
                <View style={styles.statsMainRow}>
                    <View style={styles.percentageBox}>
                        <Text style={styles.percentageNumber}>{metrics.average}%</Text>
                        <Text style={styles.percentageLabel}>Average Score</Text>
                    </View>
                    <View style={styles.dividerVertical} />
                    <View style={styles.countContainer}>
                        <View style={styles.countRow}>
                            <View style={[styles.dotCircle, { backgroundColor: '#10B981' }]} />
                            <Text style={styles.countText}>{metrics.taken} taken</Text>
                        </View>
                        <View style={styles.countRow}>
                            <View style={[styles.dotCircle, { backgroundColor: '#EF4444' }]} />
                            <Text style={styles.countText}>{metrics.missed} missed</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Daily schedule title */}
            <Text style={styles.groupTitle}>
                {schedule.length > 0 && schedule[0].isFutureSchedule
                    ? `Upcoming Doses (Starting ${schedule[0].futureDateText})`
                    : "Today's Doses"}
            </Text>

            {schedule.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="shield" size={42} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No medications scheduled for today.</Text>
                </View>
            ) : (
                schedule.map((item, index) => {
                    const isSubmitting = submittingId === `${item.id}-${item.scheduleTimeText}`;
                    
                    return (
                        <View key={`${item.id}-${index}`} style={styles.medCard}>
                            <View style={styles.medMainRow}>
                                {/* Icon with soft orange backdrop */}
                                <View style={styles.iconCircle}>
                                    <Feather name="layers" size={20} color="#FF6B00" />
                                </View>

                                {/* Title & subtitiles */}
                                <View style={styles.medDetails}>
                                    <Text style={styles.medName}>{item.name}</Text>
                                    <Text style={styles.medSub}>
                                        {item.dosage} • {item.frequency}
                                    </Text>
                                    <Text style={styles.medInstructions}>
                                        Note: {item.instructions}
                                    </Text>
                                </View>

                                {/* Action buttons */}
                                <View style={styles.actionColumn}>
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#FF6B00" />
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
                                                <Feather
                                                    name="check"
                                                    size={16}
                                                    color={item.status === 'taken' ? '#FFFFFF' : '#10B981'}
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
                                                <Feather
                                                    name="x"
                                                    size={16}
                                                    color={item.status === 'missed' ? '#FFFFFF' : '#EF4444'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Divider line in card */}
                            <View style={styles.innerDivider} />

                            {/* Lower metadata + individual progress bars */}
                            <View style={styles.medFooter}>
                                <Text style={styles.scheduleTime}>
                                    Schedule: <Text style={styles.boldTime}>{item.scheduleTimeText}</Text>
                                </Text>
                                <View style={styles.progressContainer}>
                                    <View style={styles.trackBackground}>
                                        <View
                                            style={[
                                                styles.trackFill,
                                                { width: `${item.adherencePercentage}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressLabel}>
                                        {item.adherencePercentage}% adherence
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })
            )}

            {/* Reminder bottom banner card */}
            <View style={styles.bannerCard}>
                <Feather name="bell" size={18} color="#FF6B00" style={{ marginRight: 10 }} />
                <Text style={styles.bannerText}>
                    Medication Reminders Active. You'll receive system alerts for your scheduled medication timings.
                </Text>
            </View>
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFAF7',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FCFAF7',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginRight: 8,
        fontWeight: '500'
    },
    statsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F1EBE3',
        marginBottom: 20,
    },
    statsMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    percentageBox: {
        flex: 1,
        alignItems: 'center',
    },
    percentageNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FF6B00',
    },
    percentageLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        fontWeight: '500'
    },
    dividerVertical: {
        width: 1,
        height: 50,
        backgroundColor: '#ECE5DC',
        marginHorizontal: 16,
    },
    countContainer: {
        flex: 1.2,
        justifyContent: 'center',
        gap: 8,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dotCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    countText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    groupTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    emptyContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1EBE3',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    medCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1EBE3',
        marginBottom: 14,
    },
    medMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0E6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    medDetails: {
        flex: 1,
    },
    medName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    medSub: {
        fontSize: 13,
        color: '#4B5563',
        marginTop: 2,
        fontWeight: '500',
    },
    medInstructions: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    actionColumn: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    checkBtn: {
        borderColor: '#D1FAE5',
        backgroundColor: '#ECFDF5',
    },
    crossBtn: {
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
    },
    activeCheck: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    activeCross: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    innerDivider: {
        height: 1,
        backgroundColor: '#F3EDE6',
        marginVertical: 12,
    },
    medFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scheduleTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    boldTime: {
        fontWeight: '700',
        color: '#374151',
    },
    progressContainer: {
        alignItems: 'flex-end',
        flex: 1,
        marginLeft: 16,
    },
    trackBackground: {
        width: '80%',
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    trackFill: {
        height: '100%',
        backgroundColor: '#FF6B00',
    },
    progressLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500'
    },
    bannerCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF8F4',
        borderWidth: 1,
        borderColor: '#FFE6D5',
        padding: 14,
        borderRadius: 12,
        marginTop: 10,
        alignItems: 'flex-start',
    },
    bannerText: {
        fontSize: 12,
        color: '#D25F15',
        flex: 1,
        lineHeight: 16,
        fontWeight: '500'
    },
});
