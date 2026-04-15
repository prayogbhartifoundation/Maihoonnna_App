import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileHeroProps {
    user: {
        name: string;
        profilePhoto?: string;
        createdAt: string;
    };
    stats: {
        beneficiaryCount: number;
        usedHours: number;
        availableHours: number;
    };
}

export const ProfileHero = ({ user, stats }: ProfileHeroProps) => {
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getMembershipDuration = (createdAt: string) => {
        const joined = new Date(createdAt);
        const now = new Date();
        const diffMonths = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
        
        if (diffMonths === 0) return 'New Member';
        if (diffMonths < 12) return `Member since ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'}`;
        const years = Math.floor(diffMonths / 12);
        return `Member since ${years} ${years === 1 ? 'year' : 'years'}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.topSpace} />
            <View style={styles.content}>
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                    {user.profilePhoto ? (
                        <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
                    ) : (
                        <View style={styles.initialsAvatar}>
                            <Text style={styles.initialsText}>{getInitials(user.name)}</Text>
                        </View>
                    )}
                    <View style={styles.editIconBtn}>
                        <Ionicons name="camera" size={12} color="#F97316" />
                    </View>
                </View>

                {/* Name & Role */}
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.meta}>Subscriber • {getMembershipDuration(user.createdAt)}</Text>

                {/* Stats Bar */}
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={20} color="#F97316" />
                        <Text style={styles.statValue}>{stats.beneficiaryCount}</Text>
                        <Text style={styles.statLabel}>Beneficiaries</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="pulse-outline" size={20} color="#3B82F6" />
                        <Text style={styles.statValue}>{stats.usedHours}h</Text>
                        <Text style={styles.statLabel}>Hours Used</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="ribbon-outline" size={20} color="#A855F7" />
                        <Text style={styles.statValue}>{stats.availableHours}h</Text>
                        <Text style={styles.statLabel}>Available</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    topSpace: { height: 60 },
    content: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 50,
        paddingBottom: 24,
        alignItems: 'center',
        paddingHorizontal: 20
    },
    avatarWrapper: {
        position: 'absolute',
        top: -50,
        zIndex: 10,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFF' },
    initialsAvatar: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#F97316',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: '#FFF'
    },
    initialsText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
    editIconBtn: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#FFFFFF', width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 }
        })
    },
    name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
    meta: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 12,
        width: '100%',
        justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
    statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', height: '60%', alignSelf: 'center' },
});

export default ProfileHero;
