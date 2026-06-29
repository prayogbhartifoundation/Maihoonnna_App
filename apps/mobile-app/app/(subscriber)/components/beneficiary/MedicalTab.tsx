import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert, Modal, TextInput, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

const MedicalRecordItem = ({ doc, onRefresh, existingRecords }: { doc: any; onRefresh: () => void; existingRecords: any[] }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(doc.title);

    const handleDelete = () => {
        Alert.alert("Delete Record", "Are you sure you want to delete this medical record?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('userToken');
                        const res = await fetch(`${API_URL}/subscriber/beneficiaries/medical-records/${doc.id}`, { 
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            Alert.alert("Deleted", "Record removed successfully.");
                            onRefresh();
                        }
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete record.");
                    }
                }
            }
        ]);
    };

    const handleRename = async () => {
        if (!newTitle.trim()) {
            Alert.alert("Input required", "Please enter a name for the document.");
            return;
        }

        const isDuplicate = existingRecords.some(
            (r: any) => r.id !== doc.id && r.title.toLowerCase() === newTitle.trim().toLowerCase()
        );
        if (isDuplicate) {
            Alert.alert("Duplicate Name", "A document with this name already exists. Please choose a unique name.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/subscriber/beneficiaries/medical-records/${doc.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle.trim() })
            });
            if (res.ok) {
                Alert.alert("Success", "Record renamed.");
                setIsRenaming(false);
                onRefresh();
            }
        } catch (e) {
            Alert.alert("Error", "Failed to rename record.");
        }
    };

    const handleViewDocument = async () => {
        if (doc.fileUrl) {
            try {
                await WebBrowser.openBrowserAsync(doc.fileUrl);
            } catch (error) {
                Alert.alert("Error", "Could not open document.");
            }
        } else {
            Alert.alert("Unavailable", "This document does not have a valid link.");
        }
    };

    return (
        <View>
            <TouchableOpacity style={styles.docRow} onPress={handleViewDocument} activeOpacity={0.7}>
                <Ionicons name="document-text" size={24} color="#F97316" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docMeta}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => setIsRenaming(true)}>
                        <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Rename Modal */}
            <Modal visible={isRenaming} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rename Record</Text>
                        <TextInput 
                            style={styles.modalInput} 
                            value={newTitle} 
                            onChangeText={setNewTitle}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.modalBtn} onPress={handleRename}>
                            <Text style={styles.modalBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsRenaming(false)} style={{ marginTop: 10, alignItems: 'center' }}>
                            <Text style={{ color: '#6B7280' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export const MedicalTab = ({ beneficiary, conditions, onRefresh }: { beneficiary: any, conditions: string[], onRefresh: () => void }) => {
    const [uploading, setUploading] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [docName, setDocName] = useState("");
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

    const handlePickDocument = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                copyToCacheDirectory: true,
            });

            if (res.canceled) return;

            const asset = res.assets[0];
            setSelectedAsset(asset);
            const cleanName = asset.name.split('.').slice(0, -1).join('.') || asset.name;
            setDocName(cleanName);
            setIsUploadModalVisible(true);
        } catch (e: any) {
            console.error("Document picking error:", e);
            Alert.alert("Error", "Failed to select document.");
        }
    };

    const handleConfirmUpload = async () => {
        if (!selectedAsset) return;
        if (!docName.trim()) {
            Alert.alert("Input required", "Please enter a name for the document.");
            return;
        }

        const isDuplicate = (beneficiary.medicalRecords || []).some(
            (r: any) => r.title.toLowerCase() === docName.trim().toLowerCase()
        );
        if (isDuplicate) {
            Alert.alert("Duplicate Name", "A document with this name already exists. Please choose a unique name.");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();

            if (Platform.OS === 'web') {
                const blobResponse = await fetch(selectedAsset.uri);
                const blob = await blobResponse.blob();
                formData.append('file', blob, selectedAsset.name);
            } else {
                formData.append('file', {
                    uri: selectedAsset.uri,
                    name: selectedAsset.name,
                    type: selectedAsset.mimeType || 'application/octet-stream',
                } as any);
            }

            formData.append('title', docName.trim());

            const token = await AsyncStorage.getItem('userToken');
            const uploadRes = await fetch(`${API_URL}/subscriber/beneficiaries/${beneficiary.id}/medical-records/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await uploadRes.json();
            if (data.success) {
                Alert.alert("Success", "Document uploaded successfully.");
                setIsUploadModalVisible(false);
                setSelectedAsset(null);
                setDocName("");
                onRefresh();
            } else {
                Alert.alert("Error", data.message || "Failed to upload document.");
            }
        } catch (e: any) {
            console.error("Upload error:", e);
            Alert.alert("Error", "Failed to upload document.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ paddingHorizontal: 20 }}>
            {/* Medical Conditions */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Medical Conditions</Text>
                <View style={styles.conditionsTags}>
                    {conditions.map((c: string, i: number) => (
                        <View key={i} style={styles.condTagLarge}>
                            <View style={styles.dot} />
                            <Text style={styles.condTagLargeText}>{c}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Current Vitals (Summary Grid in medical tab as per UI) */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Current Vitals</Text>
                <View style={styles.miniVitalsGrid}>
                    {beneficiary.vitalsData?.map((v: any, i: number) => (
                        <View key={i} style={styles.miniVitalItem}>
                            <Text style={styles.miniVitalLabel}>{v.label}</Text>
                            <Text style={styles.miniVitalValue}>{v.value}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Medical Records */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Medical Records</Text>
                {beneficiary.medicalRecords?.length > 0 ? (
                    beneficiary.medicalRecords.map((doc: any, i: number) => (
                        <MedicalRecordItem key={doc.id || i} doc={doc} onRefresh={onRefresh} existingRecords={beneficiary.medicalRecords || []} />
                    ))
                ) : (
                    <View style={styles.emptyRecords}>
                        <Ionicons name="document-outline" size={32} color="#D1D5DB" />
                        <Text style={styles.emptyRecordsText}>No medical records uploaded yet</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument} disabled={uploading}>
                    <Text style={styles.uploadBtnText}>{uploading ? "Uploading..." : "Upload Documents"}</Text>
                </TouchableOpacity>

                {/* Name Document Modal */}
                <Modal visible={isUploadModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Name Document</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                value={docName} 
                                onChangeText={setDocName}
                                placeholder="Enter document name"
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />
                            <TouchableOpacity style={styles.modalBtn} onPress={handleConfirmUpload} disabled={uploading}>
                                <Text style={styles.modalBtnText}>{uploading ? "Uploading..." : "Upload"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setIsUploadModalVisible(false); setSelectedAsset(null); }} style={{ marginTop: 10, alignItems: 'center' }}>
                                <Text style={{ color: '#6B7280' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
            
            {/* Medications */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Current Medications</Text>
                {beneficiary.medicationList?.length > 0 ? (
                    beneficiary.medicationList.map((m: any, i: number) => (
                        <Text key={i} style={styles.medValue}>• {m.name} {m.dosage} ({m.frequency})</Text>
                    ))
                ) : (
                    <Text style={styles.medValue}>No active medications.</Text>
                )}
            </View>

            {/* Physician & Hobbies */}
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Primary Physician</Text>
                <Text style={styles.medValue}>{beneficiary.primaryPhysicianName || 'Not specified'}</Text>
                <Text style={styles.medSubValue}>{beneficiary.primaryPhysicianPhone || ''} {beneficiary.primaryPhysicianSpec ? `(${beneficiary.primaryPhysicianSpec})` : ''}</Text>
            </View>
            <View style={styles.medCard}>
                <Text style={styles.medCardTitle}>Hobbies & Interests</Text>
                <Text style={styles.medValue}>{beneficiary.hobbiesInterests?.join(', ') || 'Not specified'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    medCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
            android: { elevation: 2 },
        }),
    },
    medCardTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
    conditionsTags: { gap: 10 },
    condTagLarge: { backgroundColor: '#FFF5ED', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginRight: 10 },
    condTagLargeText: { fontSize: 14, color: '#111827', fontWeight: '500' },
    
    miniVitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    miniVitalItem: { width: (width - 80) / 2, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10 },
    miniVitalLabel: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
    miniVitalValue: { fontSize: 14, fontWeight: '700', color: '#111827' },

    docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    docTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
    docMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    emptyRecords: { alignItems: 'center', paddingVertical: 20 },
    emptyRecordsText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
    uploadBtn: { backgroundColor: '#F97316', borderRadius: 12, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    uploadBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

    medValue: { fontSize: 14, color: '#111827', lineHeight: 22 },
    medSubValue: { fontSize: 13, color: '#6B7280', marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    modalInput: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    modalBtn: { backgroundColor: '#F97316', padding: 14, borderRadius: 10, alignItems: 'center' },
    modalBtnText: { color: '#FFF', fontWeight: '700' },
});

export default MedicalTab;
