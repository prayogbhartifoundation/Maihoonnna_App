import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
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
        <View style={[styles.iconBox, iconToneByTitle[title]?.box]}>
            <Ionicons name={icon} size={23} color={iconToneByTitle[title]?.color || '#FF5B0A'} />
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

const iconToneByTitle: Record<string, { color: string; box: object }> = {
    'Change Password': { color: '#FF5B0A', box: { backgroundColor: '#FFEBCB' } },
    'Two-Factor Authentication': { color: '#1F6BFF', box: { backgroundColor: '#DDEBFF' } },
    'Login Activity': { color: '#A12BFF', box: { backgroundColor: '#F2DFFF' } },
    'Notification Preferences': { color: '#16A34A', box: { backgroundColor: '#D8F9E1' } },
    'Data Privacy': { color: '#E8A400', box: { backgroundColor: '#FFF4B8' } },
};

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
    container: { paddingHorizontal: 15, paddingTop: 0 },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F2E7DE',
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#111111', marginBottom: 22 },
    card: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
    },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    iconBox: {
        width: 47, height: 47, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14
    },
    itemContent: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    itemTitle: { fontSize: 17, fontWeight: '600', color: '#111111' },
    itemSub: { fontSize: 15, color: '#4B5563', marginTop: 4 },
    statusBadge: { 
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 10, marginLeft: 10
    },
    statusText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
    divider: { height: 10, backgroundColor: 'transparent', marginLeft: 61 }
});

export default SecurityTab;
