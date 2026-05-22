import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfilePhotoUploader } from '@/components/ui/ProfilePhotoUploader';

interface ProfileHeroProps {
    user: {
        id: string;
        name: string;
        profilePhoto?: string;
        createdAt: string;
    };
    stats: {
        beneficiaryCount: number;
        usedHours: number;
        availableHours: number;
    };
    /** Called after a successful photo upload so the parent can refresh profile data */
    onPhotoUpdated?: (newUrl: string) => void;
}

export const ProfileHero = ({ user, stats, onPhotoUpdated }: ProfileHeroProps) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getMembershipDuration = (createdAt: string) => {
        const joined = new Date(createdAt);
        const now = new Date();
        const diffMonths =
            (now.getFullYear() - joined.getFullYear()) * 12 +
            (now.getMonth() - joined.getMonth());
        if (diffMonths === 0) return 'New Member';
        if (diffMonths < 12)
            return `Member since ${diffMonths} ${diffMonths === 1 ? 'month' : 'months'}`;
        const years = Math.floor(diffMonths / 12);
        return `Member since ${years} ${years === 1 ? 'year' : 'years'}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.topSpace} />
            <View style={styles.content}>
                {/* ── Profile Photo Uploader ── */}
                <View style={styles.avatarWrapper}>
                    <ProfilePhotoUploader
                        config={{
                            targetType: 'self',
                            currentPhotoUrl: user.profilePhoto,
                            size: 100,
                            editable: true,
                            initials: getInitials(user.name),
                            accentColor: '#F97316',
                            onSuccess: onPhotoUpdated,
                        }}
                    />
                </View>

                {/* Name & Role */}
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.meta}>
                    Subscriber • {getMembershipDuration(user.createdAt)}
                </Text>

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
        paddingTop: 60,
        paddingBottom: 24,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        position: 'absolute',
        top: -50,
        zIndex: 10,
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
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 4 },
    statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#E5E7EB', height: '60%', alignSelf: 'center' },
});

export default ProfileHero;
