import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { API_URL } from '@/constants/api';

export default function ActivityLogScreen() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/subscriber/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SECURITY': return 'shield-checkmark';
            case 'PROFILE': return 'person';
            case 'SUBSCRIPTION': return 'card';
            default: return 'notifications';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'SECURITY': return '#EF4444';
            case 'PROFILE': return '#3B82F6';
            case 'SUBSCRIPTION': return '#10B981';
            default: return '#6B7280';
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.logItem}>
            <View style={[styles.iconBox, { backgroundColor: `${getColor(item.type)}15` }]}>
                <Ionicons name={getIcon(item.type) as any} size={20} color={getColor(item.type)} />
            </View>
            <View style={styles.logContent}>
                <Text style={styles.logAction}>{item.action.replace(/_/g, ' ')}</Text>
                <Text style={styles.logType}>{item.type}</Text>
                {item.details && Object.keys(item.details).length > 0 && (
                    <Text style={styles.logDetails}>
                        {JSON.stringify(item.details).replace(/[{}"[\]]/g, ' ').trim()}
                    </Text>
                )}
            </View>
            <View style={styles.timeBox}>
                <Text style={styles.logTime}>{format(new Date(item.createdAt), 'MMM dd')}</Text>
                <Text style={styles.logTimeSmall}>{format(new Date(item.createdAt), 'HH:mm')}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Account Activity',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#FFFFFF' },
                }} 
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No recent activity</Text>
                            <Text style={styles.emptySub}>Critical account events like profile updates or renewals will appear here.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    logItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    logContent: { flex: 1 },
    logAction: { fontSize: 16, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
    logType: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginTop: 2, letterSpacing: 0.5 },
    logDetails: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    timeBox: { alignItems: 'flex-end' },
    logTime: { fontSize: 13, fontWeight: '600', color: '#374151' },
    logTimeSmall: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIcon: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 20 }
});
