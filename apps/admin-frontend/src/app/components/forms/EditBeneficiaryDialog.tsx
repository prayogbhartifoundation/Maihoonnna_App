import React from 'react';
import { FieldDefinition, GenericEditDialog } from './GenericEditDialog';
import { beneficiaryApi } from '../../../services/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  beneficiary: any;
  onSuccess: () => void;
}

export const EditBeneficiaryDialog: React.FC<Props> = ({ isOpen, onClose, beneficiary, onSuccess }) => {
  const primaryContact = Array.isArray(beneficiary?.emergencyContacts)
    ? beneficiary.emergencyContacts.find((c: any) => c.isPrimary) || beneficiary.emergencyContacts[0]
    : null;

  const isFallback = primaryContact?.name?.toLowerCase() === 'subscriber';

  // Normalize dateOfBirth: the API returns a full ISO string (e.g. "1961-01-15T00:00:00.000Z")
  // The date input needs just YYYY-MM-DD.  We normalize here so the form opens pre-filled.
  const rawDob = beneficiary?.dateOfBirth;
  const normalizedDob = rawDob
    ? (typeof rawDob === 'string' ? rawDob.split('T')[0] : new Date(rawDob).toISOString().split('T')[0])
    : '';

  // Only include the fields this dialog actually edits.
  // Do NOT spread the entire beneficiary object — it contains visits, conditions,
  // vitalReadings, etc. that would be accidentally sent to the PUT endpoint.
  const initialData = {
    name: beneficiary?.name || '',
    dateOfBirth: normalizedDob,   // pre-filled YYYY-MM-DD from DB
    age: beneficiary?.age ?? '',
    gender: beneficiary?.gender || '',
    relationship: beneficiary?.relationship || '',
    address: beneficiary?.address || '',
    city: beneficiary?.city || '',
    state: beneficiary?.state || '',
    pincode: beneficiary?.pincode || '',
    primaryPhysicianName: beneficiary?.primaryPhysicianName || '',
    primaryPhysicianPhone: beneficiary?.primaryPhysicianPhone || '',
    isActive: beneficiary?.isActive ?? true,
    emergencyContactName: isFallback ? '' : (primaryContact?.name || ''),
    emergencyContactPhone: isFallback ? '' : (primaryContact?.phone || ''),
    emergencyContactRelationship: isFallback ? '' : (primaryContact?.relationship || ''),
  };

  const fields: FieldDefinition[] = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
      ],
    },
    { key: 'relationship', label: 'Relationship to Subscriber', type: 'text' },
    { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'text' },
    { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', type: 'text' },
    { key: 'emergencyContactRelationship', label: 'Emergency Contact Relationship', type: 'text' },
    { key: 'address', label: 'Street Address', type: 'textarea' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'pincode', label: 'Pincode', type: 'text' },
    { key: 'primaryPhysicianName', label: 'Primary Physician Name', type: 'text' },
    { key: 'primaryPhysicianPhone', label: 'Primary Physician Phone', type: 'text' },
    { key: 'isActive', label: 'Account Active', type: 'boolean' },
  ];

  const handleSave = async (data: any) => {
    try {
      // Build a clean payload — only the fields editable in this dialog.
      // This prevents the PUT endpoint from accidentally receiving and processing
      // nested objects like visits[], conditions[], vitalReadings[], etc.
      const payload: Record<string, any> = {
        name: data.name,
        gender: data.gender,
        relationship: data.relationship,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        primaryPhysicianName: data.primaryPhysicianName,
        primaryPhysicianPhone: data.primaryPhysicianPhone,
        isActive: data.isActive,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
      };

      // Include dateOfBirth only when the user has actually set one.
      // An empty string means "no DOB" — we pass null to clear it.
      payload.dateOfBirth = data.dateOfBirth || null;

      await beneficiaryApi.update(beneficiary.id, payload);
      toast.success('Beneficiary profile updated successfully');
      onSuccess();
    } catch (err: any) {
      throw err; // Passed up to GenericEditDialog to show error banner
    }
  };

  return (
    <GenericEditDialog
      title="Edit Care Profile"
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      initialData={initialData}
      fields={fields}
    />
  );
};
