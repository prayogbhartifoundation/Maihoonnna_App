import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface SubscriptionTabProps {
    plan: {
        name: string;
        hoursTotal: number;
        hoursUsed: number;
        nextBillingDate: string;
        isActive: boolean;
    } | null;
    beneficiaries: any[];
}

const SubscriptionTab = ({ plan, beneficiaries }: SubscriptionTabProps) => {
    const router = useRouter();
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const progress = (plan && plan.hoursTotal > 0) ? (plan.hoursUsed / plan.hoursTotal) : 0;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Current Plan Card */}
            {plan ? (
                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.planCard}>
                    <View style={styles.planHeader}>
                        <View>
                            <Text style={styles.planLabel}>Current Plan</Text>
                            <Text style={styles.planName}>{plan.name}</Text>
                        </View>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>Active</Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>Hours Used</Text>
                            <Text style={styles.progressText}>{plan.hoursUsed} / {plan.hoursTotal} hrs</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.planFooter}>
                        <Text style={styles.footerLabel}>Next Billing Date</Text>
                        <Text style={styles.footerValue}>{formatDate(plan.nextBillingDate)}</Text>
                    </View>
                </LinearGradient>
            ) : (
                <View style={[styles.planEmptyCard]}>
                    <Ionicons name="ribbon-outline" size={40} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No Active Subscription</Text>
                </View>
            )}

            {/* Manage Subscription */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Manage Subscription</Text>
                <View style={styles.card}>
                    {[
                        { icon: 'ribbon-outline', title: 'Upgrade Plan', sub: 'Get more hours & benefits', onPress: () => router.push('/(setup)/subscription-packages') },
                        { icon: 'card-outline', title: 'Payment Methods', sub: 'Manage payment options' },
                        { icon: 'document-text-outline', title: 'Billing History', sub: 'View past invoices' },
                    ].map((item, i) => (
                        <React.Fragment key={i}>
                            <TouchableOpacity style={styles.manageItem} onPress={item.onPress}>
                                <View style={styles.iconBox}>
                                    <Ionicons name={item.icon as any} size={20} color="#F97316" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.manageTitle}>{item.title}</Text>
                                    <Text style={styles.manageSub}>{item.sub}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                            {i < 2 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Your Beneficiaries */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Your Beneficiaries</Text>
                    <TouchableOpacity style={styles.addBtn}>
                        <Text style={styles.addBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>

                {beneficiaries?.length > 0 ? (
                    beneficiaries.map((b, i) => (
                        <TouchableOpacity 
                            key={b.id || i} 
                            style={styles.benCard}
                            onPress={() => router.push({ pathname: '/(subscriber)/beneficiary-profile', params: { id: b.id } })}
                        >
                            <View style={[styles.benAvatar]}>
                                {b.photo ? (
                                    <Image source={{ uri: b.photo }} style={styles.benPhoto} />
                                ) : (
                                    <View style={styles.initialsBox}>
                                        <Text style={styles.benInitials}>{b.name[0]}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={styles.benName}>{b.name}</Text>
                                <Text style={styles.benMeta}>{b.relationship} • {b.age} years</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.emptySubText}>No beneficiaries added yet.</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 10 },
    planCard: {
        borderRadius: 24, padding: 24, marginBottom: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
            android: { elevation: 8 }
        })
    },
    planEmptyCard: { 
        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 30, marginBottom: 24,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed'
    },
    emptyText: { color: '#9CA3AF', fontWeight: '600', marginTop: 10 },
    emptySubText: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 10 },

    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    planLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    planName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    activeBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    activeText: { color: '#059669', fontSize: 12, fontWeight: '800' },
    
    progressSection: { marginBottom: 24 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
    progressBarFill: { height: 8, backgroundColor: '#FFFFFF', borderRadius: 4 },

    planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    footerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
    footerValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

    section: { marginBottom: 24 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    addBtn: { backgroundColor: '#FFF5ED', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    addBtnText: { color: '#F97316', fontWeight: '800', fontSize: 13 },

    card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    manageItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF5ED', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    manageTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    manageSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 55 },

    benCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    benAvatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
    initialsBox: { width: 48, height: 48, backgroundColor: '#FFF5ED', justifyContent: 'center', alignItems: 'center' },
    benPhoto: { width: 48, height: 48 },
    benInitials: { fontSize: 18, fontWeight: '700', color: '#F97316' },
    benName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
    benMeta: { fontSize: 12, color: '#6B7280' },
});

export default SubscriptionTab;
