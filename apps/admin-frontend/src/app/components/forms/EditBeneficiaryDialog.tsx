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
      ]
    },
    { key: 'relationship', label: 'Relationship to Subscriber', type: 'text' },
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
      await beneficiaryApi.update(beneficiary.id, data);
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
      initialData={beneficiary}
      fields={fields}
    />
  );
};
