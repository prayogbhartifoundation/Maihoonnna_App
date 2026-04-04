import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EmergencyContactsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [form, setForm] = useState({
        primaryName: '',
        primaryPhone: '',
        primaryEmail: '',
        secondaryName: '',
        secondaryPhone: '',
        secondaryEmail: ''
    });

    const handleNext = () => {
        router.push({
            pathname: '/(setup)/schedule-preferences',
            params: {
                packageId: params.packageId,
                subscriberData: params.subscriberData,
                beneficiaryData: params.beneficiaryData,
                medicalData: params.medicalData,
                emergencyContacts: JSON.stringify(form)
            }
        });
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Subscribe to Care</Text>
                            <Text style={styles.headerSubtitle}>Step 4 of 5</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#111827" />
                                <View style={styles.notifBadge}><Text style={styles.notifText}>2</Text></View>
                            </View>
                            <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '80%' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Emergency Contacts</Text>

                        {/* Primary Emergency Contact */}
                        <Text style={styles.subtextLabel}>Primary Emergency Contact *</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={form.primaryName}
                                onChangeText={(t) => setForm({ ...form, primaryName: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={form.primaryPhone}
                                onChangeText={(t) => setForm({ ...form, primaryPhone: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.primaryEmail}
                                onChangeText={(t) => setForm({ ...form, primaryEmail: t })}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Secondary Emergency Contact */}
                        <Text style={styles.subtextLabel}>Secondary Emergency Contact</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={form.secondaryName}
                                onChangeText={(t) => setForm({ ...form, secondaryName: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={form.secondaryPhone}
                                onChangeText={(t) => setForm({ ...form, secondaryPhone: t })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.secondaryEmail}
                                onChangeText={(t) => setForm({ ...form, secondaryEmail: t })}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.prevBtn} onPress={handleBack}>
                        <Text style={styles.prevBtnText}>Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>Next</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    header: { backgroundColor: '#FFFFFF', paddingTop: 10 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 40 },
    headerTextContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
    notifBadge: { position: 'absolute', right: -4, top: -2, backgroundColor: '#E46C2B', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    progressBarBg: { height: 4, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 4, backgroundColor: '#F97316', width: '80%' },

    scrollContent: { padding: 15 },
    formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 20 },
    subtextLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 15 },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },

    label: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 10 },
    inputGroup: { marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20 },
    prevBtn: { flex: 0.48, borderWidth: 1, borderColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    prevBtnText: { color: '#F97316', fontSize: 16, fontWeight: '600' },
    nextBtn: { flex: 0.48, backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});
