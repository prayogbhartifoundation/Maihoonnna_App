/**
 * Beneficiaries Page - Full care profiles with Clinical Configuration
 * Updated: Assign primary/secondary CC and FM via pincode-based zone matching
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { beneficiaryApi } from '../../services/api';
import type { Beneficiary } from '../../types';
import { Heart, Activity, Thermometer, Droplet, Scale, Phone, RefreshCw, MapPin, UserCheck, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import DataFilter from '../components/common/DataFilter';

interface StaffPool {
  careCompanions: { id: string; userId: string; name: string; zone: string; isAvailable: boolean }[];
  fieldManagers: { id: string; userId: string; name: string; zone: string; isAvailable: boolean }[];
  zones: { id: string; name: string; pincode: string }[];
}

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedBen, setSelectedBen] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff assignment state
  const [staffPool, setStaffPool] = useState<StaffPool>({ careCompanions: [], fieldManagers: [], zones: [] });
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [pendingPrimary, setPendingPrimary] = useState<string | null | undefined>(undefined);
  const [pendingSecondary, setPendingSecondary] = useState<string | null | undefined>(undefined);

  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadData = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const resp = await beneficiaryApi.getAllPaginated({ search, searchBy, page, limit });
      setBeneficiaries(resp.data || []);
      setTotal(resp.total || 0);
      setTotalPages(resp.totalPages || 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  }, [search, searchBy, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const openBeneficiary = async (ben: any) => {
    setSelectedBen(ben);
    setPendingPrimary(undefined);
    setPendingSecondary(undefined);
    setStaffPool({ careCompanions: [], fieldManagers: [], zones: [] });

    if (ben.pincode) {
      setLoadingStaff(true);
      try {
        const pool = await beneficiaryApi.getAvailableStaff(ben.pincode);
        setStaffPool(pool);
      } catch (err) {
        console.error('Failed to load available staff', err);
      } finally {
        setLoadingStaff(false);
      }
    }
  };

  const handleVitalToggle = async (vitalKey: keyof Beneficiary['clinicalConfiguration'], enabled: boolean) => {
    if (!selectedBen) return;
    try {
      await beneficiaryApi.updateClinicalConfig(selectedBen.id, {
        [vitalKey]: { ...selectedBen.clinicalConfiguration[vitalKey], enabled },
      });
      await loadData();
      const updated = await beneficiaryApi.getById(selectedBen.id);
      if (updated) setSelectedBen(updated);
      toast.success(`${vitalKey} monitoring ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update configuration');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedBen) return;
    setAssigning(true);
    try {
      const payload: any = {};
      if (pendingPrimary !== undefined)   payload.primaryCcId   = pendingPrimary;
      if (pendingSecondary !== undefined) payload.secondaryCcId = pendingSecondary;

      await beneficiaryApi.assignStaff(selectedBen.id, payload);
      toast.success('Staff assigned successfully!');
      await loadData();
      // Refresh current view
      const fresh = beneficiaries.find(b => b.id === selectedBen.id);
      if (fresh) setSelectedBen({ ...fresh, ...payload });
      setPendingPrimary(undefined);
      setPendingSecondary(undefined);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const vitalIcons = {
    bloodPressure: Activity, spO2: Activity, temperature: Thermometer,
    heartRate: Heart, bloodSugar: Droplet, weight: Scale,
  };

  // We no longer return early on loading to prevent unmounting the filter bar
  // if (loading) { ... }

  if (error) {
    return (
      <div>
        <PageHeader title="Beneficiaries" description="Manage beneficiary care profiles and clinical configurations" />
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  const effectivePrimary   = pendingPrimary   !== undefined ? pendingPrimary   : selectedBen?.primaryCcId;
  const effectiveSecondary = pendingSecondary !== undefined ? pendingSecondary : selectedBen?.secondaryCcId;
  const hasChanges = pendingPrimary !== undefined || pendingSecondary !== undefined;

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        description="Manage beneficiary care profiles and clinical configurations"
      />

      <div className="mb-6">
        <DataFilter 
          searchByOptions={[
            { label: 'Name', value: 'name' },
            { label: 'City', value: 'city' },
            { label: 'Pincode', value: 'pincode' }
          ]}
          onFilterChange={(state) => {
            setSearch(state.search);
            setSearchBy(state.searchBy || '');
            setPage(1);
          }} 
        />
      </div>

      <div className="relative min-h-[400px]">
        {loading && beneficiaries.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground bg-white/50 rounded-3xl border border-dashed border-[#E7DED6]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading beneficiaries...
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white border border-[#E7DED6] rounded-3xl">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">No Beneficiaries Found</p>
            <p className="text-xs">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {beneficiaries.map((ben) => (
          <Dialog key={ben.id}>
            <DialogTrigger asChild>
              <div className="cursor-pointer" onClick={() => openBeneficiary(ben)}>
                <DataCard title={ben.name} description={`Age: ${ben.age} • ${ben.gender}`}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {(ben.medicalHistory || []).slice(0, 3).map((condition: string) => (
                        <span key={condition} className="text-xs px-2 py-1 bg-[#FFF5EE] text-[#FF7A00] rounded-full">
                          {condition}
                        </span>
                      ))}
                    </div>
                    {ben.pincode && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> Zone Pincode: <span className="font-semibold text-foreground">{ben.pincode}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>Emergency: {ben.emergencyContact?.name || 'N/A'}</span>
                      </div>
                    </div>
                    {(ben.careCompanion || ben.secondaryCareCompanion) && (
                      <div className="flex flex-wrap gap-1">
                        {ben.careCompanion && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-semibold">
                            <UserCheck className="w-3 h-3" /> {ben.careCompanion}
                          </span>
                        )}
                        {ben.secondaryCareCompanion && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">
                            <User className="w-3 h-3" /> {ben.secondaryCareCompanion}
                          </span>
                        )}
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </div>
                </DataCard>
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{ben.name}</DialogTitle>
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
                    <div><Label className="text-muted-foreground">Age</Label><p className="font-medium">{ben.age} years</p></div>
                    <div><Label className="text-muted-foreground">Gender</Label><p className="font-medium capitalize">{ben.gender}</p></div>
                  </div>

                  {ben.pincode && (
                    <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Zone Pincode</p>
                        <p className="text-sm font-semibold">{ben.pincode} {ben.city ? `• ${ben.city}` : ''} {ben.state ? `, ${ben.state}` : ''}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Medical History</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(ben.medicalHistory || []).map((condition: string) => (
                          <span key={condition} className="px-3 py-1 bg-[#FFF5EE] text-[#FF7A00] rounded-full text-sm">{condition}</span>
                        ))}
                        {(ben.medicalHistory || []).length === 0 && <span className="text-sm text-muted-foreground">None recorded</span>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Medications</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(ben.medications || []).map((med: string) => (
                          <span key={med} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">{med}</span>
                        ))}
                        {(ben.medications || []).length === 0 && <span className="text-sm text-muted-foreground">No medications logged</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <Label className="text-muted-foreground">Emergency Contact</Label>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">{ben.emergencyContact?.name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{ben.emergencyContact?.relation}</p>
                        <p className="text-sm">{ben.emergencyContact?.phone}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <Label className="text-muted-foreground">Assigned Staff</Label>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium text-sm">Primary CC: <span className="font-normal text-muted-foreground">{ben.careCompanion || 'Unassigned'}</span></p>
                        <p className="font-medium text-sm">Secondary CC: <span className="font-normal text-muted-foreground">{ben.secondaryCareCompanion || 'Unassigned'}</span></p>
                        <p className="font-medium text-sm">Field Manager: <span className="font-normal text-muted-foreground">{ben.fieldManager || 'Unassigned'}</span></p>
                      </div>
                    </div>
                  </div>

                  <div><Label className="text-muted-foreground">Status</Label><div className="mt-2"><StatusChip status={ben.isActive ? 'Active' : 'Inactive'} /></div></div>
                </TabsContent>

                {/* ─── Assign Staff Tab ─── */}
                <TabsContent value="assign" className="space-y-4 mt-4">
                  {!ben.pincode ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <MapPin className="w-10 h-10 text-muted-foreground/40" />
                      <p className="font-semibold text-muted-foreground">No pincode available</p>
                      <p className="text-sm text-muted-foreground max-w-xs">The beneficiary's address doesn't have a pincode linked. Staff will be visible once a pincode is saved on their profile.</p>
                    </div>
                  ) : loadingStaff ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading available staff for pincode {ben.pincode}…
                    </div>
                  ) : (
                    <>
                      {/* Zone Info */}
                      {staffPool.zones.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm">
                          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="text-orange-700 font-semibold">Zones matched: </span>
                          <span className="text-orange-600">{staffPool.zones.map(z => z.name).join(', ')}</span>
                        </div>
                      )}
                      {staffPool.zones.length === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-700">
                          <MapPin className="w-4 h-4 shrink-0" /> No zones found for pincode <strong>{ben.pincode}</strong>. Showing all active staff.
                        </div>
                      )}

                      {/* Primary CC Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <Label className="font-bold text-sm uppercase tracking-wide">Primary Care Companion</Label>
                        </div>
                        {staffPool.careCompanions.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4">No active Care Companions found in this zone.</p>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            <button
                              onClick={() => setPendingPrimary(null)}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectivePrimary === null ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:bg-secondary'}`}
                            >
                              <p className="font-semibold">None — Unassign</p>
                            </button>
                            {staffPool.careCompanions.map(cc => (
                              <button
                                key={cc.id}
                                onClick={() => setPendingPrimary(cc.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectivePrimary === cc.id ? 'bg-orange-50 border-orange-300' : 'border-border hover:bg-secondary'} ${!cc.isAvailable ? 'opacity-50' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">{cc.name}</p>
                                    <p className="text-xs text-muted-foreground">{cc.zone} {!cc.isAvailable ? '• Unavailable' : ''}</p>
                                  </div>
                                  {effectivePrimary === cc.id && <UserCheck className="w-4 h-4 text-orange-500" />}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Secondary CC Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <Label className="font-bold text-sm uppercase tracking-wide">Secondary Care Companion</Label>
                        </div>
                        {staffPool.careCompanions.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4">No active Care Companions found in this zone.</p>
                        ) : (
                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            <button
                              onClick={() => setPendingSecondary(null)}
                              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectiveSecondary === null ? 'bg-red-50 border-red-200 text-red-600' : 'border-border hover:bg-secondary'}`}
                            >
                              <p className="font-semibold">None — Unassign</p>
                            </button>
                            {staffPool.careCompanions
                              .filter(cc => cc.id !== effectivePrimary)
                              .map(cc => (
                                <button
                                  key={cc.id}
                                  onClick={() => setPendingSecondary(cc.id)}
                                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${effectiveSecondary === cc.id ? 'bg-blue-50 border-blue-300' : 'border-border hover:bg-secondary'} ${!cc.isAvailable ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold">{cc.name}</p>
                                      <p className="text-xs text-muted-foreground">{cc.zone} {!cc.isAvailable ? '• Unavailable' : ''}</p>
                                    </div>
                                    {effectiveSecondary === cc.id && <UserCheck className="w-4 h-4 text-blue-500" />}
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={handleAssignStaff}
                        disabled={!hasChanges || assigning}
                        className="w-full bg-primary"
                      >
                        {assigning ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                        ) : (
                          <><Users className="w-4 h-4 mr-2" /> Save Staff Assignments</>
                        )}
                      </Button>
                    </>
                  )}
                </TabsContent>

                {/* ─── Clinical Config Tab ─── */}
                <TabsContent value="clinical" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">Configure which vitals to monitor for this beneficiary</p>
                  {Object.entries(ben.clinicalConfiguration || {}).map(([key, config]) => {
                    const cfg = config as any;
                    const vitalKey = key as keyof Beneficiary['clinicalConfiguration'];
                    const Icon = vitalIcons[vitalKey];
                    const vitalLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${cfg.enabled ? 'bg-[#DFF4E6]' : 'bg-secondary'}`}>
                            <Icon className={`w-5 h-5 ${cfg.enabled ? 'text-success-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{vitalLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              Frequency: {cfg.frequency}
                              {cfg.alertThresholds && (
                                <span className="ml-2">• Thresholds: {cfg.alertThresholds.min ?? '-'} - {cfg.alertThresholds.max ?? '-'}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Switch checked={cfg.enabled} onCheckedChange={(checked) => handleVitalToggle(vitalKey, checked)} />
                      </div>
                    );
                  })}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        ))}
          </div>
        )}

        {/* Loading overlay for existing list */}
        {loading && beneficiaries.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] z-10 rounded-3xl">
            <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-[#E7DED6] flex items-center gap-2 text-sm font-bold text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin text-[#FF7A00]" /> Updating...
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center bg-white border border-[#E7DED6] rounded-[24px] px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Showing <span className="text-primary">{(page - 1) * limit + 1}</span> to <span className="text-primary">{Math.min(page * limit, total)}</span> of <span className="text-primary">{total}</span> beneficiaries
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition bg-[#F4EAE3] text-gray-600 hover:bg-[#E7DED6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition bg-[#F4EAE3] text-gray-600 hover:bg-[#E7DED6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
