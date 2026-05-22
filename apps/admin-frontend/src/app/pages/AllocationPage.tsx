import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, MapPin, Search, Loader2, Filter,
  ArrowRight, CheckCircle2, AlertTriangle,
  ChevronRight, Info, UserCheck, ShieldCheck
} from 'lucide-react';
import { beneficiaryApi, fieldManagerApi } from '../../services/api';
import { toast } from 'sonner';
import { EntityAvatar } from '../components/common/EntityAvatar';
import { useAuth } from '../context/AuthContext';

interface AllocationBeneficiary {
  id: string;
  name: string;
  photo?: string;
  age: number;
  gender: string;
  address: string;
  city: string;
  pincode: string;
  distance: number | null;
  nearestZone: string | null;
  fieldManagerId?: string;
  fieldManager?: string;
  isActive: boolean;
}

interface FieldManagerItem {
  id: string;
  userId: string;
  name: string;
  zone: string;
  beneficiaryCount: number;
  maxCapacity: number;
}

const AllocationPage = () => {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState<AllocationBeneficiary[]>([]);
  const [fieldManagers, setFieldManagers] = useState<FieldManagerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unassigned'>('unassigned');
  const [sortBy, setSortBy] = useState<'distance' | 'createdAt'>('distance');
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch beneficiaries with distance sorting if user is OM/Admin
      const benResponse = await beneficiaryApi.getAllPaginated({
        search,
        page: 1,
        limit: 100, // Fetch more for allocation view
        sortBy,
        filterBy: filterBy === 'unassigned' ? 'unassigned' : 'all'
      } as any);

      const fmResponse = await fieldManagerApi.getAll();
      
      setBeneficiaries(benResponse.data || []);
      
      // Map FM data with basic capacity (mock capacity for now, in real it would come from backend)
      const mappedFMs = fmResponse.map((fm: any) => ({
        id: fm.id,
        userId: fm.userId,
        name: fm.name,
        zone: fm.zone,
        beneficiaryCount: fm.beneficiaryCount || 0,
        maxCapacity: 20 // Default capacity
      }));
      
      setFieldManagers(mappedFMs);
    } catch (err) {
      console.error('Failed to load allocation data', err);
      toast.error('Failed to load beneficiaries and field managers');
    } finally {
      setLoading(false);
    }
  }, [search, filterBy, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (beneficiaryId: string, fmId: string) => {
    const targetFmId = fmId === '' || fmId === 'undefined' ? null : fmId;
    
    setSubmitting(beneficiaryId);
    console.log(`[Allocation] Assigning Ben: ${beneficiaryId} to FM: ${targetFmId}`);
    try {
      await beneficiaryApi.assignStaff(beneficiaryId, { fieldManagerId: targetFmId });
      toast.success('Field Manager assigned successfully');
      fetchData(); // Refresh to update counts and list
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign Field Manager');
    } finally {
      setSubmitting(null);
    }
  };

  const getDistanceColor = (dist: number | null) => {
    if (dist === null) return 'text-gray-400 bg-gray-50';
    if (dist < 5) return 'text-green-600 bg-green-50 border-green-100';
    if (dist < 15) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Beneficiary Allocation Portal</h1>
          <p className="text-gray-600">Assign beneficiaries to Field Manager teams based on geo-proximity</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-white rounded-xl p-1 shadow-sm border border-[#E7DED6]">
              <button 
                onClick={() => setFilterBy('unassigned')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filterBy === 'unassigned' ? 'bg-[#FF7A00] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Unassigned
              </button>
              <button 
                onClick={() => setFilterBy('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filterBy === 'all' ? 'bg-[#FF7A00] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                All
              </button>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF7A00] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, city or pincode..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00] shadow-sm transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-6 py-4 rounded-2xl bg-white border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00] shadow-sm font-bold text-gray-600 text-sm h-full"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="distance">Sort by Distance</option>
          <option value="createdAt">Sort by Newest</option>
        </select>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#FF7A00] mb-4" size={40} />
            <p className="text-gray-500 font-medium">Calculating proximity and loading data...</p>
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-[#E7DED6]">
            <div className="w-20 h-20 bg-[#F4EAE3] rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck size={32} className="text-[#FF7A00]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No Beneficiaries to Allocate</h3>
            <p className="text-gray-500 mt-2">All beneficiaries in your managed zones are currently assigned.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {beneficiaries.map((ben) => (
              <div key={ben.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-[#E7DED6] hover:shadow-md transition-all group">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  {/* Left: Basic Info */}
                  <div className="flex gap-4 items-center flex-1 min-w-[250px]">
                    <EntityAvatar name={ben.name} photoUrl={ben.photo} type="beneficiary" className="w-16 h-16 text-2xl" />
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{ben.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {ben.address}, {ben.pincode}
                      </p>
                      <div className="flex gap-2 mt-2">
                         <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                           {ben.age} yrs • {ben.gender}
                         </span>
                         {ben.nearestZone && (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[10px] font-black uppercase text-blue-600 border border-blue-100">
                              Zone: {ben.nearestZone}
                            </span>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Distance Metric */}
                  <div className="flex flex-col items-center justify-center px-8 border-x border-[#E7DED6] min-w-[150px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Distance to Zone</p>
                    <div className={`px-4 py-2 rounded-xl border font-black text-lg ${getDistanceColor(ben.distance)}`}>
                      {ben.distance !== null ? `${ben.distance} km` : 'N/A'}
                    </div>
                    {ben.distance !== null && ben.distance > 15 && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> Remote Area
                      </p>
                    )}
                  </div>

                  {/* Right: Assignment Action */}
                  <div className="flex-1 w-full lg:w-auto">
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Assign Field Manager</label>
                    <div className="flex gap-3">
                      <select 
                        className="flex-1 px-4 py-3 rounded-xl bg-[#F4EAE3]/30 border border-[#E7DED6] focus:outline-none focus:border-[#FF7A00] font-bold text-gray-700 text-sm"
                        defaultValue={ben.fieldManagerId || ''}
                        onChange={(e) => handleAssign(ben.id, e.target.value)}
                        disabled={submitting === ben.id}
                      >
                        <option value="">— Select Field Manager —</option>
                        {fieldManagers.map(fm => (
                          <option key={fm.id} value={fm.userId}>
                            {fm.name} ({fm.beneficiaryCount}/{fm.maxCapacity}) — {fm.zone}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-[#FF7A00] hover:bg-[#FFF5EE] transition-colors border border-[#E7DED6]"
                        title="View Profile"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    
                    {/* FM Suggestions or Load Warnings */}
                    <div className="mt-2 flex items-center gap-2">
                       {ben.distance !== null && ben.distance < 5 && (
                         <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <CheckCircle2 size={12} /> High Priority Location
                         </div>
                       )}
                       {ben.fieldManagerId && (
                         <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <Info size={12} /> Currently assigned to {ben.fieldManager}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                
                {/* Overlay for submitting */}
                {submitting === ben.id && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[24px] z-10">
                     <Loader2 className="animate-spin text-[#FF7A00]" size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationPage;
