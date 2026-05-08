import React, { useEffect, useState, useCallback } from 'react';
import { fieldManagerApi, beneficiaryApi } from '../../../services/api';
import { toast } from 'sonner';
import {
  Users, UserCheck, LayoutDashboard,
  ChevronRight, CheckCircle2,
  MapPin, Loader2, Search
} from 'lucide-react';
import { 
  LoadingState, 
  EmptyState, 
  StatCard 
} from './SharedComponents';

export default function OpsManagerFieldView() {
  const [activeTab, setActiveTab] = useState<'fms' | 'allocation' | 'teams'>('fms');
  const [fieldManagers, setFieldManagers] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fms, bens] = await Promise.all([
        fieldManagerApi.getAll(),
        beneficiaryApi.getAll()
      ]);
      setFieldManagers(fms);
      setBeneficiaries(bens);
    } catch (e) {
      toast.error('Failed to load operational data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssignFM = async (benId: string, fmId: string) => {
    try {
      await beneficiaryApi.assignStaff(benId, { fieldManagerId: fmId });
      toast.success('Beneficiary assigned to Field Manager');
      loadData();
    } catch (e) {
      toast.error('Assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="My Field Managers" value={fieldManagers.length} icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="Active Beneficiaries" value={beneficiaries.length} icon={<UserCheck className="w-4 h-4" />} color="orange" />
        <StatCard label="Unassigned" value={beneficiaries.filter(b => !b.fieldManagerId).length} icon={<MapPin className="w-4 h-4" />} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('fms')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fms' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Users className="w-4 h-4" /> My Field Managers
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'allocation' ? 'border-orange-500 text-orange-600' : 'border-transparent text-muted-foreground'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Beneficiary Allocation
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? <LoadingState message="Synchronizing regional data..." /> : (
          <>
            {activeTab === 'fms' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="px-6 py-4">Field Manager</th>
                      <th className="px-6 py-4">Zone</th>
                      <th className="px-6 py-4">Team Size</th>
                      <th className="px-6 py-4">Beneficiaries</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fieldManagers.map(fm => (
                      <tr key={fm.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{fm.name}</td>
                        <td className="px-6 py-4">{fm.zone || 'N/A'}</td>
                        <td className="px-6 py-4">{fm.teamSize || 0} CCs</td>
                        <td className="px-6 py-4">{fm.beneficiaryCount || 0}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'allocation' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search beneficiary..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {beneficiaries
                    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
                    .map(ben => (
                      <div key={ben.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{ben.name}</p>
                          <p className="text-xs text-muted-foreground">{ben.address || ben.city}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            className="text-sm border rounded-lg px-2 py-1 bg-background"
                            value={ben.fieldManagerId || ''}
                            onChange={e => handleAssignFM(ben.id, e.target.value)}
                          >
                            <option value="">— Unassigned —</option>
                            {fieldManagers.map(fm => (
                              <option key={fm.id} value={fm.id}>{fm.name}</option>
                            ))}
                          </select>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
