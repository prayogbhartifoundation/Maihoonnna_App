import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VisitCardProps {
    patientName: string;
    visitType: string;
    address: string;
    time: string;
    distance: string;
    buttonText: string;
    onPress: () => void;
}

export function VisitCard({ patientName, visitType, address, time, distance, buttonText, onPress }: VisitCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{patientName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{visitType}</Text>
                    </View>
                </View>
                <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={14} color="#FE6700" />
                    <Text style={styles.timeText}>{time}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{address}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 6 }]}>
                <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{distance} away</Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={onPress}>
                <Text style={styles.btnText}>{buttonText}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    topRow: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#FFF0E6',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#FE6700' },
    patientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#111827' },
    typeBadge: {
        backgroundColor: '#FFF7ED', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4,
    },
    typeText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#EA580C' },
    timeBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF7ED', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 6,
    },
    timeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FE6700', marginLeft: 4 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6B7280', marginLeft: 8, flex: 1 },
    btn: {
        backgroundColor: '#FE6700',
        borderRadius: 12, marginTop: 18,
        paddingVertical: 13,
        flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
    },
    btnText: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFFFFF' },
});