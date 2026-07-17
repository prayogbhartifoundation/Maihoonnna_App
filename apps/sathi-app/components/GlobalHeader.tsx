import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalHeaderProps {
    title?: string;
}

export function GlobalHeader({ title = "Saathi Network" }: GlobalHeaderProps) {
    const router = useRouter();
    const { logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await logout();
    };

    const handleGoDashboard = () => {
        setIsMenuOpen(false);
        router.replace('/(sathi)');
    };

    return (
        <View style={styles.appBar}>
            <TouchableOpacity onPress={handleGoDashboard}>
                <Text style={styles.appTitle}>{title}</Text>
            </TouchableOpacity>
            <View style={styles.appBarIcons}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setIsMenuOpen(!isMenuOpen)}>
                    <Ionicons name="menu-outline" size={24} color="#111827" />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={handleGoDashboard}
                    >
                        <Ionicons name="home-outline" size={20} color="#374151" style={{ marginRight: 8 }} />
                        <Text style={styles.dropdownItemText}>Dashboard</Text>
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.dropdownItemTextLogout}>Logout</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    appBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        zIndex: 10 // Critical for dropdown to hover over below content
    },
    appTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    appBarIcons: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { marginLeft: 16, position: 'relative' },
    badge: {
        position: 'absolute', top: -4, right: -4, backgroundColor: '#F97316',
        width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center'
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

    dropdownMenu: {
        position: 'absolute', top: 55, right: 20, backgroundColor: '#FFFFFF',
        borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, zIndex: 1000,
        minWidth: 160, borderWidth: 1, borderColor: '#F3F4F6'
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    dropdownItemText: { color: '#374151', fontSize: 14, fontWeight: '600' },
    dropdownItemTextLogout: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    separator: { height: 1, backgroundColor: '#F3F4F6' }
});
