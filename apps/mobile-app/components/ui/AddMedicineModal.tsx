import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export interface MedicationFormData {
    id?: string;
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    startDate?: string;
    endDate?: string;
    timesPerDay?: string[];
    setReminders?: boolean;
}

interface AddMedicineModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (medicine: MedicationFormData) => Promise<void> | void;
    initialData?: MedicationFormData | null;
    loading?: boolean;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
    visible,
    onClose,
    onSave,
    initialData,
    loading = false,
}) => {
    const getTodayFormatted = () => {
        const d = new Date();
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatEditingDate = (text: string) => {
        const clean = text.replace(/[^0-9]/g, '');
        if (clean.length <= 2) return clean;
        if (clean.length <= 4) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
        return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 8)}`;
    };

    const [form, setForm] = useState<MedicationFormData>({
        name: '',
        dosage: '',
        frequency: 'twice_daily',
        instructions: '',
        startDate: getTodayFormatted(),
        endDate: '',
        timesPerDay: [],
        setReminders: false,
    });

    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);

    useEffect(() => {
        if (initialData) {
            setForm({
                id: initialData.id,
                name: initialData.name || '',
                dosage: initialData.dosage || '',
                frequency: initialData.frequency || 'twice_daily',
                instructions: initialData.instructions || '',
                startDate: initialData.startDate || getTodayFormatted(),
                endDate: initialData.endDate || '',
                timesPerDay: initialData.timesPerDay || [],
                setReminders: !!initialData.setReminders,
            });
        } else {
            setForm({
                name: '',
                dosage: '',
                frequency: 'twice_daily',
                instructions: '',
                startDate: getTodayFormatted(),
                endDate: '',
                timesPerDay: [],
                setReminders: false,
            });
        }
    }, [initialData, visible]);

    const handleConfirmStartDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setForm({ ...form, startDate: `${day}-${month}-${year}` });
        setStartDatePickerVisibility(false);
    };

    const handleConfirmEndDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setForm({ ...form, endDate: `${day}-${month}-${year}` });
        setEndDatePickerVisibility(false);
    };

    const toggleTimeSlot = (slot: string) => {
        let maxSlots = 3;
        if (form.frequency === 'once_daily') maxSlots = 1;
        else if (form.frequency === 'twice_daily') maxSlots = 2;

        let current = form.timesPerDay || [];
        if (current.includes(slot)) {
            setForm({ ...form, timesPerDay: current.filter(s => s !== slot) });
        } else {
            if (current.length >= maxSlots) {
                Alert.alert("Limit Reached", `Selected frequency allows maximum ${maxSlots} time slots.`);
                return;
            }
            setForm({ ...form, timesPerDay: [...current, slot] });
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert("Input Required", "Please enter medication name.");
            return;
        }
        await onSave(form);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalMedicineContent}>
                    <Text style={styles.modalTitle}>
                        {initialData ? 'Edit Medicine' : 'Add Medicine'}
                    </Text>

                    <Text style={styles.inputLabelSm}>Medication Name *</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="e.g., Amoxicillin, Paracetamol"
                        placeholderTextColor="#9CA3AF"
                        value={form.name}
                        maxLength={50}
                        onChangeText={(t) => setForm({ ...form, name: t })}
                    />

                    <View style={styles.splitRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.inputLabelSm}>Dosage</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. 500mg, 1 tablet"
                                placeholderTextColor="#9CA3AF"
                                value={form.dosage}
                                maxLength={30}
                                onChangeText={(t) => setForm({ ...form, dosage: t })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabelSm}>Frequency</Text>
                            <View style={styles.timeChipsRow}>
                                {[
                                    { label: 'Once', value: 'once_daily' },
                                    { label: 'Twice', value: 'twice_daily' },
                                    { label: 'Thrice', value: 'thrice_daily' }
                                ].map((f) => (
                                    <TouchableOpacity
                                        key={f.value}
                                        style={[
                                            styles.timeChip,
                                            form.frequency === f.value ? styles.timeChipSelected : styles.timeChipUnselected,
                                            { paddingVertical: 8 }
                                        ]}
                                        onPress={() => {
                                            let maxSlots = 3;
                                            if (f.value === 'once_daily') maxSlots = 1;
                                            else if (f.value === 'twice_daily') maxSlots = 2;
                                            const truncatedTimes = (form.timesPerDay || []).slice(0, maxSlots);
                                            setForm({ ...form, frequency: f.value, timesPerDay: truncatedTimes });
                                        }}
                                    >
                                        <Text style={[styles.timeChipText, { fontSize: 11 }]}>{f.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <Text style={styles.inputLabelSm}>Instructions (Optional)</Text>
                    <TextInput
                        style={styles.modalInput}
                        placeholder="e.g., Take after food"
                        placeholderTextColor="#9CA3AF"
                        value={form.instructions || ''}
                        maxLength={100}
                        onChangeText={(t) => setForm({ ...form, instructions: t })}
                    />

                    <View style={styles.splitRow}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.inputLabelSm}>Start Date *</Text>
                            <TouchableOpacity
                                style={styles.modalInputWithIcon}
                                onPress={() => setStartDatePickerVisibility(true)}
                            >
                                <TextInput
                                    style={styles.modalFlexInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.startDate}
                                    maxLength={10}
                                    onChangeText={(t) => setForm({ ...form, startDate: formatEditingDate(t) })}
                                />
                                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabelSm}>End Date (Optional)</Text>
                            <TouchableOpacity
                                style={styles.modalInputWithIcon}
                                onPress={() => setEndDatePickerVisibility(true)}
                            >
                                <TextInput
                                    style={styles.modalFlexInput}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.endDate}
                                    maxLength={10}
                                    onChangeText={(t) => setForm({ ...form, endDate: formatEditingDate(t) })}
                                />
                                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.dividerLine} />

                    <View style={styles.splitRowBetween}>
                        <Text style={styles.inputLabelSm}>Times per day</Text>
                        <Text style={styles.timesCountText}>{(form.timesPerDay || []).length} times</Text>
                    </View>

                    <View style={styles.timeChipsRow}>
                        {['Morning', 'Afternoon', 'Evening'].map((slot) => {
                            const isSelected = (form.timesPerDay || []).includes(slot);
                            return (
                                <TouchableOpacity
                                    key={slot}
                                    style={[styles.timeChip, isSelected ? styles.timeChipSelected : styles.timeChipUnselected]}
                                    onPress={() => toggleTimeSlot(slot)}
                                >
                                    <Text style={[styles.timeChipText, isSelected ? styles.timeChipTextSelected : styles.timeChipTextUnselected]}>{slot}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.reminderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="notifications-outline" size={20} color="#4B5563" />
                            <Text style={styles.reminderText}>Set Reminders</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#D1D5DB", true: "#FDBA74" }}
                            thumbColor={form.setReminders ? "#F97316" : "#F3F4F6"}
                            ios_backgroundColor="#D1D5DB"
                            onValueChange={(v) => setForm({ ...form, setReminders: v })}
                            value={!!form.setReminders}
                        />
                    </View>

                    <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSave} disabled={loading}>
                        <Text style={styles.modalPrimaryBtnText}>
                            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Medication'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onClose} disabled={loading}>
                        <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>

                <DateTimePickerModal
                    isVisible={isStartDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmStartDate}
                    onCancel={() => setStartDatePickerVisibility(false)}
                />

                <DateTimePickerModal
                    isVisible={isEndDatePickerVisible}
                    mode="date"
                    onConfirm={handleConfirmEndDate}
                    onCancel={() => setEndDatePickerVisibility(false)}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalMedicineContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    inputLabelSm: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 14,
        color: '#111827',
    },
    modalInputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    modalFlexInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#111827',
    },
    splitRow: {
        flexDirection: 'row',
    },
    splitRowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timesCountText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    timeChipsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    timeChip: {
        flex: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderWidth: 1,
    },
    timeChipSelected: {
        backgroundColor: '#FFF5ED',
        borderColor: '#F97316',
    },
    timeChipUnselected: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    timeChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timeChipTextSelected: {
        color: '#F97316',
    },
    timeChipTextUnselected: {
        color: '#6B7280',
    },
    dividerLine: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 4,
    },
    reminderText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    modalPrimaryBtn: {
        backgroundColor: '#F97316',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginBottom: 8,
    },
    modalPrimaryBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    modalSecondaryBtn: {
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
    },
    modalSecondaryBtnText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default AddMedicineModal;
