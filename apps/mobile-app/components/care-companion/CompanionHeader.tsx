import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompanionHeaderProps {
    userName: string;
}

export function CompanionHeader({ userName }: CompanionHeaderProps) {
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const handleLogout = async () => {
        setIsMenuOpen(false);
        await AsyncStorage.clear();
        router.replace('/(auth)');
    };

    return (
        <View style={styles.headerArea}>
            <View style={[styles.headerTop, { zIndex: 11 }]}>
                <View>
                    <Text style={styles.mainTitle}>Care Companion</Text>
                    <Text style={styles.subTitle}>Welcome back, {userName}</Text>
                </View>

                {/* Profile Button / Dropdown Anchor */}
                <View style={{ position: 'relative', zIndex: 100 }}>
                    <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Ionicons name="person-outline" size={24} color="#F97316" />
                    </TouchableOpacity>

                    {/* Dropdown Menu replicating GlobalHeader */}
                    {isMenuOpen && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setIsMenuOpen(false);
                                    router.push('/(care-companion)/profile');
                                }}
                            >
                                <Ionicons name="person-outline" size={20} color="#374151" style={{ marginRight: 8 }} />
                                <Text style={styles.dropdownItemText}>Profile</Text>
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
            </View>

            <View style={styles.dateTimeRow}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Text style={styles.dateTimeText}>{formatTime(currentTime)}</Text>
                <View style={styles.dot} />
                <Text style={styles.dateTimeText}>{formatDate(currentTime)}</Text>
            </View>

            <View style={styles.checkInBanner}>
                <View style={styles.checkInLeft}>
                    <Ionicons name="location-outline" size={20} color="#FFFFFF" />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.checkInTitle}>Not Checked In</Text>
                        <Text style={styles.checkInSub}>Ready to start</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.checkInBtn}>
                    <Ionicons name="log-in-outline" size={18} color="#111827" />
                    <Text style={styles.checkInBtnText}>Check In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerArea: {
        backgroundColor: '#FA6B0D',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 24,
        paddingBottom: 24,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 10, // Important for drop down clipping
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mainTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginBottom: 2 },
    subTitle: { color: '#FFEDD5', fontSize: 15, fontWeight: '400' },
    profileBtn: { backgroundColor: '#FFFFFF', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

    // Dropdown Styles
    dropdownMenu: {
        position: 'absolute', top: 55, right: 0, backgroundColor: '#FFFFFF',
        borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, zIndex: 1000,
        minWidth: 160, borderWidth: 1, borderColor: '#F3F4F6'
    },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    dropdownItemText: { color: '#374151', fontSize: 14, fontWeight: '600' },
    dropdownItemTextLogout: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    separator: { height: 1, backgroundColor: '#F3F4F6' },
    dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 24 },
    dateTimeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '400', marginLeft: 6 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', marginHorizontal: 12 },
    checkInBanner: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255, 0.2)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    checkInLeft: { flexDirection: 'row', alignItems: 'center' },
    checkInTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    checkInSub: { color: '#FFEBE0', fontSize: 12, marginTop: 2 },
    checkInBtn: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    checkInBtnText: { color: '#111827', fontSize: 14, fontWeight: '700', marginLeft: 6 },
});