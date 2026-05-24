import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
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
import { AddressInputField } from '@/components/ui/AddressInputField';

interface PersonalTabProps {
    user: {
        name: string;
        email: string;
        phone: string;
        location?: string;
        flatPlot?: string;
        streetArea?: string;
        landmark?: string;
        city?: string;
        state?: string;
        pincode?: string;
        latitude?: number;
        longitude?: number;
        createdAt: string;
        isVerified: boolean;
    };
    onUpdate?: () => void;
}

interface PersonalFormData {
    name: string;
    email: string;
    location: string;
    flatPlot: string;
    streetArea: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
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
        <View style={[styles.iconBox, iconToneByLabel[label]?.box]}>
            {type === 'ionicons' ? (
                <Ionicons name={icon as any} size={23} color={iconToneByLabel[label]?.color || '#FF5B0A'} />
            ) : (
                <MaterialCommunityIcons name={icon as any} size={23} color={iconToneByLabel[label]?.color || '#FF5B0A'} />
            )}
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            {isEditing && field ? (
                <TextInput 
                    style={styles.editableInput}
                    value={String(formData[field])}
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

const iconToneByLabel: Record<string, { color: string; box: object }> = {
    'Full Name': { color: '#FF5B0A', box: { backgroundColor: '#FFEBCB' } },
    'Email Address': { color: '#1F6BFF', box: { backgroundColor: '#DDEBFF' } },
    'Phone Number': { color: '#16A34A', box: { backgroundColor: '#D8F9E1' } },
    Address: { color: '#A12BFF', box: { backgroundColor: '#F2DFFF' } },
    'Member Since': { color: '#E8A400', box: { backgroundColor: '#FFF4B8' } },
};

export const PersonalTab = ({ user, onUpdate }: PersonalTabProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PersonalFormData>({
        name: user.name || '',
        email: user.email || '',
        location: user.location || '',
        flatPlot: user.flatPlot || '',
        streetArea: user.streetArea || '',
        landmark: user.landmark || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        latitude: user.latitude || 0,
        longitude: user.longitude || 0
    });

    // Sync state if user prop changes (important for re-fetches)
    useEffect(() => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            location: user.location || '',
            flatPlot: user.flatPlot || '',
            streetArea: user.streetArea || '',
            landmark: user.landmark || '',
            city: user.city || '',
            state: user.state || '',
            pincode: user.pincode || '',
            latitude: user.latitude || 0,
            longitude: user.longitude || 0
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
                {isEditing && (
                    <View style={styles.editAddressSection}>
                        <AddressInputField
                            label=""
                            value={formData.location}
                            onChangeText={(t) => setFormData(prev => ({ ...prev, location: t }))}
                            onLocationFetched={(details) => setFormData(prev => ({
                                ...prev,
                                location: details.address || prev.location,
                                city: details.city || prev.city,
                                state: details.state || prev.state,
                                pincode: details.pincode || prev.pincode,
                                latitude: details.latitude || 0,
                                longitude: details.longitude || 0,
                                streetArea: details.address?.split(',')[0] || prev.streetArea
                            }))}
                        />
                        <View style={styles.addressGrid}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>Flat/Plot</Text>
                                <TextInput 
                                    style={styles.gridInput} 
                                    value={formData.flatPlot} 
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, flatPlot: t }))}
                                    placeholder="e.g. 402"
                                />
                            </View>
                            <View style={[styles.gridItem, { flex: 1.5 }]}>
                                <Text style={styles.gridLabel}>Street/Area</Text>
                                <TextInput 
                                    style={styles.gridInput} 
                                    value={formData.streetArea} 
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, streetArea: t }))}
                                    placeholder="e.g. Sector 15"
                                />
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Landmark</Text>
                            <TextInput 
                                style={styles.gridInput} 
                                value={formData.landmark} 
                                onChangeText={(t) => setFormData(prev => ({ ...prev, landmark: t }))}
                                placeholder="Near..."
                            />
                        </View>
                        <View style={styles.addressGrid}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>City</Text>
                                <TextInput 
                                    style={styles.gridInput} 
                                    value={formData.city} 
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, city: t }))}
                                />
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>Pincode</Text>
                                <TextInput 
                                    style={styles.gridInput} 
                                    value={formData.pincode} 
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, pincode: t }))}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>State</Text>
                            <TextInput 
                                style={styles.gridInput} 
                                value={formData.state} 
                                onChangeText={(t) => setFormData(prev => ({ ...prev, state: t }))}
                            />
                        </View>
                    </View>
                )}
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
    container: {
        marginHorizontal: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        borderWidth: 1,
        borderColor: '#F2E7DE',
        shadowColor: '#4A2B17',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    sectionTitle: { fontSize: 20, fontWeight: '600', color: '#111111' },
    headerButtons: { flexDirection: 'row', alignItems: 'center' },
    cancelBtn: { marginRight: 15 },
    cancelText: { color: '#566174', fontSize: 14, fontWeight: '600' },
    saveBtn: { backgroundColor: '#FF5B0A', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
    saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    card: {
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: 0,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
    iconBox: {
        width: 47, height: 47, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 14
    },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 13, color: '#3A3A3A', marginBottom: 3, fontWeight: '400' },
    editableInput: {
        fontSize: 16, fontWeight: '600', color: '#111111',
        borderBottomWidth: 1, borderBottomColor: '#FFB47D',
        paddingVertical: 2
    },
    valueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    infoValue: { fontSize: 16, fontWeight: '600', color: '#111111', lineHeight: 21 },
    verifiedBadge: { 
        backgroundColor: '#EAFBF0',
        paddingHorizontal: 9, paddingVertical: 2,
        borderRadius: 11, marginLeft: 9
    },
    verifiedText: { fontSize: 11, fontWeight: '500', color: '#16A34A' },
    divider: { height: 0, backgroundColor: 'transparent', marginLeft: 61 },
    editAddressSection: { marginTop: 8, paddingLeft: 61 },
    addressGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    gridItem: { flex: 1, marginBottom: 10 },
    gridLabel: { fontSize: 12, color: '#566174', marginBottom: 5 },
    gridInput: {
        fontSize: 14, fontWeight: '600', color: '#111111',
        backgroundColor: '#FFFDFC', borderWidth: 1, borderColor: '#F1DED0',
        borderRadius: 10, padding: 9
    }
});

export default PersonalTab;
