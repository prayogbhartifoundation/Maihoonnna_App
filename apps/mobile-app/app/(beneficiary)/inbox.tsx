import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function InboxScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#FDE6D2', '#FFDDC2']} style={styles.header}>
                <Text style={styles.headerTitle}>Inbox</Text>
                <Text style={styles.headerSub}>Messages & notifications</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Empty state */}
                <View style={styles.emptyState}>
                    <Feather name="inbox" size={52} color="#E5E7EB" />
                    <Text style={styles.emptyTitle}>All caught up!</Text>
                    <Text style={styles.emptySubtitle}>
                        You have no new messages or notifications.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5ED' },
    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827', fontFamily: 'Outfit-Bold' },
    headerSub: { fontSize: 15, color: '#374151', marginTop: 4, fontFamily: 'Outfit-Regular' },
    content: { flex: 1, padding: 20 },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
        gap: 12,
    },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', fontFamily: 'Outfit-Bold' },
    emptySubtitle: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        fontFamily: 'Outfit-Regular',
        maxWidth: 260,
    },
});
