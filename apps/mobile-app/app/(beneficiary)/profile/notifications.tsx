import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, Switch, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function NotificationsScreen() {
    const router = useRouter();

    // Toggle States
    const [medPush, setMedPush] = useState(true);
    const [medSms, setMedSms] = useState(true);
    const [medWhatsapp, setMedWhatsapp] = useState(false);

    const [visitPush, setVisitPush] = useState(true);
    const [visitSms, setVisitSms] = useState(false);

    const [reportEmail, setReportEmail] = useState(true);
    const [reportPush, setReportPush] = useState(true);

    const handleSaveChanges = () => {
        Alert.alert('Success', 'Notification preferences saved successfully!');
        router.back();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Customize how and when you want to receive alerts.</Text>

                {/* Group 1: Medication Reminders */}
                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <MaterialCommunityIcons name="pill" size={22} color="#FF6F00" style={{ marginRight: 10 }} />
                        <Text style={styles.panelTitle}>Medication Reminders</Text>
                    </View>
                    <Text style={styles.panelDesc}>Receive reminders when it's time to take your medicine.</Text>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Push Notifications</Text>
                        <Switch
                            value={medPush}
                            onValueChange={setMedPush}
                            trackColor={{ false: '#E5E7EB', true: '#FFD7C2' }}
                            thumbColor={medPush ? '#FF6F00' : '#F3F4F6'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>SMS Text Messages</Text>
                        <Switch
                            value={medSms}
                            onValueChange={setMedSms}
                            trackColor={{ false: '#E5E7EB', true: '#FFD7C2' }}
                            thumbColor={medSms ? '#FF6F00' : '#F3F4F6'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>WhatsApp Updates</Text>
                        <Switch
                            value={medWhatsapp}
                            onValueChange={setMedWhatsapp}
                            trackColor={{ false: '#E5E7EB', true: '#FFD7C2' }}
                            thumbColor={medWhatsapp ? '#FF6F00' : '#F3F4F6'}
                        />
                    </View>
                </View>

                {/* Group 2: Visit Reminders */}
                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <Feather name="calendar" size={20} color="#3B82F6" style={{ marginRight: 10 }} />
                        <Text style={styles.panelTitle}>Visit Schedule Alerts</Text>
                    </View>
                    <Text style={styles.panelDesc}>Get notified before your Care Companion arrives for checkout visits.</Text>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Push Notifications</Text>
                        <Switch
                            value={visitPush}
                            onValueChange={setVisitPush}
                            trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                            thumbColor={visitPush ? '#3B82F6' : '#F3F4F6'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>SMS Reminders</Text>
                        <Switch
                            value={visitSms}
                            onValueChange={setVisitSms}
                            trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                            thumbColor={visitSms ? '#3B82F6' : '#F3F4F6'}
                        />
                    </View>
                </View>

                {/* Group 3: Health & Care Reports */}
                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <Ionicons name="document-text-outline" size={22} color="#10B981" style={{ marginRight: 10 }} />
                        <Text style={styles.panelTitle}>Health & Care Reports</Text>
                    </View>
                    <Text style={styles.panelDesc}>Receive diagnostic and check-out logs compiled by your team.</Text>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Weekly Email Summaries</Text>
                        <Switch
                            value={reportEmail}
                            onValueChange={setReportEmail}
                            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                            thumbColor={reportEmail ? '#10B981' : '#F3F4F6'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Immediate Visit Checkout Push</Text>
                        <Switch
                            value={reportPush}
                            onValueChange={setReportPush}
                            trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                            thumbColor={reportPush ? '#10B981' : '#F3F4F6'}
                        />
                    </View>
                </View>

                {/* Action Save Buttons */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveChanges} activeOpacity={0.8}>
                    <Text style={styles.saveBtnText}>Save Preferences</Text>
                </TouchableOpacity>

                <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
            </ScrollView>
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
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        fontFamily: 'Outfit-Medium',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    panel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    panelTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        fontFamily: 'Outfit-Bold',
    },
    panelDesc: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Outfit-Regular',
        marginBottom: 16,
        lineHeight: 18,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        fontFamily: 'Outfit-Medium',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    saveBtn: {
        backgroundColor: '#FF6F00',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#FF6F00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Outfit-SemiBold',
    },
});
