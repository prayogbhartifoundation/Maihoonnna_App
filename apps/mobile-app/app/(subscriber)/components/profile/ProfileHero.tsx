import React from 'react';
import { View, Text, StyleSheet, Platform, ImageBackground } from 'react-native';
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
            <ImageBackground
                source={require('../../../../assets/images/bg01.png')}
                style={styles.topBackground}
                imageStyle={styles.topBackgroundImage}
                resizeMode="cover"
            >
                <View style={styles.topSpace} />
            </ImageBackground>
            <View style={styles.content}>
                {/* ── Profile Photo Uploader ── */}
                <View style={styles.avatarWrapper}>
                    <ProfilePhotoUploader
                        config={{
                            targetType: 'self',
                            currentPhotoUrl: user.profilePhoto,
                            size: 96,
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
                    <View style={[styles.statItem, styles.beneficiaryStat]}>
                        <Ionicons name="people-outline" size={24} color="#FF5B0A" />
                        <Text style={styles.statValue}>{stats.beneficiaryCount}</Text>
                        <Text style={styles.statLabel}>Beneficiaries</Text>
                    </View>
                    <View style={[styles.statItem, styles.hoursStat]}>
                        <Ionicons name="pulse-outline" size={24} color="#1F6BFF" />
                        <Text style={styles.statValue}>{stats.usedHours}h</Text>
                        <Text style={styles.statLabel}>Hours Used</Text>
                    </View>
                    <View style={[styles.statItem, styles.availableStat]}>
                        <Ionicons name="ribbon-outline" size={24} color="#A12BFF" />
                        <Text style={styles.statValue}>{stats.availableHours}h</Text>
                        <Text style={styles.statLabel}>Available</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: '#FFF2E8',
        marginBottom: 0,
    },
    topBackground: {
        width: '100%',
        height: 149,
        overflow: 'hidden',
        borderBottomLeftRadius: 23,
        borderBottomRightRadius: 23,
    },
    topBackgroundImage: {
        borderBottomLeftRadius: 23,
        borderBottomRightRadius: 23,
    },
    topSpace: { height: 149 },
    content: {
        width: '93%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: -43,
        marginBottom: -1,
        paddingTop: 49,
        paddingBottom: 30,
        alignItems: 'center',
        paddingHorizontal: 25,
        ...Platform.select({
            ios: { shadowColor: '#4A2B17', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8 },
            android: { elevation: 3 },
        }),
    },
    avatarWrapper: {
        position: 'absolute',
        top: -64,
        zIndex: 10,
    },
    name: { fontSize: 26, fontWeight: '800', color: '#111111', marginBottom: 4 },
    meta: { fontSize: 17, color: '#333333', marginBottom: 28 },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        width: '100%',
        justifyContent: 'space-between',
        gap: 16,
    },
    statItem: {
        flex: 1,
        minHeight: 91,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
    },
    beneficiaryStat: { backgroundColor: '#FFF5ED' },
    hoursStat: { backgroundColor: '#EEF6FF' },
    availableStat: { backgroundColor: '#FBF1FF' },
    statValue: { fontSize: 23, fontWeight: '800', color: '#000000', marginTop: 5 },
    statLabel: { fontSize: 13, color: '#333333', marginTop: 2 },
    statDivider: { width: 0, height: 0 },
});

export default ProfileHero;
