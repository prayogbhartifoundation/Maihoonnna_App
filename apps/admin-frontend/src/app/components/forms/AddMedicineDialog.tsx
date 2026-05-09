import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Bell } from 'lucide-react';
import { beneficiaryApi } from '../../../services/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  beneficiaryId: string;
  onSuccess: () => void;
}

export const AddMedicineDialog: React.FC<Props> = ({ isOpen, onClose, beneficiaryId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    timeSlots: [] as string[],
    setReminders: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructions: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const toggleSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot) 
        ? prev.timeSlots.filter(s => s !== slot)
        : [...prev.timeSlots, slot]
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.dosage) {
      toast.error('Name and dosage are required');
      return;
    }
    
    setIsSaving(true);
    try {
      await beneficiaryApi.addMedication(beneficiaryId, formData);
      toast.success('Medication added to schedule');
      onSuccess();
      setFormData({ 
        name: '', 
        dosage: '', 
        frequency: 'once_daily', 
        timeSlots: [], 
        setReminders: false,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        instructions: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add medication');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-white rounded-[32px] p-6 shadow-xl border border-gray-100">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black text-gray-900">Add Medicine</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">Medication Name</Label>
            <Input 
              placeholder="e.g., Amoxicillin" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-xs font-medium text-gray-700">Dosage</Label>
               <Input 
                 placeholder="250mg" 
                 value={formData.dosage}
                 onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                 className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
               />
             </div>
             <div className="space-y-2">
               <Label className="text-xs font-medium text-gray-700">Frequency</Label>
               <Select value={formData.frequency} onValueChange={(val) => setFormData({...formData, frequency: val})}>
                 <SelectTrigger className="rounded-2xl border-gray-200">
                   <SelectValue placeholder="Select" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="once_daily">Daily</SelectItem>
                   <SelectItem value="weekly">Weekly</SelectItem>
                   <SelectItem value="as_needed">As Needed</SelectItem>
                 </SelectContent>
               </Select>
                </div>
           </div>
           
           <div className="space-y-2">
             <Label className="text-xs font-medium text-gray-700">Instructions (Optional)</Label>
             <Input 
               placeholder="e.g., Take after food" 
               value={formData.instructions}
               onChange={(e) => setFormData({...formData, instructions: e.target.value})}
               className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
             />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Start Date</Label>
              <Input 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">End Date (Optional)</Label>
              <Input 
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
              />
            </div>
          </div>

          <div className="pt-2">
             <div className="flex justify-between items-center mb-3">
                <Label className="text-xs font-medium text-gray-700">Times per day</Label>
                <span className="text-xs font-black text-gray-500">{formData.timeSlots.length} times</span>
             </div>
             <div className="flex gap-2">
                {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot.toLowerCase())}
                    className={`px-4 py-2 rounded-[20px] text-xs font-medium transition-all ${
                      formData.timeSlots.includes(slot.toLowerCase())
                        ? 'bg-[#FF7A00] text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-100">
             <div className="flex items-center gap-2 text-sm font-black text-[#5C6E99]">
                <Bell size={16} /> Set Reminders
             </div>
             <Switch 
               checked={formData.setReminders} 
               onCheckedChange={(val) => setFormData({...formData, setReminders: val})}
               className="data-[state=checked]:bg-[#FF7A00]" 
             />
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full h-12 rounded-2xl bg-[#FF7A00] hover:bg-orange-600 font-bold text-white shadow-lg shadow-orange-200/50"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add to Schedule
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
