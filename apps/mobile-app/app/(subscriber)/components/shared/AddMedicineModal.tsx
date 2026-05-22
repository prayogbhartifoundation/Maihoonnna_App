import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Switch,
    StyleSheet,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Medication = {
    name: string;
    dosage: string;
    frequency: string;
    timeSlots: string[];
    setReminders: boolean;
};

interface AddMedicineModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: (medication: Medication) => void;
}

const FREQUENCIES = [
    { label: 'Once Daily', value: 'once_daily' },
    { label: 'Twice Daily', value: 'twice_daily' },
    { label: 'Thrice Daily', value: 'thrice_daily' },
];

// How many time slots map to each frequency
const FREQUENCY_TIMES: Record<string, number> = {
    'once_daily': 1,
    'twice_daily': 2,
    'thrice_daily': 3,
};

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const EMPTY: Medication = {
    name: '',
    dosage: '',
    frequency: 'once_daily',
    timeSlots: [],
    setReminders: true,
};

const AddMedicineModal = ({ visible, onClose, onAdd }: AddMedicineModalProps) => {
    const [form, setForm] = useState<Medication>({ ...EMPTY });
    const [showFreqPicker, setShowFreqPicker] = useState(false);

    const timesPerDay = FREQUENCY_TIMES[form.frequency] ?? 1;

    const toggleSlot = (slot: string) => {
        setForm(prev => {
            const already = prev.timeSlots.includes(slot);
            const updated = already
                ? prev.timeSlots.filter(s => s !== slot)
                : [...prev.timeSlots, slot];
            return { ...prev, timeSlots: updated };
        });
    };

    const handleAdd = () => {
        if (!form.name.trim()) return;
        onAdd({ ...form });
        setForm({ ...EMPTY });
        onClose();
    };

    const handleCancel = () => {
        setForm({ ...EMPTY });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Add Medicine</Text>

                    {/* Medication Name */}
                    <Text style={styles.label}>Medication Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Amoxicillin"
                        placeholderTextColor="#C4C4C4"
                        value={form.name}
                        onChangeText={t => setForm(p => ({ ...p, name: t }))}
                        autoFocus
                    />

                    {/* Dosage + Frequency Row */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={styles.label}>Dosage</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="250mg"
                                placeholderTextColor="#C4C4C4"
                                value={form.dosage}
                                onChangeText={t => setForm(p => ({ ...p, dosage: t }))}
                            />
                        </View>

                        <View style={{ flex: 1.2 }}>
                            <Text style={styles.label}>Frequency</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setShowFreqPicker(!showFreqPicker)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dropdownText}>
                                    {FREQUENCIES.find(f => f.value === form.frequency)?.label ?? form.frequency}
                                </Text>
                                <Ionicons
                                    name={showFreqPicker ? 'chevron-up' : 'chevron-down'}
                                    size={16}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>

                            {/* Inline Picker */}
                            {showFreqPicker && (
                                <View style={styles.pickerList}>
                                    {FREQUENCIES.map(f => (
                                        <TouchableOpacity
                                            key={f.value}
                                            style={[
                                                styles.pickerItem,
                                                form.frequency === f.value && styles.pickerItemActive,
                                            ]}
                                            onPress={() => {
                                                setForm(p => ({ ...p, frequency: f.value, timeSlots: [] }));
                                                setShowFreqPicker(false);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.pickerItemText,
                                                    form.frequency === f.value && styles.pickerItemTextActive,
                                                ]}
                                            >
                                                {f.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Times per day */}
                    <View style={styles.timesRow}>
                        <Text style={styles.label}>Times per day</Text>
                        <Text style={styles.timesCount}>{timesPerDay} {timesPerDay === 1 ? 'time' : 'times'}</Text>
                    </View>

                    {/* Time Slot Chips */}
                    <View style={styles.chipsRow}>
                        {TIME_SLOTS.map(slot => {
                            const active = form.timeSlots.includes(slot);
                            return (
                                <TouchableOpacity
                                    key={slot}
                                    onPress={() => toggleSlot(slot)}
                                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Set Reminders */}
                    <View style={styles.remindersRow}>
                        <View style={styles.remindersLeft}>
                            <Ionicons name="notifications-outline" size={20} color="#4B6CB7" />
                            <Text style={styles.remindersText}>Set Reminders</Text>
                        </View>
                        <Switch
                            value={form.setReminders}
                            onValueChange={v => setForm(p => ({ ...p, setReminders: v }))}
                            trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
                            thumbColor={form.setReminders ? '#F97316' : '#f4f3f4'}
                            ios_backgroundColor="#D1D5DB"
                        />
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity
                        style={[styles.addBtn, !form.name.trim() && { opacity: 0.5 }]}
                        onPress={handleAdd}
                        disabled={!form.name.trim()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.addBtnText}>Add to Schedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 28,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 24,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 13,
        fontSize: 15,
        color: '#111827',
        marginBottom: 18,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dropdown: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    dropdownText: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    pickerList: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 999,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 8 },
        }),
    },
    pickerItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pickerItemActive: {
        backgroundColor: '#FFF5ED',
    },
    pickerItemText: {
        fontSize: 14,
        color: '#374151',
    },
    pickerItemTextActive: {
        color: '#F97316',
        fontWeight: '700',
    },
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    timesCount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 22,
    },
    chip: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 50,
    },
    chipActive: {
        backgroundColor: '#F97316',
    },
    chipInactive: {
        backgroundColor: '#E5E7EB',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    chipTextInactive: {
        color: '#6B7280',
    },
    remindersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 24,
    },
    remindersLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    remindersText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    addBtn: {
        backgroundColor: '#F97316',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    addBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    cancelBtn: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default AddMedicineModal;
