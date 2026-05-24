import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface GlobalHeaderProps {
    title: string;
    onMenuPress: () => void;
    showBack?: boolean;
    rightIcon?: 'pencil' | 'notifications';
    onRightIconPress?: () => void;
}

const GlobalHeader = ({ title, onMenuPress, showBack = false, rightIcon, onRightIconPress }: GlobalHeaderProps) => {
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
                {rightIcon === 'pencil' ? (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.iconBtn}>
                        <Ionicons name="pencil-outline" size={24} color="#F97316" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={24} color="#111827" />
                        <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
                    <Ionicons name="menu-outline" size={28} color="#111827" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default GlobalHeader;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'android' ? 10 : 0, 
        paddingBottom: 8,
        minHeight: 70,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    leftSection: { width: 34 },
    rightSection: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    iconBtn: { 
        width: 34, height: 40,
        justifyContent: 'center', alignItems: 'center',
        position: 'relative'
    },
    spacer: { width: 34 },
    headerTitle: { 
        flex: 1, textAlign: 'left',
        fontSize: 16, fontWeight: '500', color: '#111111'
    },
    badge: { 
        position: 'absolute', top: 3, right: 0, backgroundColor: '#FF5B0A',
        width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#FFF'
    },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});
