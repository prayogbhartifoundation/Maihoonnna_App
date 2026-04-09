import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface GlobalHeaderProps {
    title: string;
    onMenuPress: () => void;
    showBack?: boolean;
}

export const GlobalHeader = ({ title, onMenuPress, showBack = false }: GlobalHeaderProps) => {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <View style={styles.leftSection}>
                {showBack ? (
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.spacer} />
                )}
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>

            <View style={styles.rightSection}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="notifications-outline" size={24} color="#111827" />
                    <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
                </TouchableOpacity>
                <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
                    <Ionicons name="menu-outline" size={28} color="#111827" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'android' ? 10 : 0, 
        paddingBottom: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    leftSection: { width: 40 },
    rightSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: { 
        width: 40, height: 40, 
        justifyContent: 'center', alignItems: 'center',
        position: 'relative'
    },
    spacer: { width: 40 },
    headerTitle: { 
        flex: 1, textAlign: 'center',
        fontSize: 18, fontWeight: '700', color: '#111827' 
    },
    badge: { 
        position: 'absolute', top: 6, right: 6, backgroundColor: '#F97316', 
        width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FFF'
    },
    badgeText: { color: '#FFF', fontSize: 7, fontWeight: '800' },
});
