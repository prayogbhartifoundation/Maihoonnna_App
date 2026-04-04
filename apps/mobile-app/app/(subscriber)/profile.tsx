import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalHeader } from '../../components/GlobalHeader';
import { logoutWithConfirm } from '@/utils/logout';


export default function ProfileScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const stored = await AsyncStorage.getItem('userData');
            if (stored) {
                setUserData(JSON.parse(stored));
            } else {
                router.replace('/(auth)');
            }
        };
        loadUser();
    }, []);

    if (!userData) {
        return <SafeAreaView style={styles.container}><Text>Loading...</Text></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <GlobalHeader title="Profile" />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Ionicons name="person-circle-outline" size={80} color="#F97316" style={styles.avatarIcon} />
                    <Text style={styles.name}>{userData.name || 'Subscriber'}</Text>
                    <Text style={styles.phone}>{userData.phone}</Text>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Role</Text>
                        <Text style={styles.value}>{userData.role}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>User ID</Text>
                        <Text style={styles.value}>{userData.id}</Text>
                    </View>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.navRow}
                        onPress={() => router.push('/(setup)/subscription-packages')}
                    >
                        <View style={styles.navRowLeft}>
                            <Ionicons name="ribbon-outline" size={20} color="#F97316" style={{ marginRight: 10 }} />
                            <Text style={styles.navRowText}>Browse Packages</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={logoutWithConfirm}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.actionLabel}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF5ED' },
    content: { padding: 20 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20
    },
    avatarIcon: { marginBottom: 16 },
    name: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
    phone: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
    label: { fontSize: 14, color: '#6B7280' },
    value: { fontSize: 14, fontWeight: '500', color: '#111827' },

    navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 8 },
    navRowLeft: { flexDirection: 'row', alignItems: 'center' },
    navRowText: { fontSize: 16, fontWeight: '500', color: '#111827' },

    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 10
    },
    actionLabel: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#EF4444' }
});
