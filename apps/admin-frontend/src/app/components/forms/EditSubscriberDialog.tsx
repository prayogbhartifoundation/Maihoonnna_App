import React from 'react';
import { FieldDefinition, GenericEditDialog } from './GenericEditDialog';
import { subscriberApi } from '../../../services/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subscriber: any;
  onSuccess: () => void;
}

export const EditSubscriberDialog: React.FC<Props> = ({ isOpen, onClose, subscriber, onSuccess }) => {
  const fields: FieldDefinition[] = [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone Number', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'location', label: 'General Location', type: 'text' },
    { key: 'isActive', label: 'Account Active', type: 'boolean' },
  ];

  const handleSave = async (data: any) => {
    try {
      await subscriberApi.update(subscriber.id, data);
      toast.success('Subscriber profile updated successfully');
      onSuccess();
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <GenericEditDialog
      title="Edit Subscriber Profile"
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      initialData={subscriber}
      fields={fields}
    />
  );
};
