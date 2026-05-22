import React from 'react';
import { StyleSheet, SafeAreaView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MedsTracker from '@/components/shared/MedsTracker';

export default function MedsScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#FDE6D2', '#FFDDC2']} style={styles.header}>
                <Text style={styles.headerTitle}>Medications</Text>
                <Text style={styles.headerSub}>Today's medication schedule</Text>
            </LinearGradient>

            <View style={styles.container}>
                <MedsTracker />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FAF5ED' },
    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
    headerSub: { fontSize: 15, color: '#374151', marginTop: 4 },
    container: {
        flex: 1,
        backgroundColor: '#FCFAF7',
    },
});
