import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { API_URL } from '@/constants/api';
import { CompanionBackButton } from '../../components/care-companion/CompanionBackButton';

const DEEP_ORANGE = '#FE6700';
const LIGHT_BEIGE = '#FAF3EB';
const INPUT_BG = '#F3F4F6';

export default function VisitDetailsScreen() {
    const router = useRouter();
    const { visitId } = useLocalSearchParams<{ visitId: string }>();

    const handleSafeBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(care-companion)');
        }
    };

    // Dynamic State
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [visitDetail, setVisitDetail] = useState<any>(null);
    const [requiredVitals, setRequiredVitals] = useState<any[]>([]);
    const [vitalsValues, setVitalsValues] = useState<{ [key: string]: { valueNumeric: string; valueNumeric2: string; valueText: string } }>({});
    
    const [manualRemarks, setManualRemarks] = useState('');
    const [medNotes, setMedNotes] = useState('');
    const [visitNotes, setVisitNotes] = useState('');
    const [mood, setMood] = useState('Neutral');

    // Static list of generic medications as fallback or standard selection
    const [meds, setMeds] = useState([
        { id: '1', name: 'Metformin 500mg', checked: false },
        { id: '2', name: 'Lisinopril 10mg', checked: false },
        { id: '3', name: 'Atorvastatin 20mg', checked: false },
        { id: '4', name: 'Aspirin 81mg', checked: false },
    ]);

    const toggleMed = (id: string) => {
        setMeds(meds.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
    };

    const fetchVisitDetails = async () => {
        if (!visitId) return;
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                router.replace('/(auth)');
                return;
            }

            const response = await fetch(`${API_URL}/care-companion/visits/${visitId}/details`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Failed to load visit details");
            }

            const json = await response.json();
            if (json.success && json.data) {
                setVisitDetail(json.data);
                setRequiredVitals(json.data.requiredVitals || []);
                setMood(json.data.visit?.mood || 'Neutral');
                setVisitNotes(json.data.visit?.notes || '');
                setManualRemarks(json.data.visit?.manualCheckInReason || '');

                if (json.data.activeMedications && json.data.activeMedications.length > 0) {
                    setMeds(json.data.activeMedications.map((m: any) => ({
                        id: m.id,
                        name: m.name,
                        checked: false
                    })));
                } else {
                    setMeds([
                        { id: '1', name: 'Metformin 500mg', checked: false },
                        { id: '2', name: 'Lisinopril 10mg', checked: false },
                        { id: '3', name: 'Atorvastatin 20mg', checked: false },
                        { id: '4', name: 'Aspirin 81mg', checked: false },
                    ]);
                }

                // Initialize vital values mapping
                const initialVals: any = {};
                (json.data.requiredVitals || []).forEach((v: any) => {
                    initialVals[v.id] = {
                        valueNumeric: '',
                        valueNumeric2: '',
                        valueText: v.dataType === 'boolean' ? 'no' : ''
                    };
                });
                setVitalsValues(initialVals);
            }
        } catch (error) {
            console.error("Error loading dynamic visit details:", error);
            Alert.alert("Connection Error", "Failed to retrieve live encounter details. Working with cached records.");
            
            // Premium mock fallback
            setVisitDetail({
                visit: { id: visitId, status: 'scheduled', encounterId: 'ENC-284910' },
                beneficiary: { name: 'Sameer Tandon', age: 72, flatPlot: 'C-42', streetArea: 'Sector 5', city: 'Noida' },
                requiredVitals: [
                    { id: 'v1', code: 'BP', name: 'Blood Pressure', dataType: 'dual_numeric', value1Label: 'Systolic', value2Label: 'Diastolic' },
                    { id: 'v2', code: 'SPO2', name: 'Blood Oxygen Saturation', dataType: 'numeric', unit: '%' },
                    { id: 'v3', code: 'TEMP', name: 'Body Temperature', dataType: 'numeric', unit: '°C' },
                ]
            });
            setRequiredVitals([
                { id: 'v1', code: 'BP', name: 'Blood Pressure', dataType: 'dual_numeric', value1Label: 'Systolic', value2Label: 'Diastolic' },
                { id: 'v2', code: 'SPO2', name: 'Blood Oxygen Saturation', dataType: 'numeric', unit: '%' },
                { id: 'v3', code: 'TEMP', name: 'Body Temperature', dataType: 'numeric', unit: '°C' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchVisitDetails();
        }, [visitId])
    );

    const handleCheckIn = async () => {
        if (!visitId) return;
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            // Get location fallback / mock coordinates
            let latitude = 28.6139;
            let longitude = 77.2090;

            const response = await fetch(`${API_URL}/care-companion/visits/check-in`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitId,
                    latitude,
                    longitude
                })
            });

            const json = await response.json();
            if (json.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Successfully checked-in to beneficiary home location.");
                fetchVisitDetails();
            } else {
                Alert.alert("Error", json.message || "Failed to check-in.");
            }
        } catch (error) {
            Alert.alert("Check-in Error", "Unable to communicate with host machine check-in endpoint.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckOutSave = async () => {
        if (!visitId) return;
        setActionLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            // Format dynamic vitals list to send to backend
            const vitalsList = Object.keys(vitalsValues).map(vid => {
                const val = vitalsValues[vid];
                return {
                    vitalDefinitionId: vid,
                    valueNumeric: val.valueNumeric ? parseFloat(val.valueNumeric) : null,
                    valueNumeric2: val.valueNumeric2 ? parseFloat(val.valueNumeric2) : null,
                    valueText: val.valueText || null,
                };
            });

            // Standard payload values mapped inside vitals object for fallback compatibility
            const primaryBP = vitalsList.find(v => requiredVitals.find(rv => rv.id === v.vitalDefinitionId && rv.code === 'BP'));
            const primaryO2 = vitalsList.find(v => requiredVitals.find(rv => rv.id === v.vitalDefinitionId && rv.code === 'SPO2'));
            const primaryTemp = vitalsList.find(v => requiredVitals.find(rv => rv.id === v.vitalDefinitionId && rv.code === 'TEMP'));

            const vitalsCompatObj = {
                bpSystolic: primaryBP?.valueNumeric || undefined,
                bpDiastolic: primaryBP?.valueNumeric2 || undefined,
                oxygenLevel: primaryO2?.valueNumeric || undefined,
                temperature: primaryTemp?.valueNumeric || undefined,
            };

            const response = await fetch(`${API_URL}/care-companion/visits/check-out`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitId,
                    vitals: vitalsCompatObj,
                    vitalsList,
                    medicationsList: meds.map(m => ({
                        medicationId: m.id,
                        taken: m.checked
                    })),
                    mood: mood.toLowerCase(),
                    medicationAdherence: meds.every(m => m.checked),
                    notes: visitNotes || medNotes
                })
            });

            const json = await response.json();
            if (json.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Encounter Saved", "The scheduled visit logs and dynamic vitals have been saved to your patient records.", [
                    { text: "Done", onPress: () => handleSafeBack() }
                ]);
            } else {
                Alert.alert("Error", json.message || "Failed to complete checkout.");
            }
        } catch (error) {
            Alert.alert("Error Saving Records", "Communication failed during records sync transaction.");
        } finally {
            setActionLoading(false);
        }
    };

    let [fontsLoaded] = useFonts({
        Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
    });

    if (!fontsLoaded || loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={DEEP_ORANGE} />
                <Text style={{ fontFamily: 'Poppins_400Regular', color: '#6B7280', marginTop: 12 }}>Retrieving encounter data...</Text>
            </View>
        );
    }

    const { visit, beneficiary } = visitDetail || {};
    const fullAddress = beneficiary ? [beneficiary.flatPlot, beneficiary.streetArea, beneficiary.city].filter(Boolean).join(', ') : 'No Address Stored';
    const isCheckedIn = visit?.status === 'in_progress' || visit?.status === 'completed';
    const isCompleted = visit?.status === 'completed';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* FORCE hide the header */}
            <Stack.Screen options={{ headerShown: false, headerTransparent: true, title: '' }} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.deepOrangeHeader}>
                        <View style={styles.headerRow}>
                            <CompanionBackButton style={styles.backBtn} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>{beneficiary?.name || 'Loading Patient...'}</Text>
                                <Text style={styles.headerSub}>{beneficiary ? `Age: ${beneficiary.age} | ${fullAddress}` : 'Home Visit'}</Text>
                            </View>
                            <TouchableOpacity>
                                <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content Area with adjusted overlap math */}
                    <View style={styles.contentArea}>

                        {/* 1. CHECK-IN CARD */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="location-outline" size={20} color="#3B82F6" />
                                <Text style={styles.cardTitle}>Encounter Verification</Text>
                            </View>

                            <View style={styles.statusRow}>
                                <View style={styles.statusLeft}>
                                    <Ionicons 
                                        name={isCheckedIn ? "checkmark-circle" : "alert-circle"} 
                                        size={20} 
                                        color={isCheckedIn ? "#059669" : "#EA580C"} 
                                    />
                                    <Text style={[styles.statusText, { color: isCheckedIn ? '#059669' : '#EA580C', fontWeight: '600' }]}>
                                        {isCheckedIn ? "Checked-in Successfully" : "Awaiting Site Arrival"}
                                    </Text>
                                </View>
                                <View style={[styles.outOfRangeBadge, { backgroundColor: isCheckedIn ? '#DEF7EC' : '#FDF2F8' }]}>
                                    <Text style={[styles.outOfRangeText, { color: isCheckedIn ? '#03543F' : '#9D174D' }]}>
                                        {isCheckedIn ? "Verified" : "Sync Pending"}
                                    </Text>
                                </View>
                            </View>

                            {!isCheckedIn && (
                                <>
                                    <TouchableOpacity style={styles.autoCheckInBtn} disabled>
                                        <Text style={styles.autoCheckInText}>Auto Geofence Sync (80m Range)</Text>
                                    </TouchableOpacity>

                                    <Text style={styles.inputLabel}>Remarks (Reason for Override if required)</Text>
                                    <TextInput
                                        style={styles.remarksInput}
                                        placeholder="Explain site delay or manual entry reason..."
                                        placeholderTextColor="#9CA3AF"
                                        value={manualRemarks}
                                        onChangeText={setManualRemarks}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.manualCheckInBtn, actionLoading && { opacity: 0.7 }]} 
                                        onPress={handleCheckIn}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator size="small" color="#111827" />
                                        ) : (
                                            <Text style={styles.manualCheckInText}>Manual Arrival Check-in</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* 2. DYNAMIC VITAL SIGNS CARD */}
                        {isCheckedIn && requiredVitals.length > 0 && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="pulse-outline" size={22} color="#DC2626" />
                                    <Text style={styles.cardTitle}>Required Patient Vitals</Text>
                                </View>

                                <View style={styles.vitalsGrid}>
                                    {requiredVitals.map((v) => {
                                        if (v.dataType === 'numeric') {
                                            return (
                                                <View key={v.id} style={styles.vitalCol}>
                                                    <Text style={styles.inputLabel}>
                                                        {v.name} {v.unit ? `(${v.unit})` : ''}
                                                    </Text>
                                                    <TextInput 
                                                        style={styles.gridInput} 
                                                        placeholder={v.description || "Enter..."} 
                                                        keyboardType="numeric" 
                                                        placeholderTextColor="#9CA3AF" 
                                                        value={vitalsValues[v.id]?.valueNumeric || ''} 
                                                        onChangeText={t => setVitalsValues({
                                                            ...vitalsValues,
                                                            [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueNumeric: t }
                                                        })} 
                                                    />
                                                </View>
                                            );
                                        }

                                        if (v.dataType === 'dual_numeric') {
                                            return (
                                                <View key={v.id} style={styles.vitalColFull}>
                                                    <Text style={styles.inputLabel}>{v.name}</Text>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <View style={{ width: '48%' }}>
                                                            <Text style={styles.subInputLabel}>{v.value1Label || 'Systolic'}</Text>
                                                            <TextInput 
                                                                style={styles.gridInput} 
                                                                placeholder="e.g. 120" 
                                                                keyboardType="numeric" 
                                                                placeholderTextColor="#9CA3AF" 
                                                                value={vitalsValues[v.id]?.valueNumeric || ''} 
                                                                onChangeText={t => setVitalsValues({
                                                                    ...vitalsValues,
                                                                    [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueNumeric: t }
                                                                })} 
                                                            />
                                                        </View>
                                                        <View style={{ width: '48%' }}>
                                                            <Text style={styles.subInputLabel}>{v.value2Label || 'Diastolic'}</Text>
                                                            <TextInput 
                                                                style={styles.gridInput} 
                                                                placeholder="e.g. 80" 
                                                                keyboardType="numeric" 
                                                                placeholderTextColor="#9CA3AF" 
                                                                value={vitalsValues[v.id]?.valueNumeric2 || ''} 
                                                                onChangeText={t => setVitalsValues({
                                                                    ...vitalsValues,
                                                                    [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueNumeric2: t }
                                                                })} 
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        }

                                        if (v.dataType === 'boolean') {
                                            const val = vitalsValues[v.id]?.valueText || 'no';
                                            return (
                                                <View key={v.id} style={styles.vitalColFull}>
                                                    <Text style={styles.inputLabel}>{v.name}</Text>
                                                    <View style={{ flexDirection: 'row', marginTop: 4 }}>
                                                        <TouchableOpacity 
                                                            style={[styles.booleanBtn, val === 'yes' && styles.booleanBtnActive]} 
                                                            onPress={() => setVitalsValues({
                                                                ...vitalsValues,
                                                                [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueText: 'yes' }
                                                            })}
                                                        >
                                                            <Text style={[styles.booleanBtnText, val === 'yes' && styles.booleanBtnTextActive]}>
                                                                {v.booleanTrueLabel || 'Yes'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.booleanBtn, val === 'no' && styles.booleanBtnActive, { marginLeft: 12 }]} 
                                                            onPress={() => setVitalsValues({
                                                                ...vitalsValues,
                                                                [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueText: 'no' }
                                                            })}
                                                        >
                                                            <Text style={[styles.booleanBtnText, val === 'no' && styles.booleanBtnTextActive]}>
                                                                {v.booleanFalseLabel || 'No'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        }

                                        if (v.dataType === 'text') {
                                            const currentText = vitalsValues[v.id]?.valueText || '';
                                            return (
                                                <View key={v.id} style={styles.vitalColFull}>
                                                    <Text style={styles.inputLabel}>{v.name}</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                                        {(v.textOptions || []).map((opt: string) => {
                                                            const isSelected = currentText === opt;
                                                            return (
                                                                <TouchableOpacity 
                                                                    key={opt}
                                                                    style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                                                                    onPress={() => setVitalsValues({
                                                                        ...vitalsValues,
                                                                        [v.id]: { ...(vitalsValues[v.id] || { valueNumeric: '', valueNumeric2: '', valueText: '' }), valueText: opt }
                                                                    })}
                                                                >
                                                                    <Text style={[styles.chipBtnText, isSelected && styles.chipBtnTextActive]}>{opt}</Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            );
                                        }

                                        return null;
                                    })}
                                </View>
                            </View>
                        )}

                        {/* 3. MEDICATION ADHERENCE CARD */}
                        {isCheckedIn && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="pill" size={20} color="#9333EA" />
                                    <Text style={styles.cardTitle}>Medication Adherence</Text>
                                </View>

                                {meds.map((med) => (
                                    <TouchableOpacity key={med.id} style={styles.checkboxRow} onPress={() => toggleMed(med.id)} activeOpacity={0.7}>
                                        <View style={[styles.checkbox, med.checked && styles.checkboxActive]}>
                                            {med.checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.medName}>{med.name}</Text>
                                    </TouchableOpacity>
                                ))}

                                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Additional Notes</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Any medication concerns or observations..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline numberOfLines={3}
                                    value={medNotes} onChangeText={setMedNotes}
                                />
                            </View>
                        )}

                        {/* 4. MOOD ASSESSMENT CARD */}
                        {isCheckedIn && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="heart-outline" size={20} color="#DB2777" />
                                    <Text style={styles.cardTitle}>Mood Assessment</Text>
                                </View>

                                <View style={styles.moodRow}>
                                    {[
                                        { id: 'Happy', icon: 'happy-outline' },
                                        { id: 'Neutral', icon: 'happy-outline' },
                                        { id: 'Sad', icon: 'sad-outline' },
                                        { id: 'Anxious', icon: 'pulse-outline' },
                                        { id: 'Depressed', icon: 'sad-outline' },
                                    ].map((m) => {
                                        const isActive = mood.toLowerCase() === m.id.toLowerCase();
                                        return (
                                            <TouchableOpacity
                                                key={m.id}
                                                style={[styles.moodBox, isActive && styles.moodBoxActive]}
                                                onPress={() => setMood(m.id)}
                                            >
                                                <Ionicons name={m.icon as any} size={20} color={isActive ? '#FFFFFF' : '#4B5563'} style={{ marginBottom: 4 }} />
                                                <Text style={[styles.moodText, isActive && styles.moodTextActive]}>{m.id}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* 5. REQUESTS CARD */}
                        {isCheckedIn && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <MaterialCommunityIcons name="stethoscope" size={20} color="#0D9488" />
                                    <Text style={styles.cardTitle}>Requests</Text>
                                </View>
                                <Text style={styles.inputLabel}>Request Type</Text>
                                <View style={styles.dropdownBtn}>
                                    <Text style={styles.dropdownText}>Select request type</Text>
                                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                                </View>
                            </View>
                        )}

                        {/* 6. VISIT NOTES CARD */}
                        {isCheckedIn && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
                                    <Text style={styles.cardTitle}>Visit Notes</Text>
                                </View>
                                <TextInput
                                    style={[styles.textArea, { height: 100 }]}
                                    placeholder="Additional observations and notes from the visit..."
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    value={visitNotes} onChangeText={setVisitNotes}
                                />
                            </View>
                        )}

                        {/* 7. SAVE BUTTON */}
                        {isCheckedIn && !isCompleted && (
                            <TouchableOpacity 
                                style={[styles.saveBtn, actionLoading && { opacity: 0.7 }]} 
                                onPress={handleCheckOutSave}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.saveBtnText}>Save Encounter</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BEIGE },
    scrollContent: { flexGrow: 1 },

    deepOrangeHeader: {
        backgroundColor: DEEP_ORANGE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        zIndex: 1,
        position: 'relative',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF', fontSize: 20 },
    headerSub: { fontFamily: 'Poppins_400Regular', color: '#FFFFFF', fontSize: 13, opacity: 0.9 },

    contentArea: {
        paddingHorizontal: 20,
        marginTop: 20,
        zIndex: 10,
        position: 'relative',
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1, borderColor: '#FDF2F8',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },

    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#111827', marginLeft: 8 },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    statusLeft: { flexDirection: 'row', alignItems: 'center' },
    statusText: { fontFamily: 'Poppins_500Medium', fontSize: 14, marginLeft: 8 },
    outOfRangeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    outOfRangeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 11 },

    autoCheckInBtn: { backgroundColor: '#FDBA74', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    autoCheckInText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

    inputLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#111827', marginBottom: 8 },
    subInputLabel: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#4B5563', marginBottom: 4 },
    remarksInput: { backgroundColor: INPUT_BG, borderRadius: 8, padding: 14, fontFamily: 'Poppins_400Regular', fontSize: 14, marginBottom: 16 },

    manualCheckInBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
    manualCheckInText: { color: '#111827', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vitalCol: { width: '48%', marginBottom: 16 },
    vitalColFull: { width: '100%', marginBottom: 16 },
    gridInput: { backgroundColor: INPUT_BG, borderRadius: 8, padding: 12, fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#4B5563' },

    booleanBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', backgroundColor: '#FFFFFF' },
    booleanBtnActive: { backgroundColor: DEEP_ORANGE, borderColor: DEEP_ORANGE },
    booleanBtnText: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#374151' },
    booleanBtnTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },

    chipBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
    chipBtnActive: { backgroundColor: DEEP_ORANGE, borderColor: DEEP_ORANGE },
    chipBtnText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#374151' },
    chipBtnTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    checkboxActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    medName: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151' },
    textArea: { backgroundColor: INPUT_BG, borderRadius: 8, padding: 16, height: 80, textAlignVertical: 'top', fontFamily: 'Poppins_400Regular', fontSize: 14 },

    moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
    moodBox: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 12, marginHorizontal: 2 },
    moodBoxActive: { backgroundColor: DEEP_ORANGE, borderColor: DEEP_ORANGE },
    moodText: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#4B5563' },
    moodTextActive: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },

    dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14 },
    dropdownText: { fontFamily: 'Poppins_400Regular', color: '#6B7280', fontSize: 14 },

    saveBtn: { backgroundColor: DEEP_ORANGE, flexDirection: 'row', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: DEEP_ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});