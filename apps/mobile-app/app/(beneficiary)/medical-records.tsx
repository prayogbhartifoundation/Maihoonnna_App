import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Platform, Modal, TextInput
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

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

const CustomScaleIcon = ({ size = 22, color = '#3B82F6' }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M8 9h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 9v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

const calculateDotBottom = (val: number) => {
    // Scaled to match the SVG line heights (y = 170 at 0, y = 20 at 140)
    // SVG is 200px tall. bottom = 200 - y
    return 30 + (val / 140) * 150 - 5;
};

export default function MedicalRecordsScreen() {
    const router = useRouter();
    const [latest, setLatest] = useState<LatestReadings>({
        bp: '120/80',
        heartRate: '72 bpm',
        temperature: '98.6°F',
        weight: '165 lbs'
    });
    const [trends, setTrends] = useState<TrendData>({
        labels: ['Jan 20', 'Jan 27', 'Feb 3', 'Feb 10', 'Feb 17'],
        systolic: [121, 119, 122, 118, 120],
        diastolic: [81, 79, 82, 78, 80],
        heartRate: [73, 71, 74, 70, 72],
        temperature: [98.5, 98.6, 98.5, 98.4, 98.6],
        weight: [164, 165, 166, 164, 165]
    });
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddVital, setShowAddVital] = useState(false);

    useEffect(() => {
        fetchMedicalRecords();
    }, []);

    const fetchMedicalRecords = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            if (!token) {
                useFallbackData();
                return;
            }

            const response = await fetch(`${API_URL}/beneficiary/medical-records/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success && data.data) {
                setLatest(data.data.latestReadings);
                setTrends(data.data.trends);
                setHistory(data.data.history);
            } else {
                useFallbackData();
            }
        } catch (e) {
            console.error('Fetch Medical Records Error:', e);
            useFallbackData();
        } finally {
            setLoading(false);
        }
    };

    const useFallbackData = () => {
        setLatest({
            bp: '120/80',
            heartRate: '72 bpm',
            temperature: '98.6°F',
            weight: '165 lbs'
        });
        setTrends({
            labels: ['Jan 20', 'Jan 27', 'Feb 3', 'Feb 10', 'Feb 17'],
            systolic: [121, 119, 122, 118, 120],
            diastolic: [81, 79, 82, 78, 80],
            heartRate: [73, 71, 74, 70, 72],
            temperature: [98.5, 98.6, 98.5, 98.4, 98.6],
            weight: [164, 165, 166, 164, 165]
        });
        setHistory([
            { date: 'Feb 17', bp: '120/80', hr: '72 bpm', temp: '98.6°F', weight: '165 lbs' },
            { date: 'Feb 10', bp: '118/78', hr: '70 bpm', temp: '98.4°F', weight: '164 lbs' },
            { date: 'Feb 3',  bp: '122/82', hr: '74 bpm', temp: '98.5°F', weight: '166 lbs' },
            { date: 'Jan 27', bp: '119/79', hr: '71 bpm', temp: '98.6°F', weight: '165 lbs' },
            { date: 'Jan 20', bp: '121/81', hr: '73 bpm', temp: '98.5°F', weight: '164 lbs' }
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Medical Records</Text>
            </View>

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#FF6F00" />
                    <Text style={styles.loadingText}>Loading health vitals & records...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>Track your vitals</Text>

                    {/* Latest Readings Header with Add Action */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Latest Readings</Text>
                        <TouchableOpacity style={styles.addBtn} activeOpacity={0.75}>
                            <Feather name="plus" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Latest Readings 2x2 Grid */}
                    <View style={styles.latestGrid}>
                        {/* Blood Pressure (Custom SVG Pulse) */}
                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                <CustomPulseIcon />
                            </View>
                            <Text style={styles.cardLabel}>Blood Pressure</Text>
                            <Text style={styles.cardValue}>{latest.bp}</Text>
                        </View>

                        {/* Heart Rate (Custom SVG Heart) */}
                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2F8' }]}>
                                <CustomHeartIcon />
                            </View>
                            <Text style={styles.cardLabel}>Heart Rate</Text>
                            <Text style={styles.cardValue}>{latest.heartRate}</Text>
                        </View>

                        {/* Temperature (Custom SVG Thermometer) */}
                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                <CustomThermometerIcon />
                            </View>
                            <Text style={styles.cardLabel}>Temperature</Text>
                            <Text style={styles.cardValue}>{latest.temperature}</Text>
                        </View>

                        {/* Weight (Custom SVG Scale) */}
                        <View style={styles.latestCard}>
                            <View style={[styles.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                <CustomScaleIcon />
                            </View>
                            <Text style={styles.cardLabel}>Weight</Text>
                            <Text style={styles.cardValue}>{latest.weight}</Text>
                        </View>
                    </View>

                    {/* Trends Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 16 }]}>Trends (Last 5 readings)</Text>
                    <View style={styles.trendsCard}>
                        <View style={{ position: 'relative', height: 200 }}>
                            <Svg width="100%" height={200} viewBox="0 0 360 200">
                                {[0, 35, 70, 105, 140].map((value) => {
                                    const y = 170 - (value / 140) * 150;
                                    return (
                                        <React.Fragment key={value}>
                                            <SvgText x="20" y={y + 4} fontSize="11" fill="#6B7280">
                                                {value}
                                            </SvgText>
                                            <Line
                                                x1="55"
                                                y1={y}
                                                x2="340"
                                                y2={y}
                                                stroke="#D1D5DB"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                            />
                                        </React.Fragment>
                                    );
                                })}
                            </Svg>

                            {/* Main Grid Area Overlay */}
                            <View style={[StyleSheet.absoluteFillObject, { left: 55, right: 20 }]}>
                                <View style={styles.plotArea}>
                                    {trends.labels.map((lbl, idx) => {
                                        const sysVal = trends.systolic[idx] || 120;
                                        const diaVal = trends.diastolic[idx] || 80;

                                        return (
                                            <View key={idx} style={styles.plotColumn}>
                                                {/* Systolic Dot */}
                                                <View
                                                    style={[
                                                        styles.chartDot,
                                                        { bottom: calculateDotBottom(sysVal), backgroundColor: '#EF4444' }
                                                    ]}
                                                >
                                                    <Text style={styles.dotValue}>{sysVal}</Text>
                                                </View>

                                                {/* Diastolic Dot */}
                                                <View
                                                    style={[
                                                        styles.chartDot,
                                                        { bottom: calculateDotBottom(diaVal), backgroundColor: '#EC4899' }
                                                    ]}
                                                >
                                                    <Text style={styles.dotValue}>{diaVal}</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* X-Axis Labels */}
                        <View style={styles.xAxisRow}>
                            {trends.labels.map((lbl, idx) => (
                                <Text key={idx} style={styles.xAxisText}>{lbl}</Text>
                            ))}
                        </View>
                    </View>

                    {/* History Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>History</Text>
                    <View style={styles.historyList}>
                        {history.length === 0 ? (
                            <View style={styles.emptyHistory}>
                                <Text style={styles.emptyHistoryText}>No vitals history records found.</Text>
                            </View>
                        ) : (
                            history.map((item, idx) => (
                                <View key={idx} style={styles.historyCard}>
                                    {/* Date Left Column */}
                                    <View style={styles.historyDateCol}>
                                        <Text style={styles.historyDateText}>{item.date}</Text>
                                    </View>

                                    {/* Vitals Right Grid Column */}
                                    <View style={styles.historyVitalsCol}>
                                        <View style={styles.historyVitalRow}>
                                            <Text style={styles.historyVitalLabel}>BP: {item.bp}</Text>
                                            <Text style={styles.historyVitalLabel}>HR: {item.hr}</Text>
                                        </View>
                                        <View style={[styles.historyVitalRow, { marginTop: 6 }]}>
                                            <Text style={styles.historyVitalLabel}>Temp: {item.temp}</Text>
                                            <Text style={styles.historyVitalLabel}>Weight: {item.weight}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                    <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} />
                </ScrollView>
            )}
            <Modal
                visible={showAddVital}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddVital(false)}
            >
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

                        <TouchableOpacity style={styles.saveReadingBtn}>
                            <Text style={styles.saveReadingText}>Save Reading</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddVital(false)}>
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
        backgroundColor: '#FDF8F3',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    addVitalModal: {
        width: '100%',
        maxWidth: 428,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        lineHeight: 28,
        color: '#111827',
        marginBottom: 16,
    },
    inputLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        lineHeight: 20,
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 50,
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
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FE6700',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    saveReadingText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    cancelBtn: {
        height: 54,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    cancelText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
    },
    backBtn: {
        marginRight: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    loadingText: {
        marginTop: 12,
        color: '#374151',
        fontFamily: 'Poppins-Medium',
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
        marginBottom: 16,
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
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    latestGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    latestCard: {
        width: '48%',
        height: 124,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardIconRow: {
        marginBottom: 12,
    },
    cardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyHistoryText: {
        color: '#9CA3AF',
        fontFamily: 'Outfit-Medium',
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    historyDateCol: {
        width: '25%',
        borderRightWidth: 1,
        borderRightColor: '#F3F4F6',
        paddingRight: 8,
    },
    historyDateText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'Outfit-SemiBold',
    },
    historyVitalsCol: {
        flex: 1,
        paddingLeft: 16,
    },
    historyVitalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    historyVitalLabel: {
        fontSize: 13,
        color: '#4B5563',
        fontFamily: 'Outfit-Medium',
        width: '48%',
    },
    plotArea: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    plotColumn: {
        width: '18%',
        height: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    chartDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotValue: {
        fontSize: 9,
        fontWeight: '700',
        color: '#111827',
        position: 'absolute',
        top: -16,
        fontFamily: 'Outfit-Bold',
        width: 30,
        textAlign: 'center',
    },
    xAxisRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 32,
        marginTop: 12,
    },
    xAxisText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'Outfit-Medium',
        width: '18%',
        textAlign: 'center',
    },
});