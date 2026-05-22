import React, { useState, useEffect } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Modal,
    View,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

interface CallbackButtonProps {
    subscriberId?: string;
    beneficiaryId?: string;
    notes?: string;
    label?: string;
    style?: any;
    textStyle?: any;
}

export const CallbackButton: React.FC<CallbackButtonProps> = ({
    subscriberId,
    beneficiaryId,
    notes,
    label = 'Request Callback',
    style,
    textStyle,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (modalVisible) {
            const loadUserData = async () => {
                try {
                    const stored = await AsyncStorage.getItem('userData');
                    if (stored) {
                        const user = JSON.parse(stored);
                        if (!name && user.name) setName(user.name);
                        if (!phone && user.phone) setPhone(user.phone);
                    }
                } catch (e) {
                    console.log('Failed to load user data for callback prefill', e);
                }
            };
            loadUserData();
        }
    }, [modalVisible]);

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert('Required', 'Please enter your name and phone number.');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/shared/callbacks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    subscriberId: subscriberId || null,
                    beneficiaryId: beneficiaryId || null,
                    notes: notes || 'Requested from mobile app',
                }),
            });
            const json = await response.json();
            if (json.success) {
                setSubmitted(true);
            } else {
                throw new Error(json.message || 'Server error');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setModalVisible(false);
        setSubmitted(false);
        setName('');
        setPhone('');
    };

    return (
        <>
            {/* ── Trigger Button ── */}
            <TouchableOpacity
                style={[styles.button, style]}
                onPress={() => setModalVisible(true)}
            >
                <Ionicons name="call-outline" size={18} color="#F97316" style={{ marginRight: 8 }} />
                <Text style={[styles.buttonText, textStyle]}>{label}</Text>
            </TouchableOpacity>

            {/* ── Modal ── */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    {/* Dark backdrop tap → dismiss keyboard */}
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={StyleSheet.absoluteFillObject} />
                    </TouchableWithoutFeedback>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.avoidView}
                    >
                        {submitted ? (
                            /* ── Success State ── */
                            <View style={styles.sheet}>
                                <View style={styles.successIconWrap}>
                                    <Ionicons name="checkmark-circle" size={60} color="#F97316" />
                                </View>
                                <Text style={styles.successTitle}>We'll get back to you soon!</Text>
                                <Text style={styles.successSub}>
                                    Our care expert will call you at {phone} within 15–30 minutes.
                                </Text>
                                <TouchableOpacity style={styles.submitBtn} onPress={handleClose}>
                                    <Text style={styles.submitBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            /* ── Form State ── */
                            <View style={styles.sheet}>
                                {/* Header */}
                                <View style={styles.header}>
                                    <Text style={styles.title}>Request a Callback</Text>
                                    <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Ionicons name="close" size={24} color="#4B5563" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.sub}>
                                    Our care expert will call you back within 15–30 minutes.
                                </Text>

                                {/* Full Name */}
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Rahul Sharma"
                                    placeholderTextColor="#9CA3AF"
                                    value={name}
                                    onChangeText={setName}
                                    returnKeyType="next"
                                />

                                {/* Phone */}
                                <Text style={[styles.label, { marginTop: 14 }]}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 9876543210"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSubmit}
                                />

                                {/* Submit */}
                                <TouchableOpacity
                                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Submit Request</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#F97316',
        fontWeight: '600',
        fontSize: 15,
    },

    // Modal structure
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    avoidView: {
        width: '100%',
    },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },

    // Form
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    sub: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#111827',
    },
    submitBtn: {
        backgroundColor: '#F97316',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Success state
    successIconWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF5ED',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 10,
    },
    successSub: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 12,
        marginBottom: 28,
    },
});
