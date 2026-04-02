import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  UserRound,
  Users,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { usePincodeLookup } from '../hooks/usePincodeLookup';
import { toast } from 'sonner';

import { staffOnboardingApi } from '../../services/api';
import type {
  StaffBackgroundCheckType,
  StaffDocumentType,
  StaffOnboardingDocumentInput,
  StaffOnboardingMetadata,
  StaffOnboardingPayload,
  StaffOnboardingRole,
} from '../../types';

const STEP_LABELS = ['Personal info', 'Professional', 'Documents', 'Team & access'];

const ROLE_CONFIG: Record<
  StaffOnboardingRole,
  {
    title: string;
    subtitle: string;
    accent: string;
  }
> = {
  care_companion: {
    title: 'Onboard Care Companion',
    subtitle: 'Capture personal, professional, document, and team-assignment details for a new CC.',
    accent: 'bg-[#FF7A00]',
  },
  field_manager: {
    title: 'Onboard Field Manager',
    subtitle: 'Set up a field manager profile with permissions, reporting line, and zone assignment.',
    accent: 'bg-[#1F8A3E]',
  },
  operations_manager: {
    title: 'Onboard Operations Manager',
    subtitle: 'Create an operations manager profile and assign managed zones during onboarding.',
    accent: 'bg-[#1D4ED8]',
  },
};

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Punjabi', 'Urdu', 'Tamil', 'Bengali', 'Marathi', 'Telugu'];

const BGV_OPTIONS: Array<{ value: StaffBackgroundCheckType; label: string }> = [
  { value: 'police_clearance', label: 'Police clearance' },
  { value: 'address_verification', label: 'Address verification' },
  { value: 'employment_history', label: 'Employment history' },
  { value: 'education_verification', label: 'Education verification' },
  { value: 'identity_verification', label: 'Identity verification' },
  { value: 'reference_check', label: 'Reference check' },
];

const DOCUMENT_CONFIG: Record<
  StaffDocumentType,
  {
    label: string;
    requiredFor: StaffOnboardingRole[];
  }
> = {
  aadhaar_front: {
    label: 'Aadhaar card (front)',
    requiredFor: ['care_companion', 'field_manager', 'operations_manager'],
  },
  aadhaar_back: {
    label: 'Aadhaar card (back)',
    requiredFor: ['care_companion', 'field_manager', 'operations_manager'],
  },
  pan_card: {
    label: 'PAN card',
    requiredFor: [],
  },
  nursing_certificate: {
    label: 'Nursing certificate',
    requiredFor: ['care_companion'],
  },
  first_aid_certificate: {
    label: 'First aid certificate',
    requiredFor: [],
  },
  offer_letter: {
    label: 'Offer letter',
    requiredFor: [],
  },
  bgv_report: {
    label: 'BGV report',
    requiredFor: [],
  },
  other: {
    label: 'Other document',
    requiredFor: [],
  },
};

type FormState = {
  role: StaffOnboardingRole;
  personal: StaffOnboardingPayload['personal'];
  professional: StaffOnboardingPayload['professional'];
  assignment: StaffOnboardingPayload['assignment'];
  documents: StaffOnboardingDocumentInput[];
};

function normalizeRole(roleParam: string | null): StaffOnboardingRole {
  if (roleParam === 'field_manager' || roleParam === 'operations_manager') {
    return roleParam;
  }
  return 'care_companion';
}

function createInitialFormState(role: StaffOnboardingRole): FormState {
  return {
    role,
    personal: {
      fullName: '',
      preferredName: '',
      dateOfBirth: '',
      gender: 'female',
      mobileNumber: '',
      whatsappNumber: '',
      email: '',
      alternatePhone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      aadhaarNumber: '',
      panNumber: '',
    },
    professional: {
      qualification: '',
      experience: '',
      nursingRegistrationNumber: '',
      nursingCouncil: '',
      previousEmployer: '',
      maxTeamSize: '15',
      languages: [],
      preferredShift: 'any',
      maxDailyVisits: '4',
      willingClinicVisits: true,
      hasTwoWheeler: false,
      canApproveRoster: true,
      canOnboardCCs: false,
    },
    assignment: {
      zoneId: '',
      zoneIds: [],
      teamId: '',
      reportsToUserId: '',
      bgvType: 'police_clearance',
      bgvAgency: '',
    },
    documents: [],
  };
}

