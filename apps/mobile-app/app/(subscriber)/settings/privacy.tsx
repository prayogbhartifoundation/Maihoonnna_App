import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
    const router = useRouter();

    const PolicySection = ({ title, content }: { title: string, content: string }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionContent}>{content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Data Privacy',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#FFFFFF' },
                }} 
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="shield-half" size={32} color="#10B981" />
                    </View>
                    <Text style={styles.title}>Your Privacy Matters</Text>
                    <Text style={styles.subtitle}>Last updated: April 2026</Text>
                </View>

                <PolicySection 
                    title="1. Information We Collect" 
                    content="We collect information you provide directly to us, such as when you create an account, update your profile, or subscribe to a package. This includes your name, phone number, email, and location data."
                />

                <PolicySection 
                    title="2. How We Use Your Data" 
                    content="We use the information we collect to provide, maintain, and improve our services, including to process your subscriptions, communicate with you, and send security alerts."
                />

                <PolicySection 
                    title="3. Data Security" 
                    content="We use industry-standard security measures to protect your personal information from unauthorized access, use, or disclosure. All sensitive data is encrypted at rest and in transit."
                />

                <PolicySection 
                    title="4. Your Rights" 
                    content="You have the right to access, correct, or delete your personal data. You can update most information directly within the app's profile settings."
                />

                <TouchableOpacity style={styles.contactBtn}>
                    <Text style={styles.contactBtnText}>Contact Privacy Officer</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 MaiHoonNa. All rights reserved.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16
    },
    title: { fontSize: 22, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
    sectionContent: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
    contactBtn: {
        marginTop: 16,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    contactBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
    footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
    footerText: { fontSize: 12, color: '#9CA3AF' }
});
