import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Dimensions, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLogoutWithConfirm } from '@/utils/logout';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface GlobalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    drawerAnim: Animated.Value;
    userData: any;
}

const GlobalDrawer = ({ isOpen, onClose, drawerAnim, userData }: GlobalDrawerProps) => {
    const router = useRouter();
    const logoutWithConfirm = useLogoutWithConfirm();

    const isLoggedIn = !!userData && !!userData.id;

    const navigateTo = (path: string) => {
        onClose();
        // Small delay to allow drawer to close before navigating
        setTimeout(() => {
            router.push(path as any);
        }, 300);
    };

    return (
        <Modal 
            visible={isOpen} 
            transparent 
            animationType="none" 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.drawerOverlay} 
                activeOpacity={1} 
                onPress={onClose} 
            />
            <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.drawerHeader}>
                        <View style={styles.drawerAvatar}>
                            <Ionicons name="person" size={28} color="#F97316" />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.drawerName}>{isLoggedIn ? userData.name : 'Welcome Guest'}</Text>
                            <Text style={styles.drawerPhone}>{isLoggedIn ? (userData.phone || userData.email || '') : 'Login to manage your care'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Menu Items */}
                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                        {isLoggedIn ? (
                            <>
                                <DrawerItem 
                                    label="Dashboard" 
                                    icon="home-outline" 
                                    onPress={() => { onClose(); router.push('/(subscriber)'); }} 
                                />
                                <DrawerItem 
                                    label="My Profile" 
                                    icon="person-outline" 
                                    onPress={() => navigateTo('/(subscriber)/profile')} 
                                />
                                <DrawerItem 
                                    label="My Beneficiaries" 
                                    icon="people-outline" 
                                    onPress={() => { onClose(); /* Handle scroll or filter if needed */ }} 
                                />
                                <DrawerItem 
                                    label="Browse Packages" 
                                    icon="ribbon-outline" 
                                    onPress={() => navigateTo('/(setup)/subscription-packages')} 
                                />
                                
                                <View style={styles.divider} />
                                
                                <DrawerItem 
                                    label="Security Settings" 
                                    icon="shield-checkmark-outline" 
                                    onPress={() => navigateTo('/(subscriber)/profile')} 
                                />
                                <DrawerItem 
                                    label="Privacy Policy" 
                                    icon="document-lock-outline" 
                                    onPress={() => navigateTo('/(subscriber)/settings/privacy')} 
                                />

                                <View style={styles.divider} />

                                <DrawerItem 
                                    label="Logout" 
                                    icon="log-out-outline" 
                                    color="#EF4444"
                                    onPress={() => { onClose(); setTimeout(() => logoutWithConfirm(), 300); }} 
                                />
                            </>
                        ) : (
                            <>
                                <DrawerItem 
                                    label="Sign In" 
                                    icon="log-in-outline" 
                                    onPress={() => navigateTo('/(auth)')} 
                                />
                                <DrawerItem 
                                    label="Create Account" 
                                    icon="person-add-outline" 
                                    onPress={() => navigateTo('/(auth)/register')} 
                                />
                                <View style={styles.divider} />
                                <DrawerItem 
                                    label="Browse Packages" 
                                    icon="ribbon-outline" 
                                    onPress={() => navigateTo('/(setup)/subscription-packages')} 
                                />
                                <DrawerItem 
                                    label="Privacy Policy" 
                                    icon="document-lock-outline" 
                                    onPress={() => navigateTo('/(subscriber)/settings/privacy')} 
                                />
                            </>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.drawerFooter}>
                        <Text style={styles.versionText}>v1.0.4 Premium</Text>
                    </View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
};

const DrawerItem = ({ label, icon, onPress, color = '#374151' }: any) => (
    <TouchableOpacity style={styles.drawerItem} onPress={onPress}>
        <View style={[styles.itemIconBox, color !== '#374151' && { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.drawerItemText, { color }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    drawerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DRAWER_WIDTH,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 12 },
            android: { elevation: 16 },
        }),
    },
    drawerHeader: { 
        padding: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' 
    },
    drawerAvatar: {
        width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF5ED',
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    headerInfo: { flex: 1 },
    drawerName: { fontSize: 17, fontWeight: '700', color: '#111827' },
    drawerPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20, marginVertical: 8 },
    drawerItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    itemIconBox: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14
    },
    drawerItemText: { fontSize: 15, fontWeight: '600' },
    drawerFooter: { padding: 20, alignItems: 'center' },
    versionText: { fontSize: 11, color: '#9CA3AF' }
});

export default GlobalDrawer;
