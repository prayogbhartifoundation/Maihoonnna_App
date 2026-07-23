import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Dimensions, ScrollView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';
import { useLogoutWithConfirm } from '@/utils/logout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationStack } from '@/contexts/NavigationStackContext';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 350);

interface GlobalDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    drawerAnim: Animated.Value;
    userData: any;
}

const GlobalDrawer = ({ isOpen, onClose, drawerAnim, userData: _userDataProp }: GlobalDrawerProps) => {
    const router = useRouter();
    const { push } = useNavigationStack();
    useAndroidBackHandler();
    const pathname = usePathname();
    const logoutWithConfirm = useLogoutWithConfirm();
    const insets = useSafeAreaInsets();
    const { user: authUser, isLoggedIn } = useAuth();

    const userData = authUser || _userDataProp;
    const userName = isLoggedIn ? (userData?.name || 'User') : 'Welcome Guest';
    const userPhone = isLoggedIn ? (userData?.phone || userData?.email || '') : 'Sign in to manage your care';
    
    // Get user initials for avatar fallback
    const initials = userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'SU';

    const navigateTo = (path: string) => {
        onClose();
        setTimeout(() => {
            push(path as any);
        }, 260);
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
                <View style={{ flex: 1, paddingTop: Math.max(insets.top, 16) }}>
                    
                    {/* Header Card */}
                    <View style={styles.headerContainer}>
                        <View style={styles.headerCard}>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-outline" size={20} color="#6B7280" />
                            </TouchableOpacity>

                            <View style={styles.headerProfileRow}>
                                {userData?.photo ? (
                                    <Image source={{ uri: userData.photo }} style={styles.avatarImage} />
                                ) : (
                                    <LinearGradient colors={['#F97316', '#FB923C']} style={styles.avatarBadge}>
                                        <Text style={styles.avatarText}>{initials}</Text>
                                    </LinearGradient>
                                )}

                                <View style={styles.headerInfo}>
                                    <Text style={styles.drawerName} numberOfLines={1}>{userName}</Text>
                                    <Text style={styles.drawerPhone} numberOfLines={1}>{userPhone}</Text>
                                    {isLoggedIn && (
                                        <View style={styles.roleBadge}>
                                            <View style={styles.onlineDot} />
                                            <Text style={styles.roleBadgeText}>Subscriber</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <ScrollView 
                        style={styles.menuScrollView} 
                        contentContainerStyle={styles.menuScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {isLoggedIn ? (
                            <>
                                <Text style={styles.sectionLabel}>MENU</Text>
                                <DrawerItem 
                                    label="Dashboard" 
                                    icon="grid-outline" 
                                    bg="#FFF7ED"
                                    color="#F97316"
                                    active={pathname === '/' || pathname === '/(subscriber)' || pathname === '/(subscriber)/'}
                                    onPress={() => { onClose(); push('/(subscriber)'); }} 
                                />
                                <DrawerItem 
                                    label="My Profile" 
                                    icon="person-outline" 
                                    bg="#EFF6FF"
                                    color="#2563EB"
                                    active={pathname.includes('/profile')}
                                    onPress={() => navigateTo('/(subscriber)/profile')} 
                                />
                                <DrawerItem 
                                    label="My Beneficiaries" 
                                    icon="people-outline" 
                                    bg="#ECFDF5"
                                    color="#059669"
                                    onPress={() => {
                                        onClose();
                                        setTimeout(() => {
                                            if (pathname === '/' || pathname === '/(subscriber)' || pathname === '/(subscriber)/') {
                                                router.setParams({ highlightBen: Date.now().toString() });
                                            } else {
                                                push(`/(subscriber)?highlightBen=${Date.now()}`);
                                            }
                                        }, 260);
                                    }} 
                                />
                                <DrawerItem 
                                    label="Browse Packages" 
                                    icon="sparkles-outline" 
                                    bg="#F5F3FF"
                                    color="#7C3AED"
                                    onPress={() => navigateTo('/(setup)/subscription-packages')} 
                                />

                                <View style={styles.sectionDivider} />
                                <Text style={styles.sectionLabel}>PREFERENCES</Text>

                                <DrawerItem 
                                    label="Security Settings" 
                                    icon="shield-checkmark-outline" 
                                    bg="#FFFBEB"
                                    color="#D97706"
                                    onPress={() => navigateTo('/(subscriber)/profile')} 
                                />
                                <DrawerItem 
                                    label="Privacy Policy" 
                                    icon="document-text-outline" 
                                    bg="#F0FDFA"
                                    color="#0D9488"
                                    onPress={() => navigateTo('/(subscriber)/settings/privacy')} 
                                />

                                <View style={styles.sectionDivider} />

                                <DrawerItem 
                                    label="Sign Out" 
                                    icon="log-out-outline" 
                                    bg="#FEF2F2"
                                    color="#EF4444"
                                    showArrow={false}
                                    onPress={() => { onClose(); setTimeout(() => logoutWithConfirm(), 260); }} 
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.sectionLabel}>ACCOUNT</Text>
                                <DrawerItem 
                                    label="Sign In" 
                                    icon="log-in-outline" 
                                    bg="#FFF7ED"
                                    color="#F97316"
                                    onPress={() => navigateTo('/(auth)')} 
                                />
                                <DrawerItem 
                                    label="Create Account" 
                                    icon="person-add-outline" 
                                    bg="#ECFDF5"
                                    color="#059669"
                                    onPress={() => navigateTo('/(auth)/register')} 
                                />
                                
                                <View style={styles.sectionDivider} />
                                <Text style={styles.sectionLabel}>SERVICES</Text>

                                <DrawerItem 
                                    label="Browse Packages" 
                                    icon="sparkles-outline" 
                                    bg="#F5F3FF"
                                    color="#7C3AED"
                                    onPress={() => navigateTo('/(setup)/subscription-packages')} 
                                />
                                <DrawerItem 
                                    label="Privacy Policy" 
                                    icon="document-text-outline" 
                                    bg="#F0FDFA"
                                    color="#0D9488"
                                    onPress={() => navigateTo('/(subscriber)/settings/privacy')} 
                                />
                            </>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.drawerFooter}>
                        <View style={styles.footerBrandRow}>
                            <View style={styles.brandDot} />
                            <Text style={styles.brandText}>Mai-Hoonaa Care</Text>
                        </View>
                        <Text style={styles.versionText}>v1.0.4</Text>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
};

const DrawerItem = ({ label, icon, bg, color, active = false, showArrow = true, onPress }: any) => (
    <TouchableOpacity 
        style={[styles.drawerItem, active && styles.drawerItemActive]} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.itemIconBox, { backgroundColor: bg || '#F3F4F6' }]}>
            <Ionicons name={icon} size={18} color={color || '#374151'} />
        </View>
        <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{label}</Text>
        {showArrow && (
            <Ionicons name="chevron-forward" size={14} color={active ? '#F97316' : '#D1D5DB'} />
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    drawerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    drawer: {
        position: 'absolute', right: 0, top: 0, bottom: 0, width: DRAWER_WIDTH,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderBottomLeftRadius: 28,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#0F172A', shadowOffset: { width: -8, height: 0 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 24 },
        }),
    },
    headerContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    headerCard: {
        backgroundColor: '#FAF7F2',
        borderRadius: 20,
        padding: 16,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F3EFE6',
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    headerProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginRight: 12,
    },
    avatarBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 24,
    },
    drawerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    drawerPhone: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 5,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#475569',
    },

    menuScrollView: {
        flex: 1,
    },
    menuScrollContent: {
        paddingVertical: 8,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 6,
        letterSpacing: 1,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 24,
        marginVertical: 10,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 14,
    },
    drawerItemActive: {
        backgroundColor: '#FFF7ED',
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    itemIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    drawerItemText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    drawerItemTextActive: {
        color: '#EA580C',
        fontWeight: '700',
    },

    drawerFooter: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FAF9F6',
    },
    footerBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#F97316',
        marginRight: 6,
    },
    brandText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    versionText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#94A3B8',
    },
});

export default GlobalDrawer;
