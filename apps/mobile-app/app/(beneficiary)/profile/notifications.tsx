import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();

    const [medPush, setMedPush] = useState(true);
    const [medSms, setMedSms] = useState(true);
    const [medWhatsapp, setMedWhatsapp] = useState(false);

    const [visitPush, setVisitPush] = useState(true);
    const [visitSms, setVisitSms] = useState(false);

    const [reportEmail, setReportEmail] = useState(true);
    const [reportPush, setReportPush] = useState(true);

    const handleSaveChanges = () => {
        Alert.alert('Success', 'Notification preferences saved successfully!');
        safeBack();
    };

    const FigmaToggle = ({
        value,
        onChange,
    }: {
        value: boolean;
        onChange: (value: boolean) => void;
    }) => (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onChange(!value)}
            style={[
                styles.figmaToggle,
                value && styles.figmaToggleActive,
            ]}
        >
            <View
                style={[
                    styles.figmaToggleThumb,
                    value && styles.figmaToggleThumbActive,
                ]}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={20} color="#000000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Notification Settings</Text>

                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <Text style={styles.subtitle}>
                    Customize how and when you want to receive alerts.
                </Text>

                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <View style={[styles.panelIconWrap, { backgroundColor: '#FFF0E6' }]}>
                            <MaterialCommunityIcons name="pill" size={20} color="#FE6700" />
                        </View>
                        <View style={styles.panelHeaderText}>
                            <Text style={styles.panelTitle}>Medication Reminders</Text>
                            <Text style={styles.panelDesc}>
                                Receive reminders when it's time to take your medicine.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Push Notifications</Text>
                        <FigmaToggle value={medPush} onChange={setMedPush} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>SMS Text Messages</Text>
                        <FigmaToggle value={medSms} onChange={setMedSms} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>WhatsApp Updates</Text>
                        <FigmaToggle value={medWhatsapp} onChange={setMedWhatsapp} />
                    </View>
                </View>

                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <View style={[styles.panelIconWrap, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="calendar" size={20} color="#2563FF" />
                        </View>
                        <View style={styles.panelHeaderText}>
                            <Text style={styles.panelTitle}>Visit Schedule Alerts</Text>
                            <Text style={styles.panelDesc}>
                                Get notified before your Care Companion arrives for checkout visits.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Push Notifications</Text>
                        <FigmaToggle value={visitPush} onChange={setVisitPush} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>SMS Reminders</Text>
                        <FigmaToggle value={visitSms} onChange={setVisitSms} />
                    </View>
                </View>

                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <View style={[styles.panelIconWrap, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="document-text-outline" size={20} color="#16A34A" />
                        </View>
                        <View style={styles.panelHeaderText}>
                            <Text style={styles.panelTitle}>Health & Care Reports</Text>
                            <Text style={styles.panelDesc}>
                                Receive diagnostic and check-out logs compiled by your team.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Weekly Email Summaries</Text>
                        <FigmaToggle value={reportEmail} onChange={setReportEmail} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Immediate Visit Checkout Push</Text>
                        <FigmaToggle value={reportPush} onChange={setReportPush} />
                    </View>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} activeOpacity={0.8}>
                    <Text style={styles.saveBtnText}>Save Preferences</Text>
                </TouchableOpacity>

                <View style={{ height: Platform.OS === 'ios' ? 112 : 96 }} />
            </ScrollView>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 40,
        height: 40,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        lineHeight: 24,
        color: '#000000',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 96,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
        fontFamily: 'Poppins-Regular',
        marginBottom: 12,
    },
    panel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    panelIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    panelHeaderText: {
        flex: 1,
    },
    panelTitle: {
        fontSize: 18,
        lineHeight: 27,
        color: '#000000',
        fontFamily: 'Poppins-Medium',
    },
    panelDesc: {
        fontSize: 14,
        lineHeight: 20,
        color: '#333333',
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
    },
    toggleRow: {
        minHeight: 52,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleLabel: {
        flex: 1,
        paddingRight: 12,
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
        fontFamily: 'Poppins-Regular',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    figmaToggle: {
        width: 44,
        height: 24,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        padding: 1.5,
        justifyContent: 'center',
    },
    figmaToggleActive: {
        borderColor: '#FE6700',
        backgroundColor: '#FE6700',
    },
    figmaToggleThumb: {
        width: 19,
        height: 19,
        borderRadius: 999,
        backgroundColor: '#9CA3AF',
        alignSelf: 'flex-start',
    },
    figmaToggleThumbActive: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-end',
    },
    saveBtn: {
        height: 52,
        backgroundColor: '#FE6700',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Poppins-Medium',
    },
});