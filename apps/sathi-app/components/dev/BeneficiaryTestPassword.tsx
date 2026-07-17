/**
 * ⚠️  DEV-ONLY COMPONENT — Remove this file and its usage in beneficiary-info.tsx
 *     when done testing.
 *
 * Renders a small "Set Test Password" panel at the bottom of the beneficiary form.
 * After the subscriber enrolls a beneficiary, they can use this component to set
 * a login password for that beneficiary by entering their phone + desired password.
 *
 * The component calls POST /api/dev/set-beneficiary-password (dev.routes.ts).
 *
 * HOW TO USE IN beneficiary-info.tsx:
 *   1. Add import at the top (already marked with DEV ONLY):
 *        import BeneficiaryTestPassword from '@/components/dev/BeneficiaryTestPassword';
 *   2. Add at the bottom of the ScrollView before the closing tag:
 *        <BeneficiaryTestPassword prefillPhone={beneficiaryForm.phone} />
 */

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';

interface Props {
    /** Pre-fill with the beneficiary's phone from the form above */
    prefillPhone?: string;
}

export default function BeneficiaryTestPassword({ prefillPhone = '' }: Props) {
    const [phone, setPhone] = useState(prefillPhone);
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSet = async () => {
        if (!phone.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Enter both phone number and password.');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${API_URL}/dev/set-beneficiary-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
            });
            const json = await res.json();
            setResult({ success: json.success, message: json.message || json.hint || '' });
        } catch (e: any) {
            setResult({ success: false, message: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.card}>
            {/* Banner */}
            <View style={styles.banner}>
                <Ionicons name="construct-outline" size={14} color="#92400E" />
                <Text style={styles.bannerText}>⚠️ DEV ONLY — Set Beneficiary Test Password</Text>
            </View>

            <Text style={styles.hint}>
                Enroll the beneficiary first, then come back here to set a password so
                they can log in for testing.
            </Text>

            <Text style={styles.label}>Beneficiary Phone</Text>
            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit phone"
                keyboardType="phone-pad"
                maxLength={13}
            />

            <Text style={styles.label}>Set Password</Text>
            <View style={styles.pwdRow}>
                <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 4 characters"
                    secureTextEntry={!showPwd}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleSet} disabled={loading}>
                {loading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={styles.btnText}>Set Password</Text>
                }
            </TouchableOpacity>

            {result && (
                <View style={[styles.resultBox, { borderColor: result.success ? '#10B981' : '#EF4444' }]}>
                    <Ionicons
                        name={result.success ? 'checkmark-circle-outline' : 'close-circle-outline'}
                        size={16}
                        color={result.success ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[styles.resultText, { color: result.success ? '#065F46' : '#991B1B' }]}>
                        {result.message}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F59E0B',
        borderStyle: 'dashed',
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    bannerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
        letterSpacing: 0.3,
    },
    hint: {
        fontSize: 12,
        color: '#78350F',
        marginBottom: 14,
        lineHeight: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#FFF',
        marginBottom: 12,
    },
    pwdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    eyeBtn: {
        paddingHorizontal: 10,
    },
    btn: {
        backgroundColor: '#D97706',
        borderRadius: 8,
        paddingVertical: 11,
        alignItems: 'center',
    },
    btnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    resultBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: '#F9FAFB',
    },
    resultText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
});