function adaptFormStateForRole(previousState: FormState, role: StaffOnboardingRole): FormState {
  const nextState: FormState = {
    ...previousState,
    role,
    assignment: {
      ...previousState.assignment,
      teamId: role === 'care_companion' ? previousState.assignment.teamId || '' : '',
      reportsToUserId: role === 'field_manager' ? previousState.assignment.reportsToUserId || '' : '',
      zoneIds:
        role === 'operations_manager'
          ? previousState.assignment.zoneIds || []
          : previousState.assignment.zoneId
            ? [previousState.assignment.zoneId]
            : [],
    },
  };

  if (role !== 'care_companion') {
    nextState.professional.preferredShift = 'any';
    nextState.professional.maxDailyVisits = '';
    nextState.professional.willingClinicVisits = false;
    nextState.professional.hasTwoWheeler = false;
    nextState.professional.nursingRegistrationNumber = '';
    nextState.professional.nursingCouncil = '';
  }

  if (role === 'operations_manager') {
    nextState.assignment.teamId = '';
    nextState.assignment.reportsToUserId = '';
  }

  return nextState;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StaffOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = normalizeRole(searchParams.get('role'));
  const [currentStep, setCurrentStep] = useState(1);
  const [metadata, setMetadata] = useState<StaffOnboardingMetadata | null>(null);
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState(role));
  // Map of documentType → actual File object (for upload)
  const [pendingFiles, setPendingFiles] = useState<Map<string, File>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLookupResults, setShowLookupResults] = useState(false);
  const { loading: lookupLoading, error: lookupError, results: lookupResults, lookup: runLookup, reset: resetLookup } = usePincodeLookup();

  useEffect(() => {
    setFormState((previousState) => adaptFormStateForRole(previousState, role));
    setCurrentStep(1);
  }, [role]);

  useEffect(() => {
    let cancelled = false;

    const loadMetadata = async () => {
      setLoading(true);
      try {
        const response = await staffOnboardingApi.getMetadata();
        if (!cancelled) {
          setMetadata(response);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error.message || 'Failed to load onboarding metadata');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedZone = metadata?.zones.find((zoneItem) => zoneItem.id === formState.assignment.zoneId) || null;
  const availableTeams = (metadata?.teams || []).filter((team) => {
    if (!selectedZone) return true;
    return team.zone === selectedZone.id || team.zone === selectedZone.name;
  });
  
  const availableManagers = (metadata?.operationsManagers || []).filter((manager) => {
    if (!selectedZone) return false;
    return (manager.assignedZones || []).some(z => z.id === selectedZone.id);
  });

  const requiredDocumentTypes = Object.entries(DOCUMENT_CONFIG)
    .filter(([, value]) => value.requiredFor.includes(role))
    .map(([key]) => key as StaffDocumentType);

  const hasRequiredDocuments = requiredDocumentTypes.every((documentType) =>
    formState.documents.some((document) => document.documentType === documentType && document.fileName)
  );

  const getDocument = (documentType: StaffDocumentType) =>
    formState.documents.find((document) => document.documentType === documentType);

  const setPersonalField = (field: keyof StaffOnboardingPayload['personal'], value: string) => {
    setFormState((previousState) => ({
      ...previousState,
      personal: {
        ...previousState.personal,
        [field]: value,
      },
    }));
  };

  const setProfessionalField = (
    field: keyof StaffOnboardingPayload['professional'],
    value: string | boolean | string[]
  ) => {
    setFormState((previousState) => ({
      ...previousState,
      professional: {
        ...previousState.professional,
        [field]: value,
      },
    }));
  };

  const setAssignmentField = (field: keyof StaffOnboardingPayload['assignment'], value: string | string[]) => {
    setFormState((previousState) => ({
      ...previousState,
      assignment: {
        ...previousState.assignment,
        [field]: value,
      },
    }));
  };

  const toggleLanguage = (language: string) => {
    const currentLanguages = formState.professional.languages || [];
    const nextLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter((item) => item !== language)
      : [...currentLanguages, language];

    setProfessionalField('languages', nextLanguages);
  };

  const toggleManagedZone = (zoneId: string) => {
    const currentZones = formState.assignment.zoneIds || [];
    const nextZones = currentZones.includes(zoneId)
      ? currentZones.filter((item) => item !== zoneId)
      : [...currentZones, zoneId];

    setAssignmentField('zoneIds', nextZones);
  };

  const setDocumentFile = (documentType: StaffDocumentType, file: File | null) => {
    // Track the actual File object for upload
    setPendingFiles((prev) => {
      const next = new Map(prev);
      if (file) {
        next.set(documentType, file);
      } else {
        next.delete(documentType);
      }
      return next;
    });

    setFormState((previousState) => {
      const remainingDocuments = previousState.documents.filter((document) => document.documentType !== documentType);

      if (!file) {
        return {
          ...previousState,
          documents: remainingDocuments,
        };
      }

      return {
        ...previousState,
        documents: [
          ...remainingDocuments,
          {
            documentType,
            fileName: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
          },
        ],
      };
    });
  };

  const getStepError = (stepNumber: number) => {
    if (stepNumber === 1) {
      const { personal } = formState;
      if (!personal.fullName || !personal.mobileNumber || !personal.dateOfBirth) {
        return 'Full name, mobile number, and date of birth are required.';
      }
      if (personal.mobileNumber.length !== 10) {
        return 'Mobile number must be exactly 10 digits.';
      }
      if (personal.alternatePhone && personal.mobileNumber === personal.alternatePhone) {
        return 'Alternate phone number cannot be the same as the mobile number.';
      }
      if (!personal.addressLine1 || !personal.city || !personal.state || !personal.pincode || !personal.aadhaarNumber) {
        return 'Address and Aadhaar details must be completed.';
      }
      if (personal.aadhaarNumber.length !== 12) {
        return 'Aadhaar number must be exactly 12 digits.';
      }
      if (personal.panNumber && personal.panNumber.length !== 10) {
        return 'PAN number must be exactly 10 characters.';
      }
    }

    if (stepNumber === 2) {
      if (!formState.professional.qualification || formState.professional.experience === '') {
        return 'Qualification and years of experience are required.';
      }
    }

    if (stepNumber === 3 && !hasRequiredDocuments) {
      return 'Please upload all mandatory documents before continuing.';
    }

    if (stepNumber === 4) {
      if (role === 'operations_manager' && !(formState.assignment.zoneIds || []).length) {
        return 'Assign at least one managed zone to the operations manager.';
      }
      if (role !== 'operations_manager' && !formState.assignment.zoneId) {
        return 'Please select a zone for this staff member.';
      }
      if (role === 'field_manager' && metadata?.operationsManagers?.length && !formState.assignment.reportsToUserId) {
        return 'Please select the reporting operations manager.';
      }
      if (!formState.assignment.bgvType) {
        return 'Please choose a BGV type.';
      }
    }

    return '';
  };

  const handleNext = () => {
    const error = getStepError(currentStep);
    if (error) {
      toast.error(error);
      return;
    }
    setCurrentStep((previousStep) => Math.min(previousStep + 1, STEP_LABELS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((previousStep) => Math.max(previousStep - 1, 1));
  };

  const handleSubmit = async () => {
    const error = getStepError(4);
    if (error) {
      toast.error(error);
      return;
    }

    const payload: StaffOnboardingPayload = {
      role,
      personal: {
        ...formState.personal,
      },
      professional: {
        ...formState.professional,
        languages: formState.professional.languages || [],
      },
      assignment: {
        zoneId: role === 'operations_manager' ? undefined : formState.assignment.zoneId,
        zoneIds: role === 'operations_manager' ? formState.assignment.zoneIds || [] : undefined,
        teamId: role === 'care_companion' ? formState.assignment.teamId : undefined,
        reportsToUserId: role === 'field_manager' ? formState.assignment.reportsToUserId : undefined,
        bgvType: formState.assignment.bgvType,
        bgvAgency: formState.assignment.bgvAgency,
      },
      documents: formState.documents,
    };

    try {
      setSubmitting(true);

      // Step 1: Create the staff profile
      const onboardResult = await staffOnboardingApi.onboard(payload);
      const staffProfileId: string | undefined = onboardResult?.staffProfile?.id;

      // Step 2: Upload files (if we have a real staffProfileId)
      if (staffProfileId && pendingFiles.size > 0) {
        const uploadPromises = Array.from(pendingFiles.entries()).map(([documentType, file]) =>
          staffOnboardingApi
            .uploadDocument(staffProfileId, documentType, file)
            .catch((err) => {
              console.warn(`Failed to upload ${documentType}:`, err);
            })
        );
        await Promise.all(uploadPromises);
      }

      toast.success(`${ROLE_CONFIG[role].title.replace('Onboard ', '')} created successfully`);

      const nextPath =
        role === 'care_companion'
          ? '/care-companions'
          : role === 'field_manager'
            ? '/field-managers'
            : '/operations-managers';

      navigate(nextPath);
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard staff member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin" size={24} />
          <span className="font-medium">Loading onboarding setup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-6 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-800">{ROLE_CONFIG[role].title}</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">{ROLE_CONFIG[role].subtitle}</p>
            </div>

            <div className="bg-white rounded-3xl p-3 shadow-sm border border-[#E7DED6] flex flex-wrap gap-2">
              {(['care_companion', 'field_manager', 'operations_manager'] as StaffOnboardingRole[]).map((roleOption) => (
                <button
                  key={roleOption}
                  onClick={() => setSearchParams({ role: roleOption })}
                  className={`px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                    role === roleOption
                      ? `${ROLE_CONFIG[roleOption].accent} text-white`
                      : 'bg-[#F4EAE3] text-gray-600 hover:bg-orange-100'
                  }`}
                >
                  {roleOption === 'care_companion'
                    ? 'Care Companion'
                    : roleOption === 'field_manager'
                      ? 'Field Manager'
                      : 'Operations Manager'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-[#E7DED6] overflow-hidden">
          <div className="px-8 py-6 border-b border-[#E7DED6] bg-[#FFF8F3]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {STEP_LABELS.map((label, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentStep === stepNumber;
                  const isComplete = currentStep > stepNumber;

                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : isActive
                              ? 'bg-[#FF7A00] text-white'
                              : 'bg-[#F4EAE3] text-gray-400'
                        }`}
                      >
                        {isComplete ? <CheckCircle2 size={18} /> : stepNumber}
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-black">Step {stepNumber}</p>
                        <p className={`font-bold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-sm text-gray-500 font-semibold">
                Step {currentStep} of {STEP_LABELS.length}
              </div>
            </div>
          </div>

          <div className="p-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF1E6] flex items-center justify-center text-[#FF7A00]">
                      <UserRound size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-800">Personal details</h2>
                      <p className="text-sm text-gray-500">
                        Capture identity and contact information exactly as shared by the candidate.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={formState.personal.fullName}
                      onChange={(event) => setPersonalField('fullName', event.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      value={formState.personal.preferredName}
                      onChange={(event) => setPersonalField('preferredName', event.target.value)}
                      placeholder="Preferred name"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      type="date"
                      value={formState.personal.dateOfBirth}
                      onChange={(event) => setPersonalField('dateOfBirth', event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <select
                      value={formState.personal.gender}
                      onChange={(event) => setPersonalField('gender', event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    <input
                      value={formState.personal.mobileNumber}
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                        setPersonalField('mobileNumber', val);
                      }}
                      placeholder="Mobile number"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      value={formState.personal.whatsappNumber}
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                        setPersonalField('whatsappNumber', val);
                      }}
                      placeholder="WhatsApp number"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      type="email"
                      value={formState.personal.email}
                      onChange={(event) => setPersonalField('email', event.target.value)}
                      placeholder="Email address"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      value={formState.personal.alternatePhone}
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 10);
                        setPersonalField('alternatePhone', val);
                      }}
                      placeholder="Alternate phone"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-black text-gray-800 mb-4">Permanent address</h3>
                  <div className="space-y-4">
                    <input
                      value={formState.personal.addressLine1}
                      onChange={(event) => setPersonalField('addressLine1', event.target.value)}
                      placeholder="Address line 1"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      value={formState.personal.addressLine2}
                      onChange={(event) => setPersonalField('addressLine2', event.target.value)}
                      placeholder="Address line 2"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        value={formState.personal.city}
                        onChange={(event) => setPersonalField('city', event.target.value)}
                        placeholder="City"
                        className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                      />
                      <input
                        value={formState.personal.state}
                        onChange={(event) => setPersonalField('state', event.target.value)}
                        placeholder="State"
                        className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                      />
                      <div className="relative">
                        <input
                          value={formState.personal.pincode}
                          onChange={(event) => {
                            const val = event.target.value.replace(/\D/g, '');
                            setPersonalField('pincode', val);
                            if (val.length === 6) {
                              runLookup(val);
                              setShowLookupResults(true);
                            } else {
                              setShowLookupResults(false);
                              resetLookup();
                              if (val.length === 0) {
                                setPersonalField('city', '');
                                setPersonalField('state', '');
                                setPersonalField('addressLine1', '');
                              }
                            }
                          }}
                          placeholder="Pincode"
                          maxLength={6}
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        />
                        {lookupLoading && (
                          <div className="absolute right-3 top-3">
                            <Loader2 size={18} className="text-[#FF7A00] animate-spin" />
                          </div>
                        )}

                        {/* Pincode Lookup Results */}
                        {showLookupResults && (lookupResults.length > 0 || lookupError) && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-[#E7DED6] rounded-2xl shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
                            {lookupError && (
                              <div className="p-3 text-xs text-red-500 font-medium flex items-center gap-2">
                                <AlertTriangle size={14} />
                                {lookupError}
                              </div>
                            )}
                            
                            {lookupResults.length > 0 && (
                              <div>
                                <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                                  Select Area ({lookupResults.length} found)
                                </p>
                                {lookupResults.map((po, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setPersonalField('city', po.District);
                                      setPersonalField('state', po.State);
                                      setPersonalField('addressLine1', po.Name);
                                      setShowLookupResults(false);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 flex items-center justify-between group"
                                  >
                                    <div>
                                      <p className="font-bold text-sm text-gray-800">{po.Name}</p>
                                      <p className="text-[10px] text-gray-400 uppercase">{po.District}, {po.State}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF7A00] transition" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-base font-black text-gray-800 mb-4">Identity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={formState.personal.aadhaarNumber}
                      onChange={(event) => {
                        const val = event.target.value.replace(/\D/g, '').slice(0, 12);
                        setPersonalField('aadhaarNumber', val);
                      }}
                      placeholder="Aadhaar number (12 digits)"
                      maxLength={12}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      value={formState.personal.panNumber}
                      onChange={(event) => {
                        const val = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                        setPersonalField('panNumber', val);
                      }}
                      placeholder="PAN number"
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </section>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#EAF6EE] flex items-center justify-center text-[#1F8A3E]">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-800">Professional details</h2>
                      <p className="text-sm text-gray-500">
                        Capture qualifications, experience, language comfort, and role-specific preferences.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={formState.professional.qualification}
                      onChange={(event) => setProfessionalField('qualification', event.target.value)}
                      placeholder="Qualification"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                    <input
                      type="number"
                      min="0"
                      value={formState.professional.experience}
                      onChange={(event) => setProfessionalField('experience', event.target.value)}
                      placeholder="Years of experience"
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />

                    {role === 'care_companion' && (
                      <>
                        <input
                          value={formState.professional.nursingRegistrationNumber}
                          onChange={(event) => setProfessionalField('nursingRegistrationNumber', event.target.value)}
                          placeholder="Nursing registration number"
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        />
                        <input
                          value={formState.professional.nursingCouncil}
                          onChange={(event) => setProfessionalField('nursingCouncil', event.target.value)}
                          placeholder="Nursing council"
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        />
                      </>
                    )}

                    {role === 'field_manager' && (
                      <>
                        <input
                          value={formState.professional.previousEmployer}
                          onChange={(event) => setProfessionalField('previousEmployer', event.target.value)}
                          placeholder="Previous employer"
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        />
                        <input
                          type="number"
                          min="1"
                          value={formState.professional.maxTeamSize}
                          onChange={(event) => setProfessionalField('maxTeamSize', event.target.value)}
                          placeholder="Max team size"
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        />
                      </>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-sm font-black text-gray-700 mb-3">Languages spoken</p>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.map((language) => {
                        const selected = (formState.professional.languages || []).includes(language);
                        return (
                          <button
                            key={language}
                            type="button"
                            onClick={() => toggleLanguage(language)}
                            className={`px-3 py-2 rounded-full text-sm font-bold border transition-colors ${
                              selected
                                ? 'bg-[#FF7A00] text-white border-[#FF7A00]'
                                : 'bg-white text-gray-600 border-[#E7DED6] hover:border-[#FF7A00]'
                            }`}
                          >
                            {language}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {role === 'care_companion' && (
                  <section className="rounded-3xl border border-[#E7DED6] bg-[#FFF8F3] p-6">
                    <h3 className="text-base font-black text-gray-800 mb-4">Work preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <select
                        value={formState.professional.preferredShift}
                        onChange={(event) => setProfessionalField('preferredShift', event.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                      >
                        <option value="any">Any shift</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formState.professional.maxDailyVisits}
                        onChange={(event) => setProfessionalField('maxDailyVisits', event.target.value)}
                        placeholder="Max daily visits"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#E7DED6]">
                        <span className="font-semibold text-gray-700">Willing for clinic visits</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formState.professional.willingClinicVisits)}
                          onChange={(event) => setProfessionalField('willingClinicVisits', event.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#E7DED6]">
                        <span className="font-semibold text-gray-700">Has two-wheeler</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formState.professional.hasTwoWheeler)}
                          onChange={(event) => setProfessionalField('hasTwoWheeler', event.target.checked)}
                        />
                      </label>
                    </div>
                  </section>
                )}

                {role === 'field_manager' && (
                  <section className="rounded-3xl border border-[#E7DED6] bg-[#F7FBF8] p-6">
                    <h3 className="text-base font-black text-gray-800 mb-4">Permissions</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#E7DED6]">
                        <span className="font-semibold text-gray-700">Can approve roster</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formState.professional.canApproveRoster)}
                          onChange={(event) => setProfessionalField('canApproveRoster', event.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between bg-white rounded-2xl p-4 border border-[#E7DED6]">
                        <span className="font-semibold text-gray-700">Can onboard care companions</span>
                        <input
                          type="checkbox"
                          checked={Boolean(formState.professional.canOnboardCCs)}
                          onChange={(event) => setProfessionalField('canOnboardCCs', event.target.checked)}
                        />
                      </label>
                    </div>
                  </section>
                )}
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="rounded-3xl border border-[#F6D2B6] bg-[#FFF8F3] px-5 py-4 text-sm text-[#8B4513]">
                  Uploads are captured as onboarding records today, so the database stores document metadata cleanly even before a full file-storage service is added.
                </div>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#EEF3FF] flex items-center justify-center text-[#1D4ED8]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-800">Documents</h2>
                      <p className="text-sm text-gray-500">
                        Capture the document name, type, and upload evidence for onboarding and BGV readiness.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(DOCUMENT_CONFIG) as StaffDocumentType[]).map((documentType) => {
                      const documentConfig = DOCUMENT_CONFIG[documentType];
                      const uploadedDocument = getDocument(documentType);
                      const isRequired = documentConfig.requiredFor.includes(role);

                      if (role !== 'care_companion' && documentType === 'nursing_certificate') {
                        return null;
                      }

                      if (role === 'operations_manager' && documentType === 'first_aid_certificate') {
                        return null;
                      }

                      return (
                        <label
                          key={documentType}
                          className="rounded-3xl border border-[#E7DED6] p-5 bg-white hover:border-[#FF7A00] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-gray-800">{documentConfig.label}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {isRequired ? 'Required before verification' : 'Optional supporting document'}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-black uppercase px-2 py-1 rounded-full ${
                                isRequired ? 'bg-[#FFF1E6] text-[#FF7A00]' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {isRequired ? 'Required' : 'Optional'}
                            </span>
                          </div>

                          <div className="mt-4 rounded-2xl border border-dashed border-[#D8CFC7] bg-[#F9F5F1] p-4">
                            <input
                              type="file"
                              className="w-full text-sm text-gray-600"
                              onChange={(event) => setDocumentFile(documentType, event.target.files?.[0] || null)}
                            />
                            {uploadedDocument && (
                              <div className="mt-3 text-sm text-green-700 font-semibold">
                                {uploadedDocument.fileName}{' '}
                                {uploadedDocument.fileSizeBytes
                                  ? `(${formatFileSize(uploadedDocument.fileSizeBytes)})`
                                  : ''}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF1E6] flex items-center justify-center text-[#FF7A00]">
                      <Users size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-gray-800">Assignment and activation</h2>
                      <p className="text-sm text-gray-500">
                        Map the staff member to the right zone, reporting line, and BGV initiation details.
                      </p>
                    </div>
                  </div>

                  {role === 'operations_manager' ? (
                    <div className="rounded-3xl border border-[#E7DED6] bg-white p-6">
                      <h3 className="text-base font-black text-gray-800 mb-4">Managed zones</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(metadata?.zones || []).map((zoneItem) => {
                          const selected = (formState.assignment.zoneIds || []).includes(zoneItem.id);
                          return (
                            <button
                              key={zoneItem.id}
                              type="button"
                              onClick={() => toggleManagedZone(zoneItem.id)}
                              className={`text-left rounded-2xl border p-4 transition-colors ${
                                selected
                                  ? 'border-[#1D4ED8] bg-[#EEF3FF]'
                                  : 'border-[#E7DED6] bg-white hover:border-[#1D4ED8]'
                              }`}
                            >
                              <p className="font-bold text-gray-800">{zoneItem.name}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {zoneItem.city}, {zoneItem.state}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">Pincode: {zoneItem.pincode}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={formState.assignment.zoneId}
                        onChange={(event) => {
                          setAssignmentField('zoneId', event.target.value);
                          setAssignmentField('teamId', '');
                          setAssignmentField('reportsToUserId', '');
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                      >
                        <option value="">Select zone</option>
                        {(metadata?.zones || []).map((zoneItem) => (
                          <option key={zoneItem.id} value={zoneItem.id}>
                            {zoneItem.name} - {zoneItem.city}
                          </option>
                        ))}
                      </select>

                      {role === 'care_companion' ? (
                        <select
                          value={formState.assignment.teamId}
                          onChange={(event) => setAssignmentField('teamId', event.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                        >
                          <option value="">Select team (optional)</option>
                          {availableTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name} - {team.currentCapacity}/{team.maxCapacity}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={formState.assignment.reportsToUserId}
                          onChange={(event) => setAssignmentField('reportsToUserId', event.target.value)}
                          disabled={!formState.assignment.zoneId}
                          className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00] disabled:opacity-50"
                        >
                          <option value="">
                            {!formState.assignment.zoneId 
                              ? 'Select zone first...' 
                              : availableManagers.length === 0 
                                ? 'No managers assigned to this zone' 
                                : 'Reports to (Operations Manager)'}
                          </option>
                          {availableManagers.map((manager) => (
                            <option key={manager.userId} value={manager.userId}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-[#E7DED6] bg-[#F8FAFC] p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck size={18} className="text-[#1D4ED8]" />
                    <h3 className="text-base font-black text-gray-800">BGV initiation</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={formState.assignment.bgvType}
                      onChange={(event) => setAssignmentField('bgvType', event.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    >
                      {BGV_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={formState.assignment.bgvAgency}
                      onChange={(event) => setAssignmentField('bgvAgency', event.target.value)}
                      placeholder="BGV agency"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00]"
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-[#E7DED6] bg-white p-6">
                  <h3 className="text-base font-black text-gray-800 mb-4">Activation checklist</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={18}
                        className={formState.personal.fullName && formState.personal.mobileNumber ? 'text-green-600' : 'text-gray-300'}
                      />
                      <span className={formState.personal.fullName && formState.personal.mobileNumber ? 'text-gray-700' : 'text-gray-400'}>
                        Personal information complete
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={18}
                        className={formState.professional.qualification ? 'text-green-600' : 'text-gray-300'}
                      />
                      <span className={formState.professional.qualification ? 'text-gray-700' : 'text-gray-400'}>
                        Professional details filled
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className={hasRequiredDocuments ? 'text-green-600' : 'text-gray-300'} />
                      <span className={hasRequiredDocuments ? 'text-gray-700' : 'text-gray-400'}>
                        Mandatory documents captured
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className={formState.assignment.bgvType ? 'text-green-600' : 'text-gray-300'} />
                      <span className={formState.assignment.bgvType ? 'text-gray-700' : 'text-gray-400'}>
                        BGV initiation prepared
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-[#E7DED6] flex items-center justify-between gap-4 bg-[#FFFDFC]">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1 || submitting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#E7DED6] text-gray-700 font-bold disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {currentStep < STEP_LABELS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF7A00] text-white font-black shadow-sm"
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF7A00] text-white font-black shadow-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                Save staff member
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
