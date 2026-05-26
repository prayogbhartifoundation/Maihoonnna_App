import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Platform, Modal, TextInput
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { useSafeBack } from '@/hooks/useSafeBack';

// --- PIXEL PERFECT CUSTOM SVGS ---
const CustomPulseIcon = ({ size = 22, color = '#EF4444' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CustomHeartIcon = ({ size = 22, color = '#EC4899' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CustomThermometerIcon = ({ size = 20, color = '#F97316' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const CustomBagIcon = ({ size = 22, color = '#3B82F6' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M3 6h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);
// -------------------------------------------

interface LatestReadings {
    bp: string;
    heartRate: string;
    temperature: string;
    weight: string;
}

interface TrendData {
    labels: string[];
    systolic: number[];
    diastolic: number[];
    heartRate: number[];
    temperature: number[];
    weight: number[];
}

interface HistoryItem {
    date: string;
    bp: string;
    hr: string;
    temp: string;
    weight: string;
}

export default function MedicalRecordsScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();

    // Production state setup (Empty by default)
    const [latest, setLatest] = useState<LatestReadings | null>(null);
    const [trends, setTrends] = useState<TrendData | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddVital, setShowAddVital] = useState(false);

    useEffect(() => {
        fetchMedicalRecords();
    }, []);

    const fetchMedicalRecords = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                setError('Session expired or unauthorized. Please sign in again.');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/medical-records/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success && data.data) {
                setLatest(data.data.latestReadings || null);
                setTrends(data.data.trends || null);
                setHistory(data.data.history || []);
            } else {
                setError(data.message || 'Failed to fetch medical records.');
            }
        } catch (e) {
            console.error('Fetch Medical Records Error:', e);
            setError('Unable to connect to the server. Please check your network connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medical Records</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.centerWrap}>
                    <ActivityIndicator size="large" color="#FE6700" />
                    <Text style={styles.loadingText}>Loading health vitals & records...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerWrap}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchMedicalRecords}>
                        <Text style={styles.retryBtnText}>Retry Fetch</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>Track your vitals</Text>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Latest Readings</Text>
                        <TouchableOpacity style={styles.addBtn} activeOpacity={0.75} onPress={() => setShowAddVital(true)}>
                            <Feather name="plus" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.latestGrid}>
                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                <CustomPulseIcon />
                            </View>
                            <Text style={styles.cardLabel}>Blood Pressure</Text>
                            <Text style={styles.cardValue}>{latest?.bp || '--'}</Text>
                        </View>

                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2F8' }]}>
                                <CustomHeartIcon />
                            </View>
                            <Text style={styles.cardLabel}>Heart Rate</Text>
                            <Text style={styles.cardValue}>{latest?.heartRate || '--'}</Text>
                        </View>

                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                <CustomThermometerIcon />
                            </View>
                            <Text style={styles.cardLabel}>Temperature</Text>
                            <Text style={styles.cardValue}>{latest?.temperature || '--'}</Text>
                        </View>

                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                <CustomBagIcon />
                            </View>
                            <Text style={styles.cardLabel}>Weight</Text>
                            <Text style={styles.cardValue}>{latest?.weight || '--'}</Text>
                        </View>
                    </View>

                    <Text style={styles.trendsTitle}>Trends (Last 5 readings)</Text>

                    {/* Conditional rendering for trends graph */}
                    {!trends || !trends.labels || trends.labels.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyCardText}>Not enough data to display trends.</Text>
                        </View>
                    ) : (
                        <View style={styles.trendsCard}>
                            <Svg width="100%" height={200} viewBox="0 0 360 200">
                                {[0, 35, 70, 105, 140].map((value) => {
                                    const y = 170 - (value / 140) * 150;
                                    return (
                                        <React.Fragment key={`grid-y-${value}`}>
                                            <SvgText x="20" y={y + 4} fontSize="11" fill="#6B7280">
                                                {value}
                                            </SvgText>
                                            <Line x1="50" y1={y} x2="340" y2={y} stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
                                        </React.Fragment>
                                    );
                                })}

                                {trends.labels.map((label, index) => {
                                    const x = 50 + index * 72.5;
                                    return (
                                        <React.Fragment key={`grid-x-${label}`}>
                                            <Line x1={x} y1="20" x2={x} y2="170" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="4 4" />
                                            <SvgText x={x - 15} y="190" fontSize="10" fill="#6B7280">
                                                {label}
                                            </SvgText>
                                        </React.Fragment>
                                    );
                                })}

                                {trends.systolic && trends.systolic.map((value, index) => {
                                    if (index === trends.systolic.length - 1) return null;
                                    const x1 = 50 + index * 72.5;
                                    const y1 = 170 - (value / 140) * 150;
                                    const x2 = 50 + (index + 1) * 72.5;
                                    const y2 = 170 - (trends.systolic[index + 1] / 140) * 150;
                                    return <Line key={`sys-line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#EF4444" strokeWidth="2" />;
                                })}

                                {trends.diastolic && trends.diastolic.map((value, index) => {
                                    if (index === trends.diastolic.length - 1) return null;
                                    const x1 = 50 + index * 72.5;
                                    const y1 = 170 - (value / 140) * 150;
                                    const x2 = 50 + (index + 1) * 72.5;
                                    const y2 = 170 - (trends.diastolic[index + 1] / 140) * 150;
                                    return <Line key={`dia-line-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#EC4899" strokeWidth="2" />;
                                })}

                                {trends.systolic && trends.systolic.map((value, index) => {
                                    const x = 50 + index * 72.5;
                                    const y = 170 - (value / 140) * 150;
                                    return <Circle key={`sys-dot-${index}`} cx={x} cy={y} r="4" fill="#FFFFFF" stroke="#EF4444" strokeWidth="2" />;
                                })}

                                {trends.diastolic && trends.diastolic.map((value, index) => {
                                    const x = 50 + index * 72.5;
                                    const y = 170 - (value / 140) * 150;
                                    return <Circle key={`dia-dot-${index}`} cx={x} cy={y} r="4" fill="#FFFFFF" stroke="#EC4899" strokeWidth="2" />;
                                })}
                            </Svg>
                        </View>
                    )}

                    <Text style={styles.historyTitle}>History</Text>

                    <View style={styles.historyList}>
                        {history.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyCardText}>No vitals history records found.</Text>
                            </View>
                        ) : (
                            history.map((item, idx) => (
                                <View key={idx} style={styles.historyCard}>
                                    <Text style={styles.historyDateText}>{item.date}</Text>

                                    <View style={styles.historyVitalsGrid}>
                                        <Text style={styles.historyVitalLabel}>BP: {item.bp}</Text>
                                        <Text style={styles.historyVitalLabel}>HR: {item.hr}</Text>
                                        <Text style={styles.historyVitalLabel}>Temp: {item.temp}</Text>
                                        <Text style={styles.historyVitalLabel}>Weight: {item.weight}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                    <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} />
                </ScrollView>
            )}

            <Modal visible={showAddVital} transparent animationType="fade" onRequestClose={() => setShowAddVital(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.addVitalModal}>
                        <Text style={styles.modalTitle}>Add Vital Reading</Text>

                        <Text style={styles.inputLabel}>Blood Pressure</Text>
                        <TextInput style={styles.input} placeholder="120/80" placeholderTextColor="#9CA3AF" />

                        <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
                        <TextInput style={styles.input} placeholder="72" placeholderTextColor="#9CA3AF" keyboardType="numeric" />

                        <Text style={styles.inputLabel}>Temperature (°F)</Text>
                        <TextInput style={styles.input} placeholder="98.6" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />

                        <Text style={styles.inputLabel}>Weight (lbs)</Text>
                        <TextInput style={styles.input} placeholder="165" placeholderTextColor="#9CA3AF" keyboardType="numeric" />

                        <TouchableOpacity style={styles.saveReadingBtn} activeOpacity={0.8}>
                            <Text style={styles.saveReadingText}>Save Reading</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddVital(false)} activeOpacity={0.6}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF0E6',
    },
    header: {
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingTop: Platform.OS === 'ios' ? 18 : 0,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSpacer: {
        width: 40,
        height: 40,
    },
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#111827',
        textAlign: 'center',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 96,
    },
    centerWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        color: '#374151',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },
    errorText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    retryBtn: {
        backgroundColor: '#FE6700',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        fontFamily: 'Poppins-Medium',
        color: '#FFFFFF',
        fontSize: 14,
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        lineHeight: 20,
        color: '#111827',
        marginBottom: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#111827',
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FE6700',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FE6700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    latestGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    latestCard: {
        backgroundColor: '#FFFFFF',
        width: '48%',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    cardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 16,
        color: '#4B5563',
    },
    cardValue: {
        marginTop: 4,
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        lineHeight: 20,
        color: '#111827',
    },
    trendsTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#111827',
    },
    trendsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    historyTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#111827',
    },
    historyList: {
        gap: 12,
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    historyDateText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        lineHeight: 20,
        color: '#111827',
        marginBottom: 10,
    },
    historyVitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 8,
    },
    historyVitalLabel: {
        width: '50%',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#4B5563',
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCardText: {
        color: '#9CA3AF',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },

    // --- Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    addVitalModal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: '#111827',
        marginBottom: 20,
    },
    inputLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#111827',
        marginBottom: 16,
    },
    saveReadingBtn: {
        height: 50,
        borderRadius: 12,
        backgroundColor: '#FE6700',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    saveReadingText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#FFFFFF',
    },
    cancelBtn: {
        height: 50,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#6B7280',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    cancelText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        color: '#374151',
    },
});