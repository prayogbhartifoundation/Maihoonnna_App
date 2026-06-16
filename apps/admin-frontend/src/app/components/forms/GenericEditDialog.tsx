import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2 } from 'lucide-react';

export type FieldDefinition = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'boolean' | 'select' | 'textarea' | 'date';
  options?: { label: string; value: string }[]; // For select fields
  placeholder?: string;
  required?: boolean;
};

interface GenericEditDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: any;
  fields: FieldDefinition[];
}

export const GenericEditDialog: React.FC<GenericEditDialogProps> = ({
  title,
  isOpen,
  onClose,
  onSave,
  initialData,
  fields,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Only reset formData when the dialog transitions from closed → open.
  // We track previous open state with a ref so that re-renders of the parent
  // (which produce a new initialData object reference every time) do NOT 
  // wipe out what the user has typed.
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Dialog just opened — seed the form with the latest initialData snapshot
      setFormData(initialData || {});
      setError('');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[85vh] overflow-y-auto rounded-[32px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-800 tracking-tight">{title}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {fields.map((field) => (
            <div 
              key={field.key} 
              className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
            >
              <Label htmlFor={field.key} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              
              {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                />
              ) : field.type === 'date' ? (() => {
                // Normalize ISO DateTime → YYYY-MM-DD for the date picker
                const rawVal = formData[field.key];
                const dateStr = rawVal
                  ? (typeof rawVal === 'string' ? rawVal.split('T')[0] : new Date(rawVal).toISOString().split('T')[0])
                  : '';
                // Compute age live from the selected date
                const computedAge = dateStr ? (() => {
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return null;
                  const today = new Date();
                  let a = today.getFullYear() - d.getFullYear();
                  const m = today.getMonth() - d.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
                  return a;
                })() : null;
                return (
                  <div className="space-y-1.5">
                    <Input
                      id={field.key}
                      type="date"
                      value={dateStr}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="rounded-2xl border-gray-200 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                    />
                    <div className="flex flex-col gap-1 pl-1 text-[11px] text-gray-500">
                      {computedAge !== null && (
                        <p>
                          Age from selected DOB: <span className="font-bold text-[#FF7A00]">{computedAge} years</span>
                        </p>
                      )}
                      {formData.age && (
                        <p>
                          Estimated DOB (based on Age {formData.age}): <span className="font-bold text-[#FF7A00]">01/01/{new Date().getFullYear() - formData.age}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()
              : field.type === 'boolean' ? (
                <div className="flex h-10 items-center">
                  <Switch
                    id={field.key}
                    checked={!!formData[field.key]}
                    onCheckedChange={(checked) => handleChange(field.key, checked)}
                    className="data-[state=checked]:bg-[#FF7A00]"
                  />
                </div>
              ) : field.type === 'select' && field.options ? (
                <Select
                  value={String(formData[field.key] ?? '')}
                  onValueChange={(val) => handleChange(field.key, val)}
                >
                  <SelectTrigger className="rounded-2xl border-gray-200">
                    <SelectValue placeholder={field.placeholder || "Select option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  value={Array.isArray(formData[field.key]) ? formData[field.key].join(', ') : formData[field.key] ?? ''}
                  onChange={(e) => {
                    // For arrays like medications, we can split by comma
                    const val = e.target.value;
                    const isArrayField = Array.isArray(initialData[field.key]);
                    handleChange(field.key, isArrayField ? val.split(',').map((s: string) => s.trim()) : val);
                  }}
                  placeholder={field.placeholder}
                  className="flex min-h-[80px] w-full rounded-2xl border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF7A00] disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : null}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6 border-t border-gray-50 pt-6">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-gray-200 font-bold">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="rounded-xl bg-[#FF7A00] hover:bg-orange-600 font-bold px-8">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
