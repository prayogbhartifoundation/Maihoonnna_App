import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

import GlobalDrawer from '../(subscriber)/components/shared/GlobalDrawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderSpacer from '../../components/HeaderSpacer';

export default function SchedulePreferencesScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();
    const params = useLocalSearchParams();
    const [fontsLoaded] = useFonts({
        Poppins_400Regular,
        Poppins_600SemiBold
    });

    const [drawerOpen, setDrawerOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        AsyncStorage.getItem('userData').then(data => {
            if (data) setUserData(JSON.parse(data));
        });
    }, []);

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    };
    const closeDrawer = () => {
        Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }).start(() => setDrawerOpen(false));
    };

    const [visitTiming, setVisitTiming] = useState('');
    const [agreed, setAgreed] = useState(false);

    const handleEnrollment = () => {
        if (!agreed) {
            alert('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        router.push({
            pathname: '/(setup)/checkout',
            params: {
                packageId: params.packageId,
                subscriberData: params.subscriberData,
                beneficiaryData: params.beneficiaryData,
                medicalData: params.medicalData,
                emergencyContacts: params.emergencyContacts,
                preferencesData: JSON.stringify({ preferredTiming: visitTiming })
            }
        });
    };

    const handleBack = () => {
        safeBack('/(setup)/emergency-contacts');
    };

    if (!fontsLoaded) {
        return (
            <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
                <ActivityIndicator size="small" color="#FE6700" />
            </SafeAreaView>
        );
    }

    const TimingPill = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.timingPill, active && styles.timingPillActive]}
            onPress={onPress}
        >
            <Text style={[styles.timingText, active && styles.timingTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.safeArea}>
            <HeaderSpacer backgroundColor="#FFFFFF" />
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
                            <Text style={styles.headerSubtitle}>Step 5 of 5</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color="#111827" />
                                <View style={styles.notifBadge}><Text style={styles.notifText}>2</Text></View>
                            </View>
                            <TouchableOpacity onPress={openDrawer}>
                                <Ionicons name="menu-outline" size={30} color="#111827" style={{ marginLeft: 15 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: '60%' }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Schedule Preferences</Text>

                        <Text style={styles.label}>Preferred Visit Timing *</Text>
                        <View style={styles.pillContainer}>
                            <TimingPill
                                label="Morning (8AM - 12 PM)"
                                active={visitTiming === 'Morning'}
                                onPress={() => setVisitTiming('Morning')}
                            />
                            <TimingPill
                                label="Afternoon (12PM - 4 PM)"
                                active={visitTiming === 'Afternoon'}
                                onPress={() => setVisitTiming('Afternoon')}
                            />
                            <TimingPill
                                label="Evening (4PM - 8 PM)"
                                active={visitTiming === 'Evening'}
                                onPress={() => setVisitTiming('Evening')}
                            />
                        </View>

                        <View style={styles.agreementBox}>
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => setAgreed(!agreed)}
                            >
                                <Ionicons
                                    name={agreed ? "checkbox" : "square-outline"}
                                    size={20}
                                    color={agreed ? "#FE6700" : "#000000"}
                                />
                            </TouchableOpacity>
                            <Text style={styles.agreementText}>
                                I agree to the <Text style={styles.boldText}>Terms of Service</Text> and <Text style={styles.boldText}>Privacy Policy</Text>. I understand that this is a demo application and no actual data will be stored.
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.buttonContainerStacked}>
                            <TouchableOpacity style={styles.completeBtn} onPress={handleEnrollment}>
                                <Text style={styles.completeBtnText}>Complete Enrollment</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.prevBtnStacked} onPress={handleBack}>
                                <Text style={styles.prevBtnTextStacked}>Previous</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

            </KeyboardAvoidingView>

            <GlobalDrawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                drawerAnim={drawerAnim}
                userData={userData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FCECE0' },
    loadingContainer: { alignItems: 'center', justifyContent: 'center' },
    header: { backgroundColor: '#FFFFFF' },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 10 },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 44, height: 44, justifyContent: 'center' },
    headerTextContainer: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 7 },
    headerTitle: { fontFamily: 'Poppins_400Regular', fontSize: 18, lineHeight: 24, color: '#000000' },
    headerSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, lineHeight: 22, color: '#8F95A3', marginTop: 2 },
    notifBadge: { position: 'absolute', right: -7, top: -7, backgroundColor: '#FE6700', borderRadius: 10, width: 19, height: 19, justifyContent: 'center', alignItems: 'center' },
    notifText: { color: 'white', fontSize: 10, fontWeight: 'bold', fontFamily: 'Poppins_600SemiBold' },
    progressBarBg: { height: 3, backgroundColor: '#E5E7EB', width: '100%' },
    progressBarFill: { height: 3, backgroundColor: '#FE6700', width: '100%' },

    scrollContent: { paddingHorizontal: 21, paddingTop: 30, paddingBottom: 36 },
    formCard: {
        minHeight: 837,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 24,
        paddingTop: 27,
        paddingBottom: 22,
        shadowColor: '#7A4E35',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4
    },
    sectionTitle: { fontFamily: 'Poppins_400Regular', fontSize: 20, lineHeight: 28, color: '#000000', marginBottom: 13 },

    label: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20, color: '#000000', marginBottom: 21 },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 31 },
    timingPill: { backgroundColor: '#E5E5E5', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 3, marginRight: 10, marginBottom: 10 },
    timingPillActive: { backgroundColor: '#E5E5E5' },
    timingText: { color: '#000000', fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 16 },
    timingTextActive: { color: '#000000', fontFamily: 'Poppins_400Regular' },

    agreementBox: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 37 },
    checkbox: { marginRight: 8, marginTop: 1 },
    agreementText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#000000', lineHeight: 20 },
    boldText: { fontFamily: 'Poppins_400Regular', color: '#000000' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 13 },

    buttonContainerStacked: { alignItems: 'center' },
    completeBtn: { width: '100%', height: 49, backgroundColor: '#FE6700', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 19 },
    completeBtnText: { color: '#FFFFFF', fontSize: 18, lineHeight: 25, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
    prevBtnStacked: { width: '48%', minWidth: 169, height: 50, borderWidth: 1, borderColor: '#FE6700', borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
    prevBtnTextStacked: { color: '#FE6700', fontSize: 18, lineHeight: 25, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' }
});