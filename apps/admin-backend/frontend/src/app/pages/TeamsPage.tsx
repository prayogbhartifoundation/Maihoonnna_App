import React, { useState, useEffect, useCallback } from 'react';
import { Users, MapPin, Briefcase, Plus, Filter, Loader2 } from 'lucide-react';
import { teamApi } from '../../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const TeamsPage = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await teamApi.getTeams();
      setTeams(response || []);
    } catch (err: any) {
      console.error('Failed to load teams', err);
      toast.error('Failed to load teams dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
          <p className="text-gray-600">Overview of all active field teams, managers, and companions</p>
        </div>
        <button
          onClick={() => navigate('/create-team')}
          className="flex items-center gap-2 bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} /> Form New Team
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="animate-spin" size={24} />
            <span className="font-medium">Loading teams...</span>
          </div>
        </div>
      )}

      {!loading && teams.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-[#F4EAE3] rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-[#FF7A00]" />
          </div>
          <h3 className="text-lg font-bold text-gray-600 mb-2">No Teams Found</h3>
          <p className="text-gray-400 mb-6">You haven't formed any teams yet.</p>
          <button
            onClick={() => navigate('/create-team')}
            className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-bold inline-flex"
          >
            Form First Team
          </button>
        </div>
      )}

      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#E7DED6]">
              {/* Team Header */}
              <div className="bg-slate-50 border-b border-[#E7DED6] p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <MapPin size={14} className="text-[#FF7A00]" /> {team.zone}
                  </div>
                </div>
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#1F8A3E] border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-sm z-20" title={`FM: ${team.fieldManager?.name}`}>
                    {team.fieldManager?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {(team.careCompanions || []).slice(0, 3).map((cc: any, i: number) => (
                    <div key={cc.id} className="w-10 h-10 rounded-full bg-[#FF7A00] border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ zIndex: 10 - i }} title={`CC: ${cc.name}`}>
                      {cc.name?.charAt(0)?.toUpperCase()}
                    </div>
                  ))}
                  {(team.careCompanions || []).length > 3 && (
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm" style={{ zIndex: 5 }}>
                      +{(team.careCompanions || []).length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Roster */}
              <div className="p-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">Team Roster</h4>
                
                {/* Field Manager */}
                <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 bg-[#DFF4E6] text-[#1F8A3E] rounded-xl flex items-center justify-center">
                    <Briefcase size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{team.fieldManager?.name}</p>
                    <p className="text-xs font-bold text-green-700">FIELD MANAGER</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1F8A3E] bg-[#DFF4E6] px-2 py-1 rounded-full">Active</span>
                </div>

                {/* Care Companions */}
                <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-5">
                  {(team.careCompanions || []).map((cc: any) => (
                    <div key={cc.id} className="flex items-center gap-4 p-2 rounded-xl border border-transparent hover:bg-orange-50/50 hover:border-orange-100 transition-colors">
                      <div className="w-8 h-8 bg-orange-100 text-[#FF7A00] rounded-xl flex items-center justify-center">
                        <Users size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{cc.name}</p>
                        <p className="text-xs text-gray-500 font-medium">Care Companion</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                  ))}
                  {(!team.careCompanions || team.careCompanions.length === 0) && (
                    <p className="text-sm text-gray-400 py-2 italic">No Care Companions assigned yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
