import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotCheckedInCardProps {
    deepOrange?: string;
    onPress?: () => void;
}

export function NotCheckedInCard({ deepOrange = '#FE6700', onPress }: NotCheckedInCardProps) {
    return (
        <View style={styles.cardContainer}>
            <View style={styles.leftSection}>
                <Ionicons name="location-outline" size={24} color="#FFFFFF" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Not Checked In</Text>
                    <Text style={styles.subtitle}>Ready to start</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Ionicons name="log-in-outline" size={18} color={deepOrange} />
                <Text style={[styles.buttonText, { color: deepOrange }]}>Check In</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FF8A3D',
        marginHorizontal: 20,
        marginTop: -30,
        marginBottom: 20,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#FE6700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 20,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 12,
    },
    title: {
        fontFamily: 'Poppins_700Bold',
        color: '#FFFFFF',
        fontSize: 15,
    },
    subtitle: {
        fontFamily: 'Poppins_400Regular',
        color: '#FFEBE0',
        fontSize: 13,
        marginTop: 2,
    },
    button: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    buttonText: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 14,
        marginLeft: 6,
    }
});
