/**
 * Field Management Portal
 * 4-Tab View: My Team | Schedule | Beneficiaries | Benefit Usage
 * Field Managers: See only their team CCs and assigned beneficiaries.
 * Admins: See all data.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { fieldManagerApi, beneficiaryApi } from '../../services/api';
import { toast } from 'sonner';
import {
  Users, Calendar, UserCheck, BarChart3, RefreshCw,
  ChevronRight, Clock, CheckCircle2, AlertCircle,
  ActivitySquare, Phone, MapPin, Star, Loader2, X
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in_progress': return '#3b82f6';
    case 'scheduled': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return '#94a3b8';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'scheduled': return 'Scheduled';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Tab: My Team ─────────────────────────────────────────────────────────────
function MyTeamTab({ team, loading, onRefresh }: { team: any[]; loading: boolean; onRefresh: () => void }) {
  if (loading) return <LoadingState message="Loading your team..." />;
  if (!team.length) return <EmptyState message="No care companions found in your team." icon={<Users className="w-12 h-12" />} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{team.length} Care Companion{team.length > 1 ? 's' : ''} in your team</p>
        <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(cc => (
          <div key={cc.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                  {cc.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{cc.name}</p>
                  <p className="text-xs text-muted-foreground">{cc.ccType === 'nurse' ? '🏥 Nurse' : '🤝 Care Assistant'}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${cc.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {cc.isAvailable ? '● Available' : '● Busy'}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.primaryBeneficiariesCount}</p>
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.secondaryBeneficiariesCount}</p>
                <p className="text-xs text-muted-foreground">Secondary</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.todayVisitCount}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{cc.zone || 'Zone not assigned'}</span>
            </div>
            {cc.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Phone className="w-3 h-3 shrink-0" />
                <span>{cc.phone}</span>
              </div>
            )}
            {cc.teamName && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full">Team: {cc.teamName}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Schedule ────────────────────────────────────────────────────────────
function ScheduleTab({ team }: { team: any[] }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSchedule = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const data = await fieldManagerApi.getTeamSchedule(date);
      setVisits(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSchedule(selectedDate); }, [selectedDate, loadSchedule]);

  // Group visits by CC
  const visitsByCC: Record<string, any[]> = {};
  visits.forEach(v => {
    const key = v.careCompanionId || 'unassigned';
    if (!visitsByCC[key]) visitsByCC[key] = [];
    visitsByCC[key].push(v);
  });

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button onClick={() => setSelectedDate(todayStr())} className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-secondary transition-colors">
          Today
        </button>
        <span className="text-sm text-muted-foreground">{visits.length} visit{visits.length !== 1 ? 's' : ''} scheduled</span>
      </div>

      {loading ? <LoadingState message="Loading schedule..." /> : (
        <div className="space-y-4">
          {/* Summary by CC */}
          {team.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {team.map(cc => {
                const ccVisits = visitsByCC[cc.id] || [];
                const inProgress = ccVisits.filter((v: any) => v.status === 'in_progress').length;
                const done = ccVisits.filter((v: any) => v.status === 'completed').length;
                return (
                  <div key={cc.id} className="p-3 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                        {cc.name?.[0]}
                      </div>
                      <p className="text-xs font-medium truncate">{cc.name}</p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">{ccVisits.length} total</span>
                      {inProgress > 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{inProgress} active</span>}
                      {done > 0 && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">{done} done</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Visit Cards */}
          {visits.length === 0 ? (
            <EmptyState message={`No visits scheduled for ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.`} icon={<Calendar className="w-12 h-12" />} />
          ) : (
            <div className="space-y-3">
              {visits.map(v => (
                <div key={v.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                  <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: statusColor(v.status) }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{v.beneficiaryName}</p>
                        <p className="text-xs text-muted-foreground truncate">{v.beneficiaryAddress}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium" style={{ backgroundColor: `${statusColor(v.status)}22`, color: statusColor(v.status) }}>
                        {statusLabel(v.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(v.scheduledTime)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.careCompanionName}</span>
                      {v.durationMinutes && <span className="flex items-center gap-1"><ActivitySquare className="w-3 h-3" />{v.durationMinutes} min</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Beneficiaries ───────────────────────────────────────────────────────
function BeneficiariesTab({ team }: { team: any[] }) {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [pendingPrimary, setPendingPrimary] = useState<string | undefined>(undefined);
  const [pendingSecondary, setPendingSecondary] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fieldManagerApi.getBeneficiaries();
      setBeneficiaries(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openPanel = (b: any) => {
    setSelected(b);
    setPendingPrimary(undefined);
    setPendingSecondary(undefined);
  };

  const handleSave = async () => {
    if (!selected) return;
    const payload: any = {};
    if (pendingPrimary !== undefined) payload.primaryCcId = pendingPrimary || null;
    if (pendingSecondary !== undefined) payload.secondaryCcId = pendingSecondary || null;
    if (Object.keys(payload).length === 0) { toast.info('No changes to save'); return; }

    setSaving(true);
    try {
      await fieldManagerApi.assignCC(selected.id, payload);
      toast.success('Assignment saved. Notifications sent to CC and beneficiary.');
      setSelected(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading beneficiaries..." />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Beneficiary List */}
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{beneficiaries.length} beneficiar{beneficiaries.length !== 1 ? 'ies' : 'y'} assigned to you</p>
        {beneficiaries.length === 0
          ? <EmptyState message="No beneficiaries assigned to you yet." icon={<UserCheck className="w-12 h-12" />} />
          : beneficiaries.map(b => (
            <div
              key={b.id}
              onClick={() => openPanel(b)}
              className={`p-4 cursor-pointer border rounded-xl transition-all hover:shadow-md ${selected?.id === b.id ? 'border-orange-500 bg-orange-50/30' : 'border-border bg-card hover:border-orange-300'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {b.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.age}y • {b.city || b.pincode || 'Location N/A'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${b.primaryCcId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {b.primaryCcName || 'No Primary CC'}
                </span>
                {b.activePackage && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{b.activePackage}</span>}
              </div>
            </div>
          ))
        }
      </div>

      {/* Assignment Panel */}
      <div className={`bg-card border border-border rounded-xl p-5 ${!selected ? 'flex items-center justify-center' : ''}`}>
        {!selected ? (
          <div className="text-center text-muted-foreground">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select a beneficiary to manage their CC assignment</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{selected.age}y old • {selected.gender}</p>
              <p>{selected.address}</p>
              {selected.activePackage && <p className="text-blue-600 font-medium">Package: {selected.activePackage}</p>}
            </div>

            {/* Primary CC Assignment */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Primary Care Companion</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={pendingPrimary !== undefined ? (pendingPrimary || '') : (selected.primaryCcId || '')}
                onChange={e => setPendingPrimary(e.target.value || null)}
              >
                <option value="">— Unassign —</option>
                {team
                  .filter(cc => cc.id !== (pendingSecondary !== undefined ? pendingSecondary : selected.secondaryCcId))
                  .map(cc => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name} {cc.ccType === 'nurse' ? '(Nurse)' : '(Care Assistant)'} — {cc.primaryBeneficiariesCount} assigned
                    </option>
                  ))}
              </select>
            </div>

            {/* Secondary CC Assignment */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Secondary Care Companion</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={pendingSecondary !== undefined ? (pendingSecondary || '') : (selected.secondaryCcId || '')}
                onChange={e => setPendingSecondary(e.target.value || null)}
              >
                <option value="">— Unassign —</option>
                {team
                  .filter(cc => cc.id !== (pendingPrimary !== undefined ? pendingPrimary : selected.primaryCcId))
                  .map(cc => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name} {cc.ccType === 'nurse' ? '(Nurse)' : '(Care Assistant)'} — {cc.secondaryBeneficiariesCount} assigned
                    </option>
                  ))}
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              💬 Both the Care Companion and the Beneficiary will receive a notification when saved.
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Benefit Usage ───────────────────────────────────────────────────────
function BenefitUsageTab() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [usageData, setUsageData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBens, setLoadingBens] = useState(true);

  useEffect(() => {
    fieldManagerApi.getBeneficiaries()
      .then(d => { setBeneficiaries(d); if (d.length > 0) setSelectedId(d[0].id); })
      .finally(() => setLoadingBens(false));
  }, []);

  const loadUsage = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fieldManagerApi.getBenefitUsage(id);
      setUsageData(data?.data || data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load benefit usage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedId) loadUsage(selectedId); }, [selectedId, loadUsage]);

  if (loadingBens) return <LoadingState message="Loading beneficiaries..." />;
  if (!beneficiaries.length) return <EmptyState message="No beneficiaries assigned to you yet." icon={<BarChart3 className="w-12 h-12" />} />;

  return (
    <div className="space-y-6">
      {/* Beneficiary Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Select Beneficiary:</label>
        <select
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500 max-w-sm"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {beneficiaries.map(b => <option key={b.id} value={b.id}>{b.name} ({b.city || b.pincode || 'N/A'})</option>)}
        </select>
      </div>

      {loading ? <LoadingState message="Loading benefit usage..." /> : !usageData ? null : (
        <div className="space-y-6">
          {/* Subscription Summary */}
          {usageData.subscription && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-5">
              <p className="text-sm font-medium opacity-80">Active Package</p>
              <p className="text-xl font-bold mt-1">{usageData.subscription.packageName}</p>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <p className="opacity-70">Total Hours</p>
                  <p className="font-bold text-lg">{usageData.subscription.hoursTotal?.toFixed(1) || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-70">Used Hours</p>
                  <p className="font-bold text-lg">{usageData.subscription.hoursUsed?.toFixed(1) || '0'}</p>
                </div>
                <div>
                  <p className="opacity-70">Remaining</p>
                  <p className="font-bold text-lg">{usageData.subscription.hoursRemaining?.toFixed(1) || 'N/A'}</p>
                </div>
              </div>
              {usageData.subscription.hoursTotal && (
                <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (usageData.subscription.hoursUsed / usageData.subscription.hoursTotal) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Individual Benefit Balances */}
          {usageData.benefitBalances?.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-3">Individual Benefits</h3>
              <div className="space-y-3">
                {usageData.benefitBalances.map((b: any) => (
                  <div key={b.benefitId} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{b.benefitName}</p>
                        {b.description && <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.usagePercent >= 80 ? 'bg-red-100 text-red-600' : b.usagePercent >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {b.usagePercent}% used
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${b.usagePercent >= 80 ? 'bg-red-500' : b.usagePercent >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, b.usagePercent)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground shrink-0">
                        {b.usedUnits}/{b.totalUnits} {b.unitLabel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{b.remainingUnits} {b.unitLabel} remaining</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-border rounded-xl">
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No benefit balances found for this subscription.</p>
            </div>
          )}

          {/* Usage History */}
          {usageData.hoursLog?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Recent Usage History</h3>
              <div className="space-y-2">
                {usageData.hoursLog.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-xs">{log.description || 'Visit completed'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.careCompanionName} • {new Date(log.loggedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-500">−{log.hoursConsumed.toFixed(2)} hrs</p>
                      <p className="text-xs text-muted-foreground">{log.balanceAfter.toFixed(1)} hrs left</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="opacity-20 mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'team', label: 'My Team', icon: Users },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'beneficiaries', label: 'Beneficiaries', icon: UserCheck },
  { key: 'usage', label: 'Benefit Usage', icon: BarChart3 },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function FieldManagementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('team');
  const [team, setTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const data = await fieldManagerApi.getMyTeam();
      setTeam(data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Field Management Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your care companions, schedule visits, and track service delivery for your beneficiaries.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Team Size"
          value={team.length}
          icon={<Users className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          label="Available Now"
          value={team.filter(c => c.isAvailable).length}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="Active Visits"
          value={team.reduce((sum, c) => sum + c.activeVisitCount, 0)}
          icon={<ActivitySquare className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Today's Visits"
          value={team.reduce((sum, c) => sum + c.todayVisitCount, 0)}
          icon={<Calendar className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'team' && <MyTeamTab team={team} loading={teamLoading} onRefresh={loadTeam} />}
        {activeTab === 'schedule' && <ScheduleTab team={team} />}
        {activeTab === 'beneficiaries' && <BeneficiariesTab team={team} />}
        {activeTab === 'usage' && <BenefitUsageTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.orange}`}>
      <div className="flex items-center gap-2 mb-1 opacity-70">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
