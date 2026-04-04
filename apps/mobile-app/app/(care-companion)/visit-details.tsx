import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const DEEP_ORANGE = '#FE6700';
const LIGHT_BEIGE = '#FAF3EB';
const INPUT_BG = '#F3F4F6';

export default function VisitDetailsScreen() {
    const router = useRouter();

    const [manualRemarks, setManualRemarks] = useState('');
    const [vitals, setVitals] = useState({ bpSys: '', bpDia: '', weight: '', temp: '', o2: '', heartRate: '' });
    const [medNotes, setMedNotes] = useState('');
    const [visitNotes, setVisitNotes] = useState('');
    const [mood, setMood] = useState('Neutral');

    const [meds, setMeds] = useState([
        { id: '1', name: 'Metformin 500mg', checked: false },
        { id: '2', name: 'Lisinopril 10mg', checked: false },
        { id: '3', name: 'Atorvastatin 20mg', checked: false },
        { id: '4', name: 'Aspirin 81mg', checked: false },
        { id: '5', name: 'Levothyroxine 50mcg', checked: false },
        { id: '6', name: 'Omeprazole 20mg', checked: false },
        { id: '7', name: 'Metoprolol 25mg', checked: false },
        { id: '8', name: 'Amlodipine 5mg', checked: false },
    ]);

    const toggleMed = (id: string) => {
        setMeds(meds.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
    };

    let [fontsLoaded] = useFonts({
        Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
    });

    if (!fontsLoaded) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* FORCE hide the header */}
            <Stack.Screen options={{ headerShown: false, headerTransparent: true, title: '' }} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.deepOrangeHeader}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>Sameer Tandon</Text>
                                <Text style={styles.headerSub}>Home Visit</Text>
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
                                <Text style={styles.cardTitle}>Check-in</Text>
                            </View>

                            <View style={styles.statusRow}>
                                <View style={styles.statusLeft}>
                                    <Ionicons name="location-outline" size={18} color="#EA580C" style={styles.slashIcon} />
                                    <Text style={styles.statusText}>Not at location</Text>
                                </View>
                                <View style={styles.outOfRangeBadge}>
                                    <Text style={styles.outOfRangeText}>Out of Range</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.autoCheckInBtn} disabled>
                                <Text style={styles.autoCheckInText}>Auto Check-in (Geofencing)</Text>
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>Manual Check-in (Remarks Required)</Text>
                            <TextInput
                                style={styles.remarksInput}
                                placeholder="Enter reason for manual check-in..."
                                placeholderTextColor="#9CA3AF"
                                value={manualRemarks}
                                onChangeText={setManualRemarks}
                            />
                            <TouchableOpacity style={styles.manualCheckInBtn}>
                                <Text style={styles.manualCheckInText}>Manual Check-in</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 2. VITAL SIGNS CARD */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="pulse-outline" size={22} color="#DC2626" />
                                <Text style={styles.cardTitle}>Vital Signs</Text>
                            </View>

                            <View style={styles.vitalsGrid}>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>BP Systolic</Text>
                                    <TextInput style={styles.gridInput} placeholder="120" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.bpSys} onChangeText={t => setVitals({...vitals, bpSys: t})} />
                                </View>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>BP Diastolic</Text>
                                    <TextInput style={styles.gridInput} placeholder="80" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.bpDia} onChangeText={t => setVitals({...vitals, bpDia: t})} />
                                </View>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                                    <TextInput style={styles.gridInput} placeholder="70" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.weight} onChangeText={t => setVitals({...vitals, weight: t})} />
                                </View>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>Temperature (°C)</Text>
                                    <TextInput style={styles.gridInput} placeholder="36.5" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.temp} onChangeText={t => setVitals({...vitals, temp: t})} />
                                </View>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>O2 Level (%)</Text>
                                    <TextInput style={styles.gridInput} placeholder="98" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.o2} onChangeText={t => setVitals({...vitals, o2: t})} />
                                </View>
                                <View style={styles.vitalCol}>
                                    <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
                                    <TextInput style={styles.gridInput} placeholder="72" keyboardType="numeric" placeholderTextColor="#9CA3AF" value={vitals.heartRate} onChangeText={t => setVitals({...vitals, heartRate: t})} />
                                </View>
                            </View>
                        </View>

                        {/* 3. MEDICATION ADHERENCE CARD */}
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

                        {/* 4. MOOD ASSESSMENT CARD */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="heart-outline" size={20} color="#DB2777" />
                                <Text style={styles.cardTitle}>Mood Assessment</Text>
                            </View>

                            <View style={styles.moodRow}>
                                {[
                                    { id: 'Happy', icon: 'happy-outline' },
                                    { id: 'Neutral', icon: 'sad-outline' },
                                    { id: 'Sad', icon: 'sad-outline' },
                                    { id: 'Anxious', icon: 'pulse-outline' },
                                    { id: 'Depressed', icon: 'sad-outline' },
                                ].map((m) => {
                                    const isActive = mood === m.id;
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

                        {/* 5. REQUESTS CARD */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="stethoscope" size={20} color="#0D9488" />
                                <Text style={styles.cardTitle}>Requests</Text>
                            </View>
                            <Text style={styles.inputLabel}>Request Type</Text>
                            <View style={styles.dropdownBtn}>
                                <Text style={styles.dropdownText}>Select request typ</Text>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </View>
                        </View>

                        {/* 6. VISIT NOTES CARD */}
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

                        {/* 7. SAVE BUTTON */}
                        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
                            <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>Save Encounter</Text>
                        </TouchableOpacity>

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
        paddingBottom: 24, // INCREASED: Stretches the orange box further down to make room
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
        marginTop: 20, // DECREASED: Pulls the cards up slightly less so they don't cover the text!
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
    slashIcon: { textDecorationLine: 'line-through' },
    statusText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', marginLeft: 8 },
    outOfRangeBadge: { backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    outOfRangeText: { color: '#FFFFFF', fontFamily: 'Poppins_500Medium', fontSize: 11 },

    autoCheckInBtn: { backgroundColor: '#FDBA74', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    autoCheckInText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

    inputLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#111827', marginBottom: 8 },
    remarksInput: { backgroundColor: INPUT_BG, borderRadius: 8, padding: 14, fontFamily: 'Poppins_400Regular', fontSize: 14, marginBottom: 16 },

    manualCheckInBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
    manualCheckInText: { color: '#111827', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },

    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vitalCol: { width: '48%', marginBottom: 16 },
    gridInput: { backgroundColor: INPUT_BG, borderRadius: 8, padding: 12, fontFamily: 'Poppins_500Medium', fontSize: 15, color: '#4B5563' },

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