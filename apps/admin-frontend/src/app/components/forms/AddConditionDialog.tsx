import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';
import { beneficiaryApi } from '../../../services/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryId: string;
  onSuccess: () => void;
}

export const AddConditionDialog: React.FC<Props> = ({ isOpen, onClose, beneficiaryId, onSuccess }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Condition name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      await beneficiaryApi.addCondition(beneficiaryId, { name });
      toast.success('Medical condition added');
      onSuccess();
      setName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add condition');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black text-gray-900">Add Medical Information</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Input 
            placeholder="e.g., Hypertension, Diabetes" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
          />
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full h-12 rounded-2xl bg-[#FF7A00] hover:bg-orange-600 font-bold text-white shadow-lg shadow-orange-200/50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add Condition
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full h-12 rounded-2xl border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
