import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, ActivityIndicator, Platform, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

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

    // Calculate Y heights for custom trend visualization
    const maxVal = 140;
    const calculateDotBottom = (val: number): any => {
        const percentage = Math.round(Math.min(100, Math.max(0, (val / maxVal) * 100)));
        return `${percentage}%`;
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
                        {/* Blood Pressure */}
                        <View style={styles.latestCard}>
                            <View style={styles.cardIconRow}>
                                <View style={[styles.cardIconWrap, { backgroundColor: '#FEF2F2' }]}>
                                    <MaterialCommunityIcons name="heart-pulse" size={22} color="#EF4444" />
                                </View>
                            </View>
                            <Text style={styles.cardLabel}>Blood Pressure</Text>
                            <Text style={styles.cardValue}>{latest.bp}</Text>
                        </View>

                        {/* Heart Rate */}
                        <View style={styles.latestCard}>
                            <View style={styles.cardIconRow}>
                                <View style={[styles.cardIconWrap, { backgroundColor: '#FDF2F8' }]}>
                                    <Ionicons name="heart-outline" size={22} color="#EC4899" />
                                </View>
                            </View>
                            <Text style={styles.cardLabel}>Heart Rate</Text>
                            <Text style={styles.cardValue}>{latest.heartRate}</Text>
                        </View>

                        {/* Temperature */}
                        <View style={styles.latestCard}>
                            <View style={styles.cardIconRow}>
                                <View style={[styles.cardIconWrap, { backgroundColor: '#FFF7ED' }]}>
                                    <FontAwesome5 name="thermometer-half" size={18} color="#F97316" />
                                </View>
                            </View>
                            <Text style={styles.cardLabel}>Temperature</Text>
                            <Text style={styles.cardValue}>{latest.temperature}</Text>
                        </View>

                        {/* Weight */}
                        <View style={styles.latestCard}>
                            <View style={styles.cardIconRow}>
                                <View style={[styles.cardIconWrap, { backgroundColor: '#EFF6FF' }]}>
                                    <MaterialCommunityIcons name="scale-bathroom" size={22} color="#3B82F6" />
                                </View>
                            </View>
                            <Text style={styles.cardLabel}>Weight</Text>
                            <Text style={styles.cardValue}>{latest.weight}</Text>
                        </View>
                    </View>

                    {/* Trends Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 16 }]}>Trends (Last 5 readings)</Text>
                    <View style={styles.trendsCard}>
                        {/* Y-Axis Labels & Chart Container */}
                        <View style={styles.chartOuterRow}>
                            {/* Y Axis Labels */}
                            <View style={styles.yAxis}>
                                <Text style={styles.yAxisText}>140</Text>
                                <Text style={styles.yAxisText}>105</Text>
                                <Text style={styles.yAxisText}>70</Text>
                                <Text style={styles.yAxisText}>35</Text>
                                <Text style={styles.yAxisText}>0</Text>
                            </View>

                            {/* Main Grid Area */}
                            <View style={styles.gridContainer}>
                                {/* Grid Lines */}
                                <View style={[styles.gridLine, { top: '0%' }]} />
                                <View style={[styles.gridLine, { top: '25%' }]} />
                                <View style={[styles.gridLine, { top: '50%' }]} />
                                <View style={[styles.gridLine, { top: '75%' }]} />
                                <View style={[styles.gridLine, { top: '100%', height: 2, backgroundColor: '#E5E7EB' }]} />

                                {/* Trend Plots (5 Column Slots) */}
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
                                                        { bottom: calculateDotBottom(sysVal) as any, backgroundColor: '#EF4444' }
                                                    ]}
                                                >
                                                    <Text style={styles.dotValue}>{sysVal}</Text>
                                                </View>

                                                {/* Diastolic Dot */}
                                                <View
                                                    style={[
                                                        styles.chartDot,
                                                        { bottom: calculateDotBottom(diaVal) as any, backgroundColor: '#EC4899' }
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FDF8F3',
    },
    backBtn: {
        marginRight: 16,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontFamily: 'Outfit-Medium',
        marginBottom: 24,
        paddingHorizontal: 4,
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
        color: '#4B5563',
        fontFamily: 'Outfit-Medium',
        fontSize: 15,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    addBtn: {
        backgroundColor: '#FF6F00',
        width: 36,
        height: 36,
        borderRadius: 18,
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
        backgroundColor: '#FFFFFF',
        width: '48%',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardIconRow: {
        marginBottom: 12,
    },
    cardIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Outfit-Medium',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    trendsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    chartOuterRow: {
        flexDirection: 'row',
        height: 180,
    },
    yAxis: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 10,
        width: 32,
        height: '100%',
    },
    yAxisText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontFamily: 'Outfit-Medium',
    },
    gridContainer: {
        flex: 1,
        position: 'relative',
        height: '100%',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#F3F4F6',
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
    historyList: {
        marginTop: 4,
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
});
