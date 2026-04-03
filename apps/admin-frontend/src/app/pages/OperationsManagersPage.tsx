import React, { useEffect, useState } from 'react';
import { Briefcase, MapPin, Phone, Plus, ShieldCheck, Users, Loader2, Edit2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { operationsManagerApi } from '../../services/api';
import StaffEditModal from '../components/StaffEditModal';
import DataFilter from '../components/common/DataFilter';
import DeactivationSummaryModal from '../components/DeactivationSummaryModal';
import { staffOnboardingApi } from '../../services/api';
import { Trash2 } from 'lucide-react';

interface OperationsManagerItem {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  qualification?: string | null;
  experience?: number | null;
  isAvailable: boolean;
  assignedZones: Array<{
    id: string;
    name: string;
    city: string;
    pincode: string;
  }>;
  bgvVerified: boolean;
  kycVerified: boolean;
}

export default function OperationsManagersPage() {
  const navigate = useNavigate();
  const [managers, setManagers] = useState<OperationsManagerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deactivationSummary, setDeactivationSummary] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await operationsManagerApi.getAllPaginated({ search, page, limit });
      const mapped = (response.data || []).map((om: any) => ({
        ...om,
        bgvVerified: om.bgvVerified || false,
        kycVerified: om.kycVerified || false,
      }));
      setManagers(mapped);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load operations managers');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  const handleDeactivate = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}? This will mark their profile as inactive.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await staffOnboardingApi.deactivateStaff(userId);
      setDeactivationSummary(response);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate staff member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Operations Managers</h1>
          <p className="text-gray-600">Manage the operations leaders responsible for zone ownership and onboarding oversight.</p>
        </div>
        <button
          onClick={() => navigate('/staff-onboarding?role=operations_manager')}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Onboard Operations Manager
        </button>
      </div>

      <div className="mb-6">
        <DataFilter 
          onFilterChange={(state) => {
            setSearch(state.search);
            setPage(1);
          }} 
        />
      </div>

      {/* Results Area */}
      <div className="relative min-h-[400px]">
        {loading && managers.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground flex-col gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="font-bold text-sm uppercase tracking-widest text-[#1D4ED8]">Loading Managers...</p>
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#E7DED6]">
            <div className="w-20 h-20 bg-[#E8F0FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-[#1D4ED8]" />
            </div>
            <h3 className="text-lg font-bold text-gray-600 mb-2">No Operations Managers Found</h3>
            <p className="text-gray-400 mb-6">Start by onboarding your first operations manager or adjust filters.</p>
            <button
              onClick={() => navigate('/staff-onboarding?role=operations_manager')}
              className="bg-[#1D4ED8] text-white px-6 py-3 rounded-xl font-bold"
            >
              Onboard First OM
            </button>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {managers.map((manager) => (
                <div key={manager.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E7DED6] hover:shadow-md transition-shadow">
                  <div className="flex justify-between mb-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#1D4ED8] flex items-center justify-center font-bold text-white text-xl">
                        {manager.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{manager.name}</h3>
                        <p className="text-xs text-gray-400 uppercase font-bold">Operations Manager</p>
                      </div>
                    </div>
                    <span className={`h-fit px-3 py-1 rounded-full text-[10px] font-black uppercase ${manager.isAvailable ? 'bg-[#E8F0FF] text-[#1D4ED8]' : 'bg-gray-100 text-gray-400'}`}>
                      {manager.isAvailable ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {manager.phone && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone size={14} className="text-[#1D4ED8]" /> {manager.phone}
                      </div>
                    )}
                    {manager.qualification && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Briefcase size={14} className="text-[#1D4ED8]" /> {manager.qualification}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Users size={14} className="text-[#1D4ED8]" />
                      {manager.assignedZones.length} zone{manager.assignedZones.length !== 1 ? 's' : ''} assigned
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E7DED6]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Managed Zones</p>
                    <div className="flex flex-wrap gap-2">
                      {manager.assignedZones.length > 0 ? (
                        manager.assignedZones.map((zone) => (
                          <span
                            key={zone.id}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EEF3FF] text-[#1D4ED8] text-xs font-bold"
                          >
                            <MapPin size={12} />
                            {zone.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No zones assigned yet.</span>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#E7DED6] mt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {manager.bgvVerified && (
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck size={12} /> BGV
                          </div>
                        )}
                        {manager.kycVerified && (
                          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={12} /> KYC
                          </div>
                        )}
                        {!manager.bgvVerified && !manager.kycVerified && (
                          <div className="flex items-center gap-1 bg-gray-50 text-gray-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck size={12} /> Verification Pending
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          <Plus size={12} /> MANAGER
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setEditingUserId(manager.userId)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FFF0E0] text-[#FF7A00] hover:bg-[#FFE0C0] transition text-[10px] font-black uppercase tracking-wider shadow-sm border border-[#FFE0C0]"
                        >
                          <Edit2 size={12} /> Edit Profile
                        </button>
                        <button
                          onClick={() => handleDeactivate(manager.userId, manager.name)}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition text-[10px] font-black uppercase tracking-wider shadow-sm border border-red-100"
                        >
                          <Trash2 size={12} /> Deactivate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {loading && managers.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] z-10 rounded-[32px]">
                <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-[#E7DED6] flex items-center gap-3 text-sm font-bold text-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> 
                  <span>Syncing managers...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center bg-white border border-[#E7DED6] rounded-[24px] px-6 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">
            Showing <span className="text-[#1D4ED8]">{(page - 1) * limit + 1}</span> to <span className="text-[#1D4ED8]">{Math.min(page * limit, total)}</span> of <span className="text-[#1D4ED8]">{total}</span> managers
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

      {editingUserId && (
        <StaffEditModal
          userId={editingUserId}
          role="operations_manager"
          onClose={() => setEditingUserId(null)}
          onSuccess={loadData}
        />
      )}
      {/* DEACTIVATION SUMMARY MODAL */}
      {deactivationSummary && (
        <DeactivationSummaryModal 
          data={deactivationSummary} 
          onClose={() => setDeactivationSummary(null)} 
        />
      )}
    </div>
  );
}
