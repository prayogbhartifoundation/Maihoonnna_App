import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState<'choose' | 'verify_otp' | 'verify_password' | 'new_password'>('choose');
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [otp, setOtp] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            // We fetch the profile first to get the phone number if we don't have it
            const profileRes = await fetch(`${API_URL}/subscriber/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profileData = await profileRes.json();
            
            if (!profileData.success) throw new Error('Failed to fetch profile info');

            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: profileData.data.user.phone })
            });
            const data = await res.json();
            
            if (data.success) {
                setStep('verify_otp');
                Alert.alert('Verification Sent', 'An OTP has been sent to your registered phone number.');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndChange = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/subscriber/change-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    verificationType: step === 'verify_otp' ? 'otp' : 'password',
                    otp: step === 'verify_otp' ? otp : undefined,
                    currentPassword: step === 'verify_password' ? currentPassword : undefined,
                    newPassword
                })
            });
            
            const data = await res.json();
            if (data.success) {
                Alert.alert('Success', 'Your password has been updated successfully.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'choose':
                return (
                    <View style={styles.section}>
                        <Text style={styles.label}>Choose Verification Method</Text>
                        <Text style={styles.description}>To keep your account secure, we need to verify your identity before you can change your password.</Text>
                        
                        <TouchableOpacity style={styles.optionCard} onPress={handleSendOtp}>
                            <View style={styles.optionIcon}>
                                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#3B82F6" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Use OTP</Text>
                                <Text style={styles.optionSub}>We'll send a code to your phone</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionCard} onPress={() => setStep('verify_password')}>
                            <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="key-outline" size={24} color="#10B981" />
                            </View>
                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>Current Password</Text>
                                <Text style={styles.optionSub}>Enter your existing password</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                    </View>
                );

            case 'verify_otp':
                return (
                    <View style={styles.section}>
                        <Text style={styles.label}>Verification Code</Text>
                        <Text style={styles.description}>Enter the 6-digit code sent to your mobile phone.</Text>
                        <TextInput 
                            style={styles.input}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={otp}
                            onChangeText={setOtp}
                        />
                        <TouchableOpacity 
                            style={[styles.primaryButton, (!otp || loading) && styles.disabledButton]} 
                            disabled={!otp || loading}
                            onPress={() => setStep('new_password')}
                        >
                            <Text style={styles.primaryButtonText}>Verify OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSendOtp} style={styles.textButton}>
                            <Text style={styles.textButtonLabel}>Resend Code</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'verify_password':
                return (
                    <View style={styles.section}>
                        <Text style={styles.label}>Current Password</Text>
                        <Text style={styles.description}>Please enter your current password to continue.</Text>
                        <View style={styles.inputContainer}>
                            <TextInput 
                                style={[styles.input, { flex: 1, marginBottom: 0, borderBottomWidth: 0 }]}
                                placeholder="Enter current password"
                                secureTextEntry={!showPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity 
                            style={[styles.primaryButton, (!currentPassword || loading) && styles.disabledButton]} 
                            disabled={!currentPassword || loading}
                            onPress={() => setStep('new_password')}
                        >
                            <Text style={styles.primaryButtonText}>Verify Password</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'new_password':
                return (
                    <View style={styles.section}>
                        <Text style={styles.label}>Set New Password</Text>
                        <Text style={styles.description}>Create a secure password with at least 6 characters.</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>New Password</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm New Password</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="••••••••"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryButton, (!newPassword || !confirmPassword || loading) && styles.disabledButton]} 
                            disabled={!newPassword || !confirmPassword || loading}
                            onPress={handleVerifyAndChange}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <Stack.Screen 
                options={{
                    headerTitle: 'Change Password',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: '#F9FAFB' },
                }} 
            />
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed" size={32} color="#4F46E5" />
                    </View>
                    <Text style={styles.title}>Secure Your Account</Text>
                </View>

                {renderStep()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 24 },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16
    },
    title: { fontSize: 24, fontWeight: '800', color: '#111827' },
    section: { width: '100%' },
    label: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
    description: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
    optionCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16, padding: 16,
        marginBottom: 12,
        borderWidth: 1, borderColor: '#E5E7EB'
    },
    optionIcon: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    optionContent: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    optionSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12, padding: 16,
        fontSize: 16, color: '#111827',
        borderWidth: 1, borderColor: '#E5E7EB',
        marginBottom: 20
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
        marginBottom: 20, paddingRight: 16
    },
    eyeBtn: { padding: 4 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
    primaryButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 12, padding: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
    },
    disabledButton: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    textButton: { alignSelf: 'center', marginTop: 20 },
    textButtonLabel: { color: '#4F46E5', fontSize: 14, fontWeight: '600' }
});
