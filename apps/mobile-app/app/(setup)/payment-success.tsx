import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Destructure passed data (or use defaults if missing)
    const orderId = (params.orderId as string) || `ORD${Date.now()}`;
    const packageName = (params.packageName as string) || 'Basic Care';
    const price = (params.price as string) || '2999';

    // Format dates
    const today = new Date();
    const purchaseDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const activationDate = tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Mock Package includes logic
    const getPackageIncludes = () => {
        if (packageName.toLowerCase().includes('platinum') || packageName.toLowerCase().includes('elite')) {
            return ['5 visits per week', 'Daily Vital monitoring', 'Medication reminders', '24/7 Priority Support', 'Doctor Consults'];
        }
        if (packageName.toLowerCase().includes('gold') || packageName.toLowerCase().includes('premium')) {
            return ['3 visits per week', 'Vital monitoring', 'Medication reminders', 'Emergency contact support'];
        }
        return ['1 visit per week', 'Vital monitoring', 'Medication reminders', 'Standard support'];
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Top Success Area */}
                <View style={styles.successArea}>
                    <View style={styles.checkmarkCircle}>
                        <Ionicons name="checkmark" size={32} color="#10B981" />
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>
                        Thank you for subscribing to our{'\n'}care services
                    </Text>
                </View>

                {/* Order Details Ribbon */}
                <View style={styles.orderRibbon}>
                    <Ionicons name="cube-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <View>
                        <Text style={styles.ribbonTitle}>Order Details</Text>
                        <Text style={styles.ribbonId}>Order ID: {orderId}</Text>
                    </View>
                </View>

                {/* Invoice Card */}
                <View style={styles.invoiceCard}>
                    <View style={styles.invoiceHeader}>
                        <View>
                            <Text style={styles.packageName}>{packageName}</Text>
                            <Text style={styles.packageDuration}>1 Month</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.packagePrice}>₹{price}</Text>
                            <Text style={styles.perMonth}>/month</Text>
                        </View>
                    </View>

                    {/* Includes box */}
                    <View style={styles.includesBox}>
                        <Text style={styles.includesTitle}>Package Includes:</Text>
                        {getPackageIncludes().map((item, index) => (
                            <View key={index} style={styles.bulletRow}>
                                <Ionicons name="checkmark-circle-outline" size={14} color="#F97316" style={{ marginRight: 6 }} />
                                <Text style={styles.bulletText}>{item}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.separator} />

                    {/* Dates & Payment */}
                    <View style={styles.detailRow}>
                        <View style={styles.iconBoxBlue}>
                            <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Purchase Date</Text>
                            <Text style={styles.detailValue}>{purchaseDate}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.iconBoxGreen}>
                            <Ionicons name="calendar" size={16} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Service Activation</Text>
                            <Text style={styles.detailValue}>{activationDate}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.iconBoxPurple}>
                            <Ionicons name="card-outline" size={16} color="#8B5CF6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Payment Method</Text>
                            <Text style={styles.detailValue}>Digital Payment</Text>
                            <Text style={styles.detailSub}>**** **** **** 3456</Text>
                        </View>
                    </View>
                </View>

                {/* What's Next Card */}
                <View style={styles.whatsNextCard}>
                    <Text style={styles.whatsNextTitle}>What's Next?</Text>
                    <Text style={styles.whatsNextSub}>Follow these steps to get started</Text>

                    {/* Steps */}
                    <View style={styles.stepRow}>
                        <View style={styles.stepNumberCircle}><Text style={styles.stepNumber}>1</Text></View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Check Your Email</Text>
                            <Text style={styles.stepDesc}>We've sent a confirmation email with your subscription details and invoice</Text>
                        </View>
                    </View>

                    <View style={styles.stepRow}>
                        <View style={styles.stepNumberCircle}><Text style={styles.stepNumber}>2</Text></View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Enroll Your Beneficiary</Text>
                            <Text style={styles.stepDesc}>Add details of the senior citizen who will receive care services</Text>
                        </View>
                    </View>

                    <View style={styles.stepRow}>
                        <View style={styles.stepNumberCircle}><Text style={styles.stepNumber}>3</Text></View>
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>Meet Your Care Companion</Text>
                            <Text style={styles.stepDesc}>Our team will assign a dedicated care companion within 24 hours</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity style={styles.enrollBtn} onPress={() => router.replace('/(subscriber)')}>
                        <Text style={styles.enrollBtnText}>Enroll Beneficiary</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.outlineBtn} onPress={() => router.replace('/(subscriber)')}>
                        <Ionicons name="home-outline" size={16} color="#374151" style={{ marginRight: 8 }} />
                        <Text style={styles.outlineBtnText}>Go to Dashboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkBtn}>
                        <Ionicons name="download-outline" size={14} color="#4B5563" style={{ marginRight: 6 }} />
                        <Text style={styles.linkBtnText}>Download Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkBtn}>
                        <Ionicons name="chatbubble-outline" size={14} color="#4B5563" style={{ marginRight: 6 }} />
                        <Text style={styles.linkBtnText}>Contact Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Support Card */}
                <View style={styles.supportCard}>
                    <Text style={styles.supportTitle}>Need help getting started?</Text>
                    <Text style={styles.supportDesc}>Our support team is available 24/7 to assist you</Text>
                    <View style={styles.supportBox}>
                        <Text style={styles.supportBoxText}>Call: 1800-XXX-XXXX</Text>
                    </View>
                    <View style={styles.supportBox}>
                        <Text style={styles.supportBoxText}>Email: support@eldercare.com</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFF5ED' },
    scrollContent: { padding: 20, paddingBottom: 40 },

    successArea: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
    checkmarkCircle: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#D1FAE5',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16
    },
    successTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
    successSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

    orderRibbon: {
        backgroundColor: '#F97316', padding: 16, flexDirection: 'row', alignItems: 'center',
        borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 10
    },
    ribbonTitle: { color: '#FFEBE0', fontSize: 12, fontWeight: '500' },
    ribbonId: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 },

    invoiceCard: {
        backgroundColor: '#FFFFFF', padding: 24,
        borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        marginBottom: 24
    },
    invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    packageName: { fontSize: 18, fontWeight: '700', color: '#111827' },
    packageDuration: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    packagePrice: { fontSize: 20, fontWeight: '700', color: '#F97316' },
    perMonth: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

    includesBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 20 },
    includesTitle: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 10 },
    bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    bulletText: { fontSize: 12, color: '#4B5563' },

    separator: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 20 },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBoxBlue: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    iconBoxGreen: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    iconBoxPurple: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    detailLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
    detailValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    detailSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    whatsNextCard: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12,
        borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 24
    },
    whatsNextTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    whatsNextSub: { fontSize: 13, color: '#6B7280', marginBottom: 24 },

    stepRow: { flexDirection: 'row', marginBottom: 20 },
    stepNumberCircle: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#F97316',
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    stepNumber: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
    stepDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18 },

    enrollBtn: {
        backgroundColor: '#F97316', paddingVertical: 14, borderRadius: 8,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 16
    },
    enrollBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginRight: 8 },

    outlineBtn: {
        borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14, borderRadius: 8,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24
    },
    outlineBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },

    linkBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
    linkBtnText: { color: '#4B5563', fontSize: 12, fontWeight: '500' },

    supportCard: {
        backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12,
        alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6'
    },
    supportTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
    supportDesc: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
    supportBox: { borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' },
    supportBoxText: { fontSize: 12, color: '#374151', fontWeight: '500' }
});
