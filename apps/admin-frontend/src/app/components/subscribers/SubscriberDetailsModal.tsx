import React, { useEffect, useState } from 'react';
import { X, User, Phone, Mail, MapPin, Package, Calendar, Loader2, Users, Heart, Activity, Thermometer, Droplet, Scale, RefreshCw, UserCheck, ChevronRight } from 'lucide-react';
import { subscriberApi, beneficiaryApi } from '../../../services/api';
import { StatusChip } from '../common/StatusChip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { Beneficiary } from '../../../types';

interface SubscriberDetailsModalProps {
  subscriberId: string | null;
  onClose: () => void;
}

const vitalIcons: any = {
  bloodPressure: Activity, spO2: Activity, temperature: Thermometer,
  heartRate: Heart, bloodSugar: Droplet, weight: Scale,
};

interface StaffPool {
  careCompanions: { id: string; userId: string; name: string; zone: string; isAvailable: boolean }[];
  fieldManagers: { id: string; userId: string; name: string; zone: string; isAvailable: boolean }[];
  zones: { id: string; name: string; pincode: string }[];
}

export default function SubscriberDetailsModal({ subscriberId, onClose }: SubscriberDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beneficiary inner profile state
  const [selectedBen, setSelectedBen] = useState<any | null>(null);
  const [benDialogOpen, setBenDialogOpen] = useState(false);
  const [staffPool, setStaffPool] = useState<StaffPool>({ careCompanions: [], fieldManagers: [], zones: [] });
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pendingPrimary, setPendingPrimary] = useState<string | null | undefined>(undefined);
  const [pendingSecondary, setPendingSecondary] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!subscriberId) return;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await subscriberApi.getById(subscriberId);
        setDetails(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load subscriber details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [subscriberId]);

  const openBeneficiary = async (ben: any) => {
    // Fetch fresh full beneficiary data (normalised, same as BeneficiariesPage)
    try {
      const fresh = await beneficiaryApi.getById(ben.id);
      setSelectedBen(fresh || ben);
    } catch {
      setSelectedBen(ben);
    }
    setPendingPrimary(undefined);
    setPendingSecondary(undefined);
    setStaffPool({ careCompanions: [], fieldManagers: [], zones: [] });
    setBenDialogOpen(true);

    if (ben.pincode) {
      setLoadingStaff(true);
      try {
        const pool = await beneficiaryApi.getAvailableStaff(ben.pincode);
        setStaffPool(pool);
      } catch { } finally {
        setLoadingStaff(false);
      }
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedBen) return;
    setAssigning(true);
    try {
      const payload: any = {};
      if (pendingPrimary !== undefined) payload.primaryCcId = pendingPrimary;
      if (pendingSecondary !== undefined) payload.secondaryCcId = pendingSecondary;
      await beneficiaryApi.assignStaff(selectedBen.id, payload);
      toast.success('Staff assigned successfully!');
      setPendingPrimary(undefined);
      setPendingSecondary(undefined);
      // Refresh subscriber details
      const data = await subscriberApi.getById(subscriberId!);
      setDetails(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const effectivePrimary = pendingPrimary !== undefined ? pendingPrimary : selectedBen?.primaryCcId;
  const effectiveSecondary = pendingSecondary !== undefined ? pendingSecondary : selectedBen?.secondaryCcId;
  const hasChanges = pendingPrimary !== undefined || pendingSecondary !== undefined;

  if (!subscriberId) return null;

  return (
    <>
      {/* ── Outer: Subscriber Profile Modal ────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gray-50/60">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Subscriber Profile</h2>
              <p className="text-xs font-medium text-gray-400 mt-0.5">Subscription &amp; beneficiary overview</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all border border-gray-100 shadow-sm">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 bg-gray-50/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#FF7A00] gap-3">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-bold text-xs uppercase tracking-widest opacity-70">Loading Record...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-3">
                <p className="font-bold text-xs uppercase tracking-widest">{error}</p>
              </div>
            ) : details ? (
              <>
                {/* ── Profile Strip ── */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-7 h-7 text-[#FF7A00]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-lg font-black text-gray-900 truncate">{details.name}</h1>
                      <StatusChip status={details.isActive ? 'Active' : 'Inactive'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      {details.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#FF7A00]" />{details.phone}</span>}
                      {details.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500" />{details.email}</span>}
                      {details.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-green-600" />{details.address}</span>}
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-purple-500" />Joined {details.createdAt ? new Date(details.createdAt).toLocaleDateString('en-IN') : '--'}</span>
                    </div>
                  </div>
                </div>

                {/* ── Active Package ── */}
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#FF7A00] flex items-center gap-2">
                      <Package className="w-4 h-4" /> Current Packages
                    </h3>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{details.subscriptions?.length || 0} Active</span>
                  </div>
                  {details.subscriptions && details.subscriptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {details.subscriptions.map((sub: any, i: number) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                          <p className="font-black text-gray-800">{sub.package?.name || 'Unknown Package'}</p>
                          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">{sub.package?.type || 'Standard'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white py-6 rounded-xl border border-dashed border-orange-200 flex flex-col items-center">
                      <Package className="w-6 h-6 text-orange-200 mb-1" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Active Packages</p>
                    </div>
                  )}
                </div>

                {/* ── Beneficiaries — compact clickable rows ── */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Registered Beneficiaries
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">{details.beneficiaries?.length || 0} Total</span>
                  </div>

                  {details.beneficiaries && details.beneficiaries.length > 0 ? (
                    <div className="space-y-2">
                      {details.beneficiaries.map((b: any) => (
                        <button
                          key={b.id}
                          onClick={() => openBeneficiary(b)}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#FF7A00]/40 hover:shadow-sm transition-all text-left group"
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 border border-orange-100">
                            <User className="w-5 h-5 text-[#FF7A00]" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-gray-900 truncate">{b.name}</p>
                              {b.age && <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">{b.age}y</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{b.relationship || 'Family Member'}</p>
                          </div>

                          {/* CC Chips */}
                          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                            {b.primaryCC?.name ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5" />{b.primaryCC.name}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100">No CC</span>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF7A00] transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                      <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No Beneficiaries</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Inner: Beneficiary Profile Dialog (same as BeneficiariesPage) ── */}
      <Dialog open={benDialogOpen} onOpenChange={setBenDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBen && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBen.name}</DialogTitle>
                <DialogDescription>Complete care profile and clinical configuration</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="assign">Assign Staff</TabsTrigger>
                  <TabsTrigger value="clinical">Clinical Config</TabsTrigger>
                </TabsList>

                {/* ─── Profile Tab ─── */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-muted-foreground">Age</Label><p className="font-medium">{selectedBen.age} years</p></div>
                    <div><Label className="text-muted-foreground">Gender</Label><p className="font-medium capitalize">{selectedBen.gender}</p></div>
                  </div>

                  {selectedBen.pincode && (
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Zone Pincode</p>
                        <p className="text-sm font-semibold">{selectedBen.pincode} {selectedBen.city ? `• ${selectedBen.city}` : ''}{selectedBen.state ? `, ${selectedBen.state}` : ''}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Medical History</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedBen.medicalHistory || []).map((c: string) => <span key={c} className="px-3 py-1 bg-[#FFF5EE] text-[#FF7A00] rounded-full text-sm">{c}</span>)}
                        {!(selectedBen.medicalHistory || []).length && <span className="text-sm text-muted-foreground">None recorded</span>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Medications</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(selectedBen.medications || []).map((m: string) => <span key={m} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">{m}</span>)}
                        {!(selectedBen.medications || []).length && <span className="text-sm text-muted-foreground">No medications logged</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <Label className="text-muted-foreground">Emergency Contact</Label>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">{selectedBen.emergencyContact?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{selectedBen.emergencyContact?.relation}</p>
                        <p className="text-sm">{selectedBen.emergencyContact?.phone}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <Label className="text-muted-foreground">Assigned Staff</Label>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium text-sm">Primary CC: <span className="font-normal text-muted-foreground">{selectedBen.careCompanion || 'Unassigned'}</span></p>
                        <p className="font-medium text-sm">Secondary CC: <span className="font-normal text-muted-foreground">{selectedBen.secondaryCareCompanion || 'Unassigned'}</span></p>
                        <p className="font-medium text-sm">Field Manager: <span className="font-normal text-muted-foreground">{selectedBen.fieldManager || 'Unassigned'}</span></p>
                      </div>
                    </div>
                  </div>
                  <div><Label className="text-muted-foreground">Status</Label><div className="mt-2"><StatusChip status={selectedBen.isActive ? 'Active' : 'Inactive'} /></div></div>
                </TabsContent>

                {/* ─── Assign Staff Tab ─── */}
                <TabsContent value="assign" className="space-y-4 mt-4">
                  {!selectedBen.pincode ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <MapPin className="w-10 h-10 text-muted-foreground/40" />
                      <p className="font-semibold text-muted-foreground">No pincode available</p>
                    </div>
                  ) : loadingStaff ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading staff for pincode {selectedBen.pincode}…
                    </div>
                  ) : (
                    <>
                      {staffPool.zones.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="text-orange-700 font-semibold">Zones matched: </span>
                          <span className="text-orange-600">{staffPool.zones.map(z => z.name).join(', ')}</span>
                        </div>
                      )}

                      {/* Primary CC */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /><Label className="font-bold text-sm uppercase tracking-wide">Primary Care Companion</Label></div>
                        {staffPool.careCompanions.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4">No active Care Companions found in this zone.</p>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            <button onClick={() => setPendingPrimary(null)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectivePrimary === null ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:bg-secondary'}`}>
                              <p className="font-semibold">None — Unassign</p>
                            </button>
                            {staffPool.careCompanions.map(cc => (
                              <button key={cc.id} onClick={() => setPendingPrimary(cc.id)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectivePrimary === cc.id ? 'bg-orange-50 border-orange-300' : 'border-border hover:bg-secondary'} ${!cc.isAvailable ? 'opacity-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div><p className="font-semibold">{cc.name}</p><p className="text-xs text-muted-foreground">{cc.zone}{!cc.isAvailable ? ' • Unavailable' : ''}</p></div>
                                  {effectivePrimary === cc.id && <UserCheck className="w-4 h-4 text-orange-500" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Secondary CC */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /><Label className="font-bold text-sm uppercase tracking-wide">Secondary Care Companion</Label></div>
                        {staffPool.careCompanions.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4">No active Care Companions in zone.</p>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            <button onClick={() => setPendingSecondary(null)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectiveSecondary === null ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:bg-secondary'}`}>
                              <p className="font-semibold">None — Unassign</p>
                            </button>
                            {staffPool.careCompanions.filter(cc => cc.id !== effectivePrimary).map(cc => (
                              <button key={cc.id} onClick={() => setPendingSecondary(cc.id)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectiveSecondary === cc.id ? 'bg-blue-50 border-blue-300' : 'border-border hover:bg-secondary'} ${!cc.isAvailable ? 'opacity-50' : ''}`}>
                                <div className="flex items-center justify-between">
                                  <div><p className="font-semibold">{cc.name}</p><p className="text-xs text-muted-foreground">{cc.zone}{!cc.isAvailable ? ' • Unavailable' : ''}</p></div>
                                  {effectiveSecondary === cc.id && <UserCheck className="w-4 h-4 text-blue-500" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button onClick={handleAssignStaff} disabled={!hasChanges || assigning} className="w-full bg-primary">
                        {assigning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Users className="w-4 h-4 mr-2" />Save Staff Assignments</>}
                      </Button>
                    </>
                  )}
                </TabsContent>

                {/* ─── Clinical Config Tab ─── */}
                <TabsContent value="clinical" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">Configure which vitals to monitor for this beneficiary</p>
                  {Object.entries(selectedBen.clinicalConfiguration || {}).map(([key, config]) => {
                    const cfg = config as any;
                    const vitalKey = key as keyof Beneficiary['clinicalConfiguration'];
                    const Icon = vitalIcons[vitalKey] || Activity;
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                    return (
                      <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${cfg.enabled ? 'bg-[#DFF4E6]' : 'bg-secondary'}`}>
                            <Icon className={`w-5 h-5 ${cfg.enabled ? 'text-success-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">Frequency: {cfg.frequency}{cfg.alertThresholds && <span className="ml-2">• Thresholds: {cfg.alertThresholds.min ?? '-'} - {cfg.alertThresholds.max ?? '-'}</span>}</p>
                          </div>
                        </div>
                        <Switch checked={cfg.enabled} onCheckedChange={() => {}} />
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
