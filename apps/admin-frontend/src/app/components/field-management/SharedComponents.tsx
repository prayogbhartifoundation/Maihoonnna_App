import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Users, RefreshCw, MapPin, Phone, Calendar, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { fieldManagerApi } from '../../../services/api';
import { toast } from 'sonner';

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="opacity-20 mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
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

export function statusColor(status: string) {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in_progress': return '#3b82f6';
    case 'scheduled': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'scheduled': return 'Scheduled';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Shared Tab: My Team ─────────────────────────────────────────────────────────────
export function MyTeamTab({ team, loading, onRefresh, readOnly = false }: { team: any[]; loading: boolean; onRefresh?: () => void; readOnly?: boolean }) {
  if (loading) return <LoadingState message="Loading team members..." />;
  if (!team.length) return <EmptyState message="No care companions found." icon={<Users className="w-12 h-12" />} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{team.length} Care Companion{team.length > 1 ? 's' : ''}</p>
        {!readOnly && onRefresh && (
          <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(cc => (
          <div key={cc.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
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
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.primaryBeneficiariesCount || 0}</p>
                <p className="text-xs text-muted-foreground">Primary</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.secondaryBeneficiariesCount || 0}</p>
                <p className="text-xs text-muted-foreground">Secondary</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">{cc.todayVisitCount || 0}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Tab: Beneficiaries ───────────────────────────────────────────────────────
export function BeneficiariesTab({ team, beneficiaries, loading, onRefresh, readOnly = false }: { team: any[]; beneficiaries: any[]; loading: boolean; onRefresh?: () => void; readOnly?: boolean }) {
  const [selected, setSelected] = useState<any | null>(null);
  const [pendingPrimary, setPendingPrimary] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    const payload: any = {};
    if (pendingPrimary !== undefined) payload.primaryCcId = pendingPrimary || null;
    
    setSaving(true);
    try {
      await fieldManagerApi.assignCC(selected.id, payload);
      toast.success('Assignment saved');
      setSelected(null);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading beneficiaries..." />;
  if (!beneficiaries.length) return <EmptyState message="No beneficiaries found." icon={<Users className="w-12 h-12" />} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        {beneficiaries.map(b => (
          <div
            key={b.id}
            onClick={() => setSelected(b)}
            className={`p-4 cursor-pointer border rounded-xl transition-all ${selected?.id === b.id ? 'border-orange-500 bg-orange-50/30' : 'border-border bg-card'}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{b.name}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{b.age}y • {b.city || 'Location N/A'}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        {!selected ? (
          <p className="text-sm text-center text-muted-foreground">Select a beneficiary to view details {readOnly ? '' : 'or manage assignment'}</p>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{selected.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Phone</p>
                <p className="font-medium">{selected.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Address</p>
                <p className="font-medium truncate">{selected.address || selected.city || 'N/A'}</p>
              </div>
            </div>
            
            {!readOnly && (
              <>
                <div className="pt-4 border-t border-border">
                  <label className="text-sm font-medium block mb-1">Primary CC</label>
                  <select 
                    className="w-full border rounded-lg p-2 text-sm bg-background"
                    value={pendingPrimary !== undefined ? (pendingPrimary || '') : (selected.primaryCcId || '')}
                    onChange={e => setPendingPrimary(e.target.value || null)}
                  >
                    <option value="">— Unassign —</option>
                    {team.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-orange-500 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 font-medium"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Assignment
                </button>
              </>
            )}
            
            {readOnly && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-tighter">Assigned Staff</p>
                <p className="text-sm font-medium">{selected.primaryCcName || 'No Primary CC assigned'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
