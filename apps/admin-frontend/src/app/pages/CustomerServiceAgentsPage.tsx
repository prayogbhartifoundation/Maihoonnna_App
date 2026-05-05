import React, { useEffect, useState } from 'react';
import { Trash2,Briefcase,Phone, Plus, ShieldCheck, Loader2, Edit2, CheckCircle2, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { customerServiceAgentApi } from '../../services/api';
import StaffEditModal from '../components/StaffEditModal';
import DataFilter from '../components/common/DataFilter';
import { staffOnboardingApi } from '../../services/api';
import { EntityAvatar } from '../components/common/EntityAvatar';

interface CustomerServiceAgentItem {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  qualification?: string | null;
  experience?: number | null;
  isAvailable: boolean;
  bgvVerified: boolean;
  kycVerified: boolean;
}

export default function CustomerServiceAgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<CustomerServiceAgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerServiceAgentApi.getAllPaginated({ search, page, limit });
      const mapped = (response.data || []).map((csa: any) => ({
        ...csa,
        bgvVerified: csa.bgvVerified || false,
        kycVerified: csa.kycVerified || false,
      }));
      setAgents(mapped);
      setTotal(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load customer service agents');
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
      await staffOnboardingApi.deactivateStaff(userId);
      toast.success('Agent deactivated successfully');
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
          <h1 className="text-2xl font-bold text-gray-800">Customer Service Agents</h1>
          <p className="text-gray-600">Manage the support team responsible for handling queries and assisting customers.</p>
        </div>
        <button
          onClick={() => navigate('/staff-onboarding?role=customer_service')}
          className="flex items-center gap-2 bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#6D28D9] transition-colors"
        >
          <Plus size={20} /> Onboard CSA
        </button>
      </div>

      <DataFilter
        onFilterChange={(filters) => {
          setSearch(filters.search);
          setPage(1);
        }}
        searchPlaceholder="Search agents by name or phone..."
      />

      <div className="mt-6 bg-white rounded-3xl border border-[#E7DED6] overflow-hidden shadow-sm">
        {loading && agents.length === 0 ? (
          <div className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[#7C3AED]" size={40} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
              <Headphones size={32} />
            </div>
            <p className="text-gray-500 font-bold">No customer service agents found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or onboard a new agent.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-[#E7DED6]">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qualification</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED6]">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <EntityAvatar 
                          name={agent.name} 
                          type="customer_service"
                          className="w-10 h-10"
                        />
                        <div>
                          <p className="font-bold text-gray-800">{agent.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {agent.bgvVerified && (
                              <div className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase bg-green-50 px-1.5 py-0.5 rounded-md">
                                <ShieldCheck size={10} /> BGV
                              </div>
                            )}
                            {agent.kycVerified && (
                              <div className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-md">
                                <CheckCircle2 size={10} /> KYC
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                          <Phone size={14} className="text-gray-400" />
                          {agent.phone}
                        </div>
                        <p className="text-xs text-gray-400 ml-5">{agent.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-gray-700">{agent.qualification || 'N/A'}</p>
                        <p className="text-xs text-gray-400">{agent.experience || 0} years experience</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        agent.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {agent.isAvailable ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUserId(agent.userId)}
                          className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-[#7C3AED] transition-all hover:shadow-sm"
                          title="Edit Profile"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(agent.userId, agent.name)}
                          className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-red-500 transition-all hover:shadow-sm"
                          title="Deactivate"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-[#E7DED6]">
          <p className="text-xs font-bold text-gray-400">
            Showing <span className="text-gray-700">{(page - 1) * limit + 1}</span> to <span className="text-gray-700">{Math.min(page * limit, total)}</span> of <span className="text-gray-700">{total}</span> agents
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-[#E7DED6] rounded-xl text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-[#E7DED6] rounded-xl text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {editingUserId && (
        <StaffEditModal
          userId={editingUserId}
          role="customer_service"
          onClose={() => setEditingUserId(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
