import React, { useEffect, useState } from 'react';
import { X, Loader2, Save, User, Briefcase, MapPin, Users, Phone, Mail, GraduationCap, Calendar, Languages, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { staffOnboardingApi } from '../../services/api';
import type { StaffOnboardingMetadata, StaffOnboardingRole } from '../../types';

interface StaffEditModalProps {
  userId: string;
  role: StaffOnboardingRole;
  onClose: () => void;
  onSuccess: () => void;
}

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Punjabi', 'Urdu', 'Tamil', 'Bengali', 'Marathi', 'Telugu'];

export default function StaffEditModal({ userId, role, onClose, onSuccess }: StaffEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<StaffOnboardingMetadata | null>(null);
  const [formState, setFormState] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'assignment'>('personal');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staffData, metaData] = await Promise.all([
          staffOnboardingApi.getStaffDetails(userId),
          staffOnboardingApi.getMetadata()
        ]);
        setFormState(staffData);
        setMetadata(metaData);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load staff details');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const { personal } = formState;
    if (personal.mobileNumber && personal.mobileNumber.length !== 10) {
      toast.error('Mobile number must be 10 digits');
      return;
    }
    if (personal.alternatePhone && personal.mobileNumber === personal.alternatePhone) {
      toast.error('Mobile and Alternate numbers cannot be the same');
      return;
    }
    if (personal.aadhaarNumber && personal.aadhaarNumber.length !== 12) {
      toast.error('Aadhaar number must be 12 digits');
      return;
    }

    setSaving(true);
    try {
      await staffOnboardingApi.updateStaff(userId, formState);
      toast.success('Staff profile updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const updateNestedField = (section: string, field: string, value: any) => {
    let sanitizedValue = value;

    // Apply restrictions
    if (field === 'mobileNumber' || field === 'pincode' || field === 'whatsappNumber' || field === 'alternatePhone') {
      const limit = field === 'pincode' ? 6 : 10;
      sanitizedValue = value.replace(/\D/g, '').slice(0, limit);
    } else if (field === 'aadhaarNumber') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 12);
    } else if (field === 'panNumber') {
      sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else if (field === 'experience') {
      sanitizedValue = value.replace(/\D/g, '');
    }

    setFormState((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: sanitizedValue
      }
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-[32px] p-12 flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#FF7A00]" size={40} />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Profile...</p>
        </div>
      </div>
    );
  }

  const roleLabels: Record<StaffOnboardingRole, string> = {
    care_companion: 'Care Companion',
    field_manager: 'Field Manager',
    operations_manager: 'Operations Manager'
  };

  const roleColors: Record<StaffOnboardingRole, string> = {
    care_companion: 'text-[#FF7A00]',
    field_manager: 'text-[#1F8A3E]',
    operations_manager: 'text-[#1D4ED8]'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FAF6F3] rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-[#E7DED6] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${role === 'care_companion' ? 'bg-[#FFF0E0]' : role === 'field_manager' ? 'bg-[#E8F5E9]' : 'bg-[#E8F0FF]'} flex items-center justify-center font-bold text-xl ${roleColors[role]}`}>
              {formState.personal.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Edit Profile</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest ${roleColors[role]}`}>
                {roleLabels[role]} — {userId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white px-8 flex gap-8 border-b border-[#E7DED6] shrink-0">
          {[
            { id: 'personal', label: 'Personal Information', icon: User },
            { id: 'professional', label: 'Professional Setup', icon: Briefcase },
            { id: 'assignment', label: 'Team & Zone Access', icon: MapPin }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? `border-[#FF7A00] text-[#FF7A00]`
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <form id="edit-staff-form" onSubmit={handleSave} className="space-y-8">
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      value={formState.personal.fullName}
                      onChange={(e) => updateNestedField('personal', 'fullName', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      value={formState.personal.mobileNumber}
                      onChange={(e) => updateNestedField('personal', 'mobileNumber', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formState.personal.email}
                      onChange={(e) => updateNestedField('personal', 'email', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={formState.personal.dateOfBirth}
                      onChange={(e) => updateNestedField('personal', 'dateOfBirth', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-3 gap-4 mt-4">
                   <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Address</label>
                    <input
                      value={formState.personal.addressLine1}
                      onChange={(e) => updateNestedField('personal', 'addressLine1', e.target.value)}
                      placeholder="Street address, locality..."
                      className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pincode</label>
                    <input
                      value={formState.personal.pincode}
                      onChange={(e) => updateNestedField('personal', 'pincode', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL TAB */}
            {activeTab === 'professional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Highest Qualification</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      value={formState.professional.qualification}
                      onChange={(e) => updateNestedField('professional', 'qualification', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Experience (Years)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      value={formState.professional.experience}
                      onChange={(e) => updateNestedField('professional', 'experience', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </div>

                {role === 'care_companion' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nursing Registration #</label>
                      <input
                        value={formState.professional.nursingRegistrationNumber}
                        onChange={(e) => updateNestedField('professional', 'nursingRegistrationNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Preferred Shift</label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={formState.professional.preferredShift}
                          onChange={(e) => updateNestedField('professional', 'preferredShift', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00] appearance-none"
                        >
                          <option value="any">Any Shift</option>
                          <option value="day">Day (8 AM - 8 PM)</option>
                          <option value="night">Night (8 PM - 8 AM)</option>
                          <option value="live_in">Live-in (24 hrs)</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <Languages size={14} /> Spoken Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          const current = formState.professional.languages || [];
                          if (current.includes(lang)) {
                            updateNestedField('professional', 'languages', current.filter((l: string) => l !== lang));
                          } else {
                            updateNestedField('professional', 'languages', [...current, lang]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          (formState.professional.languages || []).includes(lang)
                            ? 'bg-[#FF7A00] text-white'
                            : 'bg-white text-gray-500 border border-[#E7DED6]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ASSIGNMENT TAB */}
            {activeTab === 'assignment' && (
              <div className="space-y-6">
                {role === 'operations_manager' ? (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                      <MapPin size={14} /> Assigned Managed Zones
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {metadata?.zones.map((zone) => (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => {
                            const current = formState.assignment.zoneIds || [];
                            if (current.includes(zone.id)) {
                              updateNestedField('assignment', 'zoneIds', current.filter((id: string) => id !== zone.id));
                            } else {
                              updateNestedField('assignment', 'zoneIds', [...current, zone.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            (formState.assignment.zoneIds || []).includes(zone.id)
                              ? 'bg-blue-50 border-[#1D4ED8] text-[#1D4ED8]'
                              : 'bg-white border-[#E7DED6] text-gray-500'
                          }`}
                        >
                          <div className="text-left">
                            <p className="text-sm font-black">{zone.name}</p>
                            <p className="text-[10px] opacity-60 uppercase">{zone.city}</p>
                          </div>
                          {(formState.assignment.zoneIds || []).includes(zone.id) && <CheckCircle2 size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Assignment Zone</label>
                      <select
                        value={formState.assignment.zoneId}
                        onChange={(e) => updateNestedField('assignment', 'zoneId', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                      >
                        <option value="">Select a Zone</option>
                        {metadata?.zones.map((z) => (
                          <option key={z.id} value={z.id}>{z.name} ({z.city})</option>
                        ))}
                      </select>
                    </div>

                    {role === 'care_companion' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assigned Team</label>
                        <select
                          value={formState.assignment.teamId}
                          onChange={(e) => updateNestedField('assignment', 'teamId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                        >
                          <option value="">No Team Assigned</option>
                          {metadata?.teams
                            .filter(t => t.zone === formState.assignment.zoneId || formState.assignment.zoneId === '')
                            .map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {role === 'field_manager' && (
                       <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reports to (OM)</label>
                        <select
                          value={formState.assignment.reportsToUserId}
                          onChange={(e) => updateNestedField('assignment', 'reportsToUserId', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-[#E7DED6] rounded-2xl font-bold text-sm focus:outline-none focus:border-[#FF7A00]"
                        >
                          <option value="">No Manager Assigned</option>
                          {metadata?.operationsManagers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-6 border-t border-[#E7DED6] flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Tracking</p>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase">
              <ShieldCheck size={12} /> Account Active
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              form="edit-staff-form"
              type="submit"
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-lg shadow-orange-100 disabled:opacity-60 ${
                role === 'care_companion' ? 'bg-[#FF7A00] hover:bg-[#e06e00]' : role === 'field_manager' ? 'bg-[#1F8A3E] hover:bg-[#16652d]' : 'bg-[#1D4ED8] hover:bg-[#1539a1]'
              }`}
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
