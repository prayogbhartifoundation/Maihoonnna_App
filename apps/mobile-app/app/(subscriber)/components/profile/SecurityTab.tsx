import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SecurityItemProps {
    icon: any;
    title: string;
    subtitle: string;
    status?: string;
    onPress: () => void;
}

const SecurityItem = ({ icon, title, subtitle, status, onPress }: SecurityItemProps) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
        <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name={icon} size={20} color="#6B7280" />
        </View>
        <View style={styles.itemContent}>
            <View style={styles.titleRow}>
                <Text style={styles.itemTitle}>{title}</Text>
                {status && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{status}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.itemSub}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
);

export const SecurityTab = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <View style={styles.card}>
                    <SecurityItem 
                        icon="lock-closed-outline" 
                        title="Change Password" 
                        subtitle="Update your password" 
                        onPress={() => router.push({ pathname: '/(subscriber)/settings/change-password' } as any)}
                    />
                    <View style={styles.divider} />
                    <SecurityItem 
                        icon="shield-checkmark-outline" 
                        title="Two-Factor Authentication" 
                        subtitle="Add extra security layer" 
                        status="off"
                        onPress={() => Alert.alert('Coming Soon', 'Two-Factor Authentication is currently being developed.')}
                    />
                    <View style={styles.divider} />
                    <SecurityItem 
                        icon="globe-outline" 
                        title="Login Activity" 
                        subtitle="View recent account events" 
                        onPress={() => router.push({ pathname: '/(subscriber)/settings/activity-log' } as any)}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                <View style={styles.card}>
                    <SecurityItem 
                        icon="notifications-outline" 
                        title="Notification Preferences" 
                        subtitle="Manage notifications" 
                        onPress={() => Alert.alert('Coming Soon', 'Notification preferences will be available in the next update.')}
                    />
                    <View style={styles.divider} />
                    <SecurityItem 
                        icon="heart-outline" 
                        title="Data Privacy" 
                        subtitle="Manage your data" 
                        onPress={() => router.push({ pathname: '/(subscriber)/settings/privacy' } as any)}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 10 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 15 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    iconBox: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    itemContent: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    itemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    itemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    statusBadge: { 
        backgroundColor: '#F3F4F6', 
        paddingHorizontal: 8, paddingVertical: 2, 
        borderRadius: 8, marginLeft: 10 
    },
    statusText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 55 }
});

export default SecurityTab;
