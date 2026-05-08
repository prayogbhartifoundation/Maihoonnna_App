import React, { useEffect, useState, useCallback } from 'react';
import { fieldManagerApi } from '../../../services/api';
import { toast } from 'sonner';
import {
  Users, Calendar, UserCheck, BarChart3, RefreshCw,
  ChevronRight, Clock, CheckCircle2,
  ActivitySquare, Phone, MapPin, Loader2, X
} from 'lucide-react';
import { 
  LoadingState, 
  EmptyState, 
  StatCard, 
  statusColor, 
  statusLabel, 
  formatTime, 
  todayStr 
} from './SharedComponents';

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

  return (
    <div className="space-y-4">
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
      </div>

      {loading ? <LoadingState message="Loading schedule..." /> : (
        <div className="space-y-3">
          {visits.length === 0 ? (
            <EmptyState message={`No visits scheduled.`} icon={<Calendar className="w-12 h-12" />} />
          ) : (
            visits.map(v => (
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { MyTeamTab, BeneficiariesTab } from './SharedComponents';

function FieldManagerBeneficiariesTab({ team }: { team: any[] }) {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return <BeneficiariesTab team={team} beneficiaries={beneficiaries} loading={loading} onRefresh={load} />;
}

const TABS = [
  { key: 'team', label: 'My Team', icon: Users },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'beneficiaries', label: 'Beneficiaries', icon: UserCheck },
  { key: 'usage', label: 'Benefit Usage', icon: BarChart3 },
] as const;

export default function FieldManagerView() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['key']>('team');
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fieldManagerApi.getMyTeam();
      setTeam(data);
    } catch (e: any) {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Team Size" value={team.length} icon={<Users className="w-4 h-4" />} color="orange" />
        <StatCard label="Available" value={team.filter(c => c.isAvailable).length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'team' && <MyTeamTab team={team} loading={loading} onRefresh={loadTeam} />}
        {activeTab === 'schedule' && <ScheduleTab team={team} />}
        {activeTab === 'beneficiaries' && <FieldManagerBeneficiariesTab team={team} />}
      </div>
    </div>
  );
}
