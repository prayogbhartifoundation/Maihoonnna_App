import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeBack } from '@/hooks/useSafeBack';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const safeBack = useSafeBack();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => safeBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="arrow-left" size={22} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Settings</Text>

                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.container}>
                <View style={styles.aboutCard}>
                    <Text style={styles.aboutTitle}>About</Text>

                    <View style={styles.aboutRows}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Version</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Build</Text>
                            <Text style={styles.infoValue}>2024.03.23</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.linksCard}>
                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
                        <Text style={styles.linkText}>Help & Support</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: Platform.OS === 'ios' ? 72 : 70,
        paddingHorizontal: 21,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        lineHeight: 22,
        color: '#000000',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 28,
        height: 28,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFF1E8',
        paddingTop: 18,
    },
    aboutCard: {
        width: 398,
        height: 120,
        marginLeft: 11,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 14,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 2,
        elevation: 2,
    },
    aboutTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        lineHeight: 24,
        color: '#333333',
        marginBottom: 16,
    },
    aboutRows: {
        gap: 7,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        lineHeight: 20,
        color: '#333333',
    },
    infoValue: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: '#111827',
        textAlign: 'right',
    },
    linksCard: {
        width: 398,
        height: 170,
        marginLeft: 11,
        marginTop: 46,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 0,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.16,
        shadowRadius: 2,
        elevation: 2,
    },
    linkRow: {
        height: 56,
        justifyContent: 'center',
    },
    linkText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 16,
        lineHeight: 22,
        color: '#333333',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
    },
});