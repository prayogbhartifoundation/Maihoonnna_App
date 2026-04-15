import React, { useState, Dispatch, SetStateAction } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

interface PersonalTabProps {
    user: {
        name: string;
        email: string;
        phone: string;
        location?: string;
        createdAt: string;
        isVerified: boolean;
    };
    onUpdate?: () => void;
}

interface PersonalFormData {
    name: string;
    email: string;
    location: string;
}

interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    verified?: boolean;
    field?: keyof PersonalFormData;
    type?: 'ionicons' | 'material';
    isEditing: boolean;
    formData: PersonalFormData;
    setFormData: Dispatch<SetStateAction<PersonalFormData>>;
}

const InfoRow = ({ icon, label, value, verified, field, type = 'ionicons', isEditing, formData, setFormData }: InfoRowProps) => (
    <View style={styles.infoRow}>
        <View style={styles.iconBox}>
            {type === 'ionicons' ? (
                <Ionicons name={icon as any} size={20} color="#F97316" />
            ) : (
                <MaterialCommunityIcons name={icon as any} size={20} color="#F97316" />
            )}
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            {isEditing && field ? (
                <TextInput 
                    style={styles.editableInput}
                    value={formData[field]}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                    placeholder={`Enter ${label}`}
                    autoCapitalize={field === 'email' ? 'none' : 'words'}
                />
            ) : (
                <View style={styles.valueRow}>
                    <Text style={styles.infoValue}>{value || 'Not specified'}</Text>
                    {verified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    </View>
);

export const PersonalTab = ({ user, onUpdate }: PersonalTabProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PersonalFormData>({
        name: user.name || '',
        email: user.email || '',
        location: user.location || ''
    });

    // Sync state if user prop changes (important for re-fetches)
    React.useEffect(() => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            location: user.location || ''
        });
    }, [user]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toDateString();
        } catch (e) {
            return dateStr;
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/subscriber/profile`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await res.json();
            if (data.success) {
                setIsEditing(false);
                if (onUpdate) onUpdate();
                Alert.alert('Profile Updated', 'Your changes have been saved successfully.');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                {!isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={20} color="#F97316" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerButtons}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
                            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.card}>
                <InfoRow 
                    icon="person-outline" label="Full Name" value={user.name} field="name" 
                    isEditing={isEditing} formData={formData} setFormData={setFormData} 
                />
                <View style={styles.divider} />
                <InfoRow 
                    icon="mail-outline" label="Email Address" value={user.email} verified={user.isVerified} field="email" 
                    isEditing={isEditing} formData={formData} setFormData={setFormData} 
                />
                <View style={styles.divider} />
                <InfoRow 
                    icon="call-outline" label="Phone Number" value={user.phone} verified={true} 
                    isEditing={isEditing} formData={formData} setFormData={setFormData} 
                />
                <View style={styles.divider} />
                <InfoRow 
                    icon="location-outline" label="Address" value={user.location || ''} field="location" 
                    isEditing={isEditing} formData={formData} setFormData={setFormData} 
                />
                <View style={styles.divider} />
                <InfoRow 
                    icon="calendar-outline" label="Member Since" value={formatDate(user.createdAt)} 
                    isEditing={isEditing} formData={formData} setFormData={setFormData} 
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingTop: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    headerButtons: { flexDirection: 'row', alignItems: 'center' },
    cancelBtn: { marginRight: 15 },
    cancelText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
    saveBtn: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    iconBox: {
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: '#FFF5ED', 
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
    editableInput: {
        fontSize: 15, fontWeight: '600', color: '#F97316',
        borderBottomWidth: 1, borderBottomColor: '#FBD38D',
        paddingVertical: 2
    },
    valueRow: { flexDirection: 'row', alignItems: 'center' },
    infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
    verifiedBadge: { 
        backgroundColor: '#ECFDF5', 
        paddingHorizontal: 8, paddingVertical: 2, 
        borderRadius: 10, marginLeft: 10 
    },
    verifiedText: { fontSize: 10, fontWeight: '700', color: '#059669' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 55 }
});

export default PersonalTab;
