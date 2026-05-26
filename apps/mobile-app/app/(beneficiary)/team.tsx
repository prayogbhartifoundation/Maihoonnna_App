import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Dummy data based on your Figma design so the UI renders perfectly
const careTeam = [
    {
        id: '1',
        tag: 'Primary',
        tagType: 'primary',
        name: 'Dr. Sarah Johnson',
        role: 'Primary Care Coordinator',
        description: 'Board-certified nurse practitioner with 15+ years of experience in geriatric care. Specialized in chronic disease management and patient education.',
        image: 'https://i.pravatar.cc/150?img=32', // Placeholder for Dr. Sarah
    },
    {
        id: '2',
        tag: 'Secondary',
        tagType: 'secondary',
        name: 'Mark Thompson',
        role: 'Secondary Care Coordinator',
        description: 'Registered nurse with expertise in home healthcare coordination. Passionate about improving quality of life for seniors.',
        image: 'https://i.pravatar.cc/150?img=11', // Placeholder for Mark
    },
    {
        id: '3',
        tag: 'Field Manager',
        tagType: 'secondary',
        name: 'Emily Chen',
        role: 'Field Manager',
        description: 'Healthcare operations manager overseeing care delivery in the region. Available for escalations and support.',
        image: 'https://i.pravatar.cc/150?img=5', // Placeholder for Emily
    },
];

export default function CareTeamScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header - Arrow removed as requested */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Your Care Team</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {careTeam.map((member) => (
                    <View key={member.id} style={styles.card}>
                        {/* Tag Badge */}
                        <View style={[
                            styles.badge,
                            member.tagType === 'primary' ? styles.badgePrimary : styles.badgeSecondary
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                member.tagType === 'primary' ? styles.badgeTextPrimary : styles.badgeTextSecondary
                            ]}>
                                {member.tag}
                            </Text>
                        </View>

                        {/* Profile Info */}
                        <View style={styles.profileRow}>
                            <Image source={{ uri: member.image }} style={styles.avatar} />
                            <View style={styles.profileTextContainer}>
                                <Text style={styles.name}>{member.name}</Text>
                                <Text style={styles.role}>{member.role}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            {member.description}
                        </Text>

                        {/* Actions - Email removed, Call made full width as requested */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.callButton} activeOpacity={0.8}>
                                <Feather name="phone" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                                <Text style={styles.callButtonText}>Call</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center', // Centered properly without the back arrow
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6', // Subtle divider like Figma
    },
    headerTitle: {
        fontFamily: 'Poppins-Medium',
        fontSize: 18,
        color: '#111827',
    },
    scroll: {
        flex: 1,
        backgroundColor: '#FAF5ED', // The soft peach background from the design
    },
    content: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    badgePrimary: {
        backgroundColor: '#FFF0E6', // Light orange bg
    },
    badgeSecondary: {
        backgroundColor: '#F3F4F6', // Light grey bg
    },
    badgeText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
    },
    badgeTextPrimary: {
        color: '#FE6700', // Orange text
    },
    badgeTextSecondary: {
        color: '#4B5563', // Grey text
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E5E7EB',
        marginRight: 16,
    },
    profileTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'Poppins-Medium', // Exactly as requested for Poppins
        fontSize: 18,
        color: '#111827',
        marginBottom: 2,
    },
    role: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#9CA3AF',
    },
    description: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22, // Critical for readability matches Figma
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center', // Centers the button
    },
    callButton: {
        flex: 1, // Takes up full width now that Email is gone
        backgroundColor: '#FE6700', // Figma Orange
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonIcon: {
        marginRight: 8,
    },
    callButtonText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 15,
        color: '#FFFFFF',
    },
});