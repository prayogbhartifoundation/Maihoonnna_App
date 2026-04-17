/**
 * Enrollment Wizard — Admin-side subscriber + beneficiary onboarding
 * 5-step wizard: Subscriber → Beneficiary → Package → Payment → Confirm
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { enrollmentApi, packageApi } from '../../services/api';
import { toast } from 'sonner';
import {
  UserPlus, ArrowLeft, ArrowRight, Check, Phone, User, Package,
  CreditCard, CheckCircle2, Loader2, AlertCircle, Users,
  Info, Calendar, Activity, ShieldAlert, Plus, Trash2, HeartPulse,
  Mail, MapPin, Camera, UserSquare, Stethoscope, Heart, Building, X, Clock,
} from 'lucide-react';
import { PincodeCheck } from '../components/enrollment/PincodeCheck';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

type Step = 'subscriber' | 'beneficiary' | 'medical' | 'emergency' | 'package' | 'payment' | 'confirm';


const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'subscriber', label: 'Subscriber', icon: User },
  { id: 'beneficiary', label: 'Beneficiary', icon: UserSquare },
  { id: 'medical', label: 'Medical & Life', icon: Stethoscope },
  { id: 'emergency', label: 'Emergency', icon: ShieldAlert },
  { id: 'package', label: 'Plan & Timing', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirm', label: 'Confirm', icon: Check },
];

const DURATION_OPTIONS = [
  { value: 'monthly', label: 'Monthly', months: 1 },
  { value: 'six_months', label: '6 Months', months: 6 },
  { value: 'annual', label: 'Annual (12 Months)', months: 12 },
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'NEFT/RTGS', 'Other'];

export default function EnrollmentWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('subscriber');
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledResult, setEnrolledResult] = useState<any>(null);

  // ── Subscriber
  const [subscriberPhone, setSubscriberPhone] = useState('');
  const [subscriberName, setSubscriberName] = useState('');
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriberAddress, setSubscriberAddress] = useState('');
  const [subscriberPincode, setSubscriberPincode] = useState('');
  const [subscriberCity, setSubscriberCity] = useState('');
  const [subscriberState, setSubscriberState] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState<{ exists: boolean; id?: string; beneficiaries?: any[] } | null>(null);
  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Beneficiary
  const [sameAsSubscriber, setSameAsSubscriber] = useState(false);
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAge, setBeneficiaryAge] = useState('');
  const [beneficiaryDob, setBeneficiaryDob] = useState('');
  const [beneficiaryGender, setBeneficiaryGender] = useState('prefer_not_to_say');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('');
  const [beneficiaryPincode, setBeneficiaryPincode] = useState('');
  const [beneficiaryCity, setBeneficiaryCity] = useState('');
  const [beneficiaryState, setBeneficiaryState] = useState('');
  const [relationship, setRelationship] = useState('');

  // ── Medical & Vitals
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]); 
  const [medications, setMedications] = useState<any[]>([]); // { name, dosage, frequency, timeSlots, setReminders }
  const [vitalsToTrack, setVitalsToTrack] = useState({
    bloodPressure: true,
    heartRate: true,
    bloodSugar: true,
    temperature: true,
    oxygenSaturation: true,
    weight: true,
  });
  const [primaryPhysicianName, setPrimaryPhysicianName] = useState('');
  const [primaryPhysicianPhone, setPrimaryPhysicianPhone] = useState('');
  const [hobbiesInterests, setHobbiesInterests] = useState<string[]>([]);

  // ── Emergency Contacts
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRel, setEmergencyContactRel] = useState('Family');
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');

  const [secondaryContactName, setSecondaryContactName] = useState('');
  const [secondaryContactPhone, setSecondaryContactPhone] = useState('');
  const [secondaryContactRel, setSecondaryContactRel] = useState('');
  const [secondaryContactEmail, setSecondaryContactEmail] = useState('');

  // ── Schedule
  const [preferredSlot, setPreferredSlot] = useState('Morning');

  // ── Package
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [duration, setDuration] = useState('monthly');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ── Payment
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const selectedPackage = packages.find(p => p.id === selectedPackageId);

  useEffect(() => {
    packageApi.getAll().then(setPackages).catch(() => toast.error('Failed to load packages'));
  }, []);

  // Auto-set amount to package price when package is selected
  useEffect(() => {
    if (selectedPackage && !amountPaid) {
      setAmountPaid(String(selectedPackage.basePrice || 0));
    }
  }, [selectedPackage]);

  // Phone debounce check
  useEffect(() => {
    if (subscriberPhone.length < 10) {
      setPhoneCheck(null);
      return;
    }
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    phoneDebounce.current = setTimeout(async () => {
      setPhoneChecking(true);
      try {
        const data = await enrollmentApi.checkPhone(subscriberPhone);
        setPhoneCheck(data);
        if (data.exists && data.name) {
          setSubscriberName(data.name);
        }
      } catch {
        setPhoneCheck(null);
      } finally {
        setPhoneChecking(false);
      }
    }, 600);
  }, [subscriberPhone]);


  const goNext = () => {
    const nextIndex = Math.min(STEPS.length - 1, stepIndex + 1);
    setStep(STEPS[nextIndex].id);
  };

  const goBack = () => {
    if (stepIndex === 0) return navigate(-1);
    const prevIndex = Math.max(0, stepIndex - 1);
    setStep(STEPS[prevIndex].id);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const result = await enrollmentApi.adminEnroll({
        subscriberPhone,
        subscriberName,
        subscriberEmail,
        subscriberAddress,
        subscriberPincode,
        subscriberCity,
        subscriberState,
        sameAsSubscriber,
        beneficiaryPhone,
        beneficiaryName,
        beneficiaryAge: parseInt(beneficiaryAge) || 0,
        beneficiaryDob,
        beneficiaryGender,
        maritalStatus,
        profilePhoto,
        beneficiaryAddress,
        beneficiaryPincode,
        beneficiaryCity,
        beneficiaryState,
        relationship,
        medicalConditions,
        medications,
        vitalsToTrack,
        primaryPhysicianName,
        primaryPhysicianPhone,
        hobbiesInterests,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship: emergencyContactRel,
        emergencyContactEmail,
        secondaryContactName,
        secondaryContactPhone,
        secondaryContactRelationship: secondaryContactRel,
        secondaryContactEmail,
        preferredSlot,
        packageId: selectedPackageId,
        duration,
        startDate,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod,
        paymentNote,
      });
      setEnrolledResult(result);
      setStep('confirm');
      toast.success('Enrollment successful! ✅');
    } catch (err: any) {
      toast.error(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const canProceedSubscriber = subscriberPhone.length >= 10 && subscriberName.trim().length > 0;
  const canProceedBeneficiary = sameAsSubscriber
    ? true
    : beneficiaryName.trim().length > 0;
  const canProceedMedical = true; // Medical is optional as per user request
  const canProceedEmergency = emergencyContactName.trim().length > 0 && emergencyContactPhone.length >= 10;
  const canProceedPackage = !!selectedPackageId;
  const canProceedPayment = !!amountPaid && parseFloat(amountPaid) >= 0;

  const endDate = (() => {
    if (!startDate) return '';
    const d = new Date(startDate);
    if (duration === 'six_months') d.setMonth(d.getMonth() + 6);
    else if (duration === 'annual') d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  if (step === 'confirm' && enrolledResult) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Enrollment Complete!</h1>
        <p className="text-muted-foreground mb-8">The subscriber has been successfully enrolled in the package.</p>

        <Card className="mb-6 text-left">
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-bold font-mono text-primary">{enrolledResult.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscriber</span>
              <span className="font-semibold">{enrolledResult.subscriber?.name} ({enrolledResult.subscriber?.phone})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beneficiary</span>
              <span className="font-semibold">{enrolledResult.beneficiary?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{enrolledResult.package?.name}</span>
                {enrolledResult.package && (
                  <Badge 
                    variant="secondary" 
                    className={`text-[8px] uppercase px-1 h-3.5 border-none ${
                      enrolledResult.package.isGlobal 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {enrolledResult.package.isGlobal ? 'Global' : 'Private'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">Amount Collected</span>
              <span className="font-bold text-green-700">₹{amountPaid} <span className="font-normal text-muted-foreground">via {paymentMethod}</span></span>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mb-8 flex gap-2 items-start">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            The subscriber can log in to the app using <strong>{subscriberPhone}</strong> via OTP and their package will appear automatically.
          </span>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/subscribers')} variant="outline">
            <Users className="w-4 h-4 mr-2" /> View Subscribers
          </Button>
          <Button onClick={() => { setStep('subscriber'); setEnrolledResult(null); setSubscriberPhone(''); setSubscriberName(''); setPhoneCheck(null); setSelectedPackageId(''); setAmountPaid(''); setBeneficiaryName(''); setBeneficiaryPhone(''); setSameAsSubscriber(false); }} className="bg-primary">
            <UserPlus className="w-4 h-4 mr-2" /> Enroll Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PageHeader
        title="Enroll Subscriber"
        description="Onboard a new subscriber and beneficiary to a care package"
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        }
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-0">
          {STEPS.filter(s => s.id !== 'confirm').map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = stepIndex > i;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone ? 'bg-green-500 border-green-500 text-white'
                    : isActive ? 'bg-primary border-primary text-white'
                    : 'bg-card border-border text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 2 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-4 ${isDone ? 'bg-green-400' : 'bg-border'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* ── Step 1: Subscriber ── */}
        {step === 'subscriber' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Subscriber Information</CardTitle>
              <CardDescription>The person responsible for the account and payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="sub-phone"
                      value={subscriberPhone}
                      onChange={e => setSubscriberPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="pl-9"
                      maxLength={10}
                    />
                    {phoneChecking && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-name">Full Name *</Label>
                  <Input
                    id="sub-name"
                    value={subscriberName}
                    onChange={e => setSubscriberName(e.target.value)}
                    placeholder="e.g. Sumit Kejriwal"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <Label htmlFor="sub-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="sub-email"
                      value={subscriberEmail}
                      onChange={e => setSubscriberEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-address">Permanent Address</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="sub-address"
                      value={subscriberAddress}
                      onChange={e => setSubscriberAddress(e.target.value)}
                      placeholder="Enter complete address"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="sub-pincode">Pincode</Label>
                  <Input 
                    id="sub-pincode" 
                    value={subscriberPincode} 
                    onChange={e => setSubscriberPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    placeholder="6-digit pincode" 
                    maxLength={6}
                  />
                  <PincodeCheck 
                    pincode={subscriberPincode} 
                    onCheck={(serviceable, zone) => {
                      if (serviceable && zone) {
                        if (!subscriberCity) setSubscriberCity(zone.city || '');
                        if (!subscriberState) setSubscriberState(zone.state || '');
                      }
                    }} 
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <Label htmlFor="sub-city">City</Label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input id="sub-city" className="pl-9" value={subscriberCity} onChange={e => setSubscriberCity(e.target.value)} placeholder="City" />
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <Label htmlFor="sub-state">State</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input id="sub-state" className="pl-9" value={subscriberState} onChange={e => setSubscriberState(e.target.value)} placeholder="State" />
                  </div>
                </div>
              </div>

              {phoneCheck && (
                <div className={`flex items-center gap-2 text-xs mt-1 px-2 py-1.5 rounded-lg ${phoneCheck.exists ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {phoneCheck.exists
                    ? <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Existing subscriber found — <strong>{phoneCheck.beneficiaries?.length || 0} beneficiar{(phoneCheck.beneficiaries?.length || 0) === 1 ? 'y' : 'ies'}</strong> enrolled.</>
                    : <><Check className="w-3.5 h-3.5 flex-shrink-0" /> New phone — a fresh subscriber account will be created.</>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Beneficiary ── */}
        {step === 'beneficiary' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserSquare className="w-5 h-5 text-primary" /> Beneficiary Profile</CardTitle>
              <CardDescription>The senior member receiving the care services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <input
                  type="checkbox"
                  id="same-as-sub"
                  checked={sameAsSubscriber}
                  onChange={e => setSameAsSubscriber(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="same-as-sub" className="text-sm font-semibold text-blue-900 cursor-pointer">
                  Beneficiary is the same as Subscriber ({subscriberName})
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex justify-center mb-2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30 relative">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                      <input 
                        type="text" 
                        className="hidden" 
                        placeholder="URL" 
                        onChange={e => setProfilePhoto(e.target.value)} 
                        onFocus={(e) => {
                          const url = prompt('Enter profile photo URL:');
                          if (url) setProfilePhoto(url);
                        }}
                      />
                    </label>
                  </div>
                </div>

                {!sameAsSubscriber && (
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="ben-phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="ben-phone"
                        className="pl-9"
                        value={beneficiaryPhone}
                        onChange={e => setBeneficiaryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Beneficiary's mobile number"
                        maxLength={10}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-name">Beneficiary Name *</Label>
                  <Input id="ben-name" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="Full name" />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-dob">Date of Birth</Label>
                  <Input id="ben-dob" type="date" value={beneficiaryDob} onChange={e => setBeneficiaryDob(e.target.value)} />
                </div>

                <div className="space-y-1 sm:col-span-1 col-span-2">
                  <Label>Gender</Label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <Button 
                        key={g} 
                        type="button"
                        variant={beneficiaryGender === g ? 'default' : 'outline'}
                        className="flex-1 capitalize text-xs h-9"
                        onClick={() => setBeneficiaryGender(g)}
                      >
                        {g}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1 col-span-2">
                  <Label>Marital Status</Label>
                  <select
                    className="w-full border border-input rounded-md h-9 px-3 text-sm bg-background"
                    value={maritalStatus}
                    onChange={e => setMaritalStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-addr">Residential Address</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input id="ben-addr" className="pl-9" value={beneficiaryAddress} onChange={e => setBeneficiaryAddress(e.target.value)} placeholder="Complete address" />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-pincode">Pincode</Label>
                  <Input 
                    id="ben-pincode" 
                    value={beneficiaryPincode} 
                    onChange={e => setBeneficiaryPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    placeholder="6-digit pincode" 
                    maxLength={6}
                  />
                  <PincodeCheck 
                    pincode={beneficiaryPincode} 
                    onCheck={(serviceable, zone) => {
                      if (serviceable && zone && !sameAsSubscriber) {
                        if (!beneficiaryCity) setBeneficiaryCity(zone.city || '');
                        if (!beneficiaryState) setBeneficiaryState(zone.state || '');
                      }
                    }}
                  />
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-city">City</Label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input id="ben-city" className="pl-9" value={beneficiaryCity} onChange={e => setBeneficiaryCity(e.target.value)} placeholder="City" />
                  </div>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label htmlFor="ben-state">State</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input id="ben-state" className="pl-9" value={beneficiaryState} onChange={e => setBeneficiaryState(e.target.value)} placeholder="State" />
                  </div>
                </div>

                {!sameAsSubscriber && (
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="ben-rel">Relationship to Subscriber</Label>
                    <Input id="ben-rel" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="e.g. Father, Mother" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Medical & Life ── */}
        {step === 'medical' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" /> Medical Information
                  </CardTitle>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-primary text-primary hover:bg-primary/5">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Medical Information</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input 
                        placeholder="e.g., Hypertension, Diabetes" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val && !medicalConditions.includes(val)) {
                              setMedicalConditions([...medicalConditions, val]);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        className="w-full bg-orange-500 hover:bg-orange-600"
                        onClick={(e) => {
                           const input = e.currentTarget.closest('[role="dialog"]')?.querySelector('input');
                           if (input?.value.trim()) {
                             setMedicalConditions([...medicalConditions, input.value.trim()]);
                             input.value = '';
                           }
                        }}
                      >
                        Add Condition
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {medicalConditions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No conditions added</p>
                  )}
                  {medicalConditions.map((condition) => (
                    <Badge 
                      key={condition} 
                      variant="secondary" 
                      className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-none py-1.5 px-3 flex items-center gap-2 rounded-lg"
                    >
                      {condition}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-orange-900" 
                        onClick={() => setMedicalConditions(medicalConditions.filter(c => c !== condition))}
                      />
                    </Badge>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-primary" /> Current Medications
                    </Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-primary text-primary hover:bg-primary/5">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Medicine</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4 py-4" onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const slots = ['morning', 'afternoon', 'evening'].filter(s => fd.get(`slot-${s}`) === 'on');
                          const newMed = {
                            name: fd.get('name') as string,
                            dosage: fd.get('dosage') as string,
                            frequency: fd.get('frequency') as string,
                            timeSlots: slots,
                            setReminders: fd.get('reminders') === 'on'
                          };
                          if (newMed.name) {
                            setMedications([...medications, newMed]);
                            (e.target as HTMLFormElement).reset();
                          }
                        }}>
                          <div className="space-y-2">
                            <Label>Medication Name</Label>
                            <Input name="name" placeholder="e.g., Amoxicillin" required />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Dosage</Label>
                              <Input name="dosage" placeholder="250mg" />
                            </div>
                            <div className="space-y-2">
                              <Label>Frequency</Label>
                              <Select name="frequency" defaultValue="once_daily">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="once_daily">Once Daily</SelectItem>
                                  <SelectItem value="twice_daily">Twice Daily</SelectItem>
                                  <SelectItem value="thrice_daily">Thrice Daily</SelectItem>
                                  <SelectItem value="as_needed">As Needed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Times per day</Label>
                            <div className="flex gap-2">
                              {['morning', 'afternoon', 'evening'].map(slot => (
                                <div key={slot} className="flex-1">
                                  <input type="checkbox" name={`slot-${slot}`} id={`slot-${slot}`} className="peer hidden" />
                                  <label 
                                    htmlFor={`slot-${slot}`}
                                    className="block w-full text-center py-2 text-xs rounded-full border border-border cursor-pointer peer-checked:bg-orange-500 peer-checked:text-white peer-checked:border-orange-500 capitalize transition-colors"
                                  >
                                    {slot}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Set Reminders</Label>
                              <p className="text-[10px] text-muted-foreground">Get notified when it's time to take meds</p>
                            </div>
                            <Switch name="reminders" />
                          </div>
                          <DialogFooter className="pt-2">
                            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">Add to Schedule</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {medications.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No medications added</p>
                    )}
                    {medications.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                             <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.dosage} • {m.frequency.replace('_', ' ')}</p>
                            <div className="flex gap-1 mt-1">
                              {m.timeSlots?.map((slot: string) => (
                                <Badge key={slot} variant="outline" className="text-[9px] py-0 px-1.5 h-4 capitalize bg-background">{slot}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => setMedications(medications.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                  <div className="space-y-1">
                    <Label className="text-xs">Primary Physician Name</Label>
                    <Input value={primaryPhysicianName} onChange={e => setPrimaryPhysicianName(e.target.value)} placeholder="Dr. Name" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Physician Phone Number</Label>
                    <Input value={primaryPhysicianPhone} onChange={e => setPrimaryPhysicianPhone(e.target.value)} placeholder="Contact number" className="h-9" />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" /> Hobbies & Interests
                    </Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1 rounded-full border-primary text-primary hover:bg-primary/5">
                          <Plus className="w-3.5 h-3.5" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Add Hobby/Interest</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Input 
                            placeholder="e.g., Reading, Gardening, Yoga" 
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim();
                                if (val && !hobbiesInterests.includes(val)) {
                                  setHobbiesInterests([...hobbiesInterests, val]);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground mt-2">This helps us create meaningful social connections</p>
                        </div>
                        <DialogFooter>
                          <Button 
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            onClick={(e) => {
                              const input = e.currentTarget.closest('[role="dialog"]')?.querySelector('input');
                              if (input?.value.trim()) {
                                setHobbiesInterests([...hobbiesInterests, input.value.trim()]);
                                input.value = '';
                              }
                            }}
                          >
                            Add Hobby
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {hobbiesInterests.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No hobbies added</p>
                    )}
                    {hobbiesInterests.map((hobby) => (
                      <Badge 
                        key={hobby} 
                        variant="secondary" 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none py-1 px-3 flex items-center gap-2 rounded-lg"
                      >
                        {hobby}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-blue-900" 
                          onClick={() => setHobbiesInterests(hobbiesInterests.filter(h => h !== hobby))}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="w-4 h-4 text-primary" /> Vitals to Track</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 py-2">
                {Object.entries(vitalsToTrack).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox 
                      id={`vital-${key}`} 
                      checked={val} 
                      onCheckedChange={checked => setVitalsToTrack({ ...vitalsToTrack, [key]: !!checked })} 
                    />
                    <label htmlFor={`vital-${key}`} className="text-xs font-medium cursor-pointer capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 4: Emergency Support ── */}
        {step === 'emergency' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary font-bold"><CheckCircle2 className="w-5 h-5" /> Primary Emergency Contact</CardTitle>
                <CardDescription>Highest priority contact for emergencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Full Name *</Label>
                    <Input value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone Number *</Label>
                    <Input value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} placeholder="10-digit number" />
                  </div>
                  <div className="space-y-1">
                    <Label>Relationship</Label>
                    <Input value={emergencyContactRel} onChange={e => setEmergencyContactRel(e.target.value)} placeholder="e.g. Son" />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={emergencyContactEmail} onChange={e => setEmergencyContactEmail(e.target.value)} placeholder="email@ext.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Secondary Emergency Contact (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input value={secondaryContactName} onChange={e => setSecondaryContactName(e.target.value)} placeholder="Name" className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone Number</Label>
                    <Input value={secondaryContactPhone} onChange={e => setSecondaryContactPhone(e.target.value)} placeholder="Number" className="h-9" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 5: Package & Schedule ── */}
        {step === 'package' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Plan & Timing</CardTitle>
              <CardDescription>Select the care package and specify service timings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Service Preferred Slot</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Morning', 'Afternoon', 'Evening'].map(slot => (
                    <Button 
                      key={slot} 
                      type="button"
                      variant={preferredSlot === slot ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setPreferredSlot(slot)}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <Label>Choose Package</Label>
                {packages.filter(p => p.isActive).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">No active packages found.</p>
                )}
                {packages.filter(p => p.isActive).map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPackageId === pkg.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{pkg.name}</p>
                          <Badge 
                            variant="secondary" 
                            className={`text-[9px] uppercase px-1.5 h-4 border-none ${
                              pkg.isGlobal 
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pkg.isGlobal ? 'Global' : 'Private'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">₹{pkg.basePrice} / month</p>
                      </div>
                      {selectedPackageId === pkg.id && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPackageId && (
                <>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATION_OPTIONS.map(d => (
                        <Button
                          key={d.value}
                          variant={duration === d.value ? 'default' : 'outline'}
                          onClick={() => setDuration(d.value)}
                          className="h-9 text-xs"
                        >
                          {d.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="start-date" className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Start Date</Label>
                    <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="max-w-xs" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Step 6: Payment ── */}
        {step === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Details</CardTitle>
              <CardDescription>Record the offline payment for this enrollment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPackage && (
                <div className="bg-secondary/60 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{selectedPackage.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{duration.replace('_', ' ')} plan · starts {startDate}</p>
                  </div>
                  <div className="text-right">
                    {selectedPackage.mrp > selectedPackage.basePrice && <p className="text-xs line-through text-muted-foreground">₹{selectedPackage.mrp}</p>}
                    <p className="text-xl font-bold text-primary">₹{selectedPackage.basePrice}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="amount">Amount Collected (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  placeholder="e.g. 4999"
                  className="text-lg font-bold"
                />
                {selectedPackage && parseFloat(amountPaid) < selectedPackage.basePrice && amountPaid !== '' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Amount is less than the package price — a discount of ₹{(selectedPackage.basePrice - parseFloat(amountPaid)).toFixed(0)} will be recorded.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Payment Method</Label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${paymentMethod === m ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary/40'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pay-note">Transaction Reference / Notes (optional)</Label>
                <Input id="pay-note" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="e.g. UPI ref: 1234567890 or Cash handed to coordinator" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step Preview ── */}
        {step === 'payment' && canProceedPayment && (
          <Card className="mt-4 border-dashed bg-secondary/20">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Enrollment Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subscriber</span><span className="font-medium">{subscriberName} ({subscriberPhone})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Beneficiary</span><span className="font-medium">{sameAsSubscriber ? subscriberName : beneficiaryName} {!sameAsSubscriber && beneficiaryPhone ? `(${beneficiaryPhone})` : ''}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedPackage?.name}</span>
                    {selectedPackage && (
                      <Badge 
                        variant="secondary" 
                        className={`text-[8px] uppercase px-1 h-3.5 border-none ${
                          selectedPackage.isGlobal 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {selectedPackage.isGlobal ? 'Global' : 'Private'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium capitalize">{duration.replace('_', ' ')} · until {endDate}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Amount</span><span className="font-bold text-green-700">₹{amountPaid} via {paymentMethod}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Navigation buttons ── */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step === 'subscriber' ? 'Cancel' : 'Back'}
          </Button>

          {step !== 'payment' ? (
            <Button
              onClick={goNext}
              disabled={
                (step === 'subscriber' && !canProceedSubscriber) ||
                (step === 'beneficiary' && !canProceedBeneficiary) ||
                (step === 'emergency' && (!emergencyContactName || !emergencyContactPhone)) ||
                (step === 'package' && !canProceedPackage)
              }
              className="bg-primary"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleEnroll}
              disabled={!canProceedPayment || enrolling}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
