import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { teamApi, regionApi } from '../../services/api';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router';
import { Users, UserCheck, ShieldCheck, MapPin, Loader2 } from 'lucide-react';
import { EntityAvatar } from '../components/common/EntityAvatar';

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [zone, setZone] = useState('');
  const [selectedFM, setSelectedFM] = useState('');
  const [selectedCCs, setSelectedCCs] = useState<string[]>([]);
  
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);
  const [availableFMs, setAvailableFMs] = useState<any[]>([]);
  const [availableCCs, setAvailableCCs] = useState<any[]>([]);
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter zones based on selected region
  const filteredZones = React.useMemo(() => {
    if (!selectedRegion) return [];
    return availableZones.filter(z => z.regionId === selectedRegion);
  }, [availableZones, selectedRegion]);

  // Filter staff based on selected zone
  const filteredFMs = React.useMemo(() => {
    if (!zone) return availableFMs;
    const selectedZoneObj = availableZones.find(z => z.id === zone);
    if (!selectedZoneObj) return [];
    return availableFMs.filter(fm => fm.zone?.trim().toLowerCase() === selectedZoneObj.name?.trim().toLowerCase());
  }, [availableFMs, zone, availableZones]);

  const filteredCCs = React.useMemo(() => {
    if (!zone) return availableCCs;
    const selectedZoneObj = availableZones.find(z => z.id === zone);
    if (!selectedZoneObj) return [];
    return availableCCs.filter(cc => cc.zone?.trim().toLowerCase() === selectedZoneObj.name?.trim().toLowerCase());
  }, [availableCCs, zone, availableZones]);

  // Clear zone selection when selectedRegion changes, unless it matches the loaded zone
  useEffect(() => {
    if (zone && availableZones.length > 0) {
      const zoneObj = availableZones.find(z => z.id === zone);
      if (zoneObj && zoneObj.regionId && zoneObj.regionId !== selectedRegion) {
        setZone('');
      }
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (id) {
      loadInitialData();
    }
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch everything in parallel
      const [teamData, fms, zonesData, regionsData] = await Promise.all([
        teamApi.getTeamById(id!),
        teamApi.getAvailableManagers(),
        teamApi.getZones(),
        regionApi.getAll()
      ]);

      // Set basic team info
      setName(teamData.name);
      
      // Legacy resolution: fallback to finding by name if zoneId is not present
      let initialZone = teamData.zoneId;
      if (!initialZone && teamData.zone && zonesData) {
        const found = zonesData.find((z: any) => z.name === teamData.zone);
        if (found) {
          initialZone = found.id;
        }
      }
      setZone(initialZone || '');

      // Resolve initial region selection
      if (initialZone) {
        const zoneObj = zonesData.find((z: any) => z.id === initialZone);
        if (zoneObj && zoneObj.regionId) {
          setSelectedRegion(zoneObj.regionId);
        }
      }

      setSelectedFM(teamData.fieldManagerId || 'none');
      setSelectedCCs(teamData.careCompanions.map((cc: any) => cc.id));

      // Merge current field manager into list if not already there
      let fmsList = [...fms];
      if (teamData.fieldManager) {
        const fmExists = fmsList.some(fm => fm.id === teamData.fieldManager.id);
        if (!fmExists) {
          fmsList.push(teamData.fieldManager);
        }
      }
      setAvailableFMs(fmsList);
      setAvailableZones(zonesData);
      setAvailableRegions(regionsData);

      // Now fetch companions, including those already in this team
      const ccs = await teamApi.getAvailableCompanions(id);
      setAvailableCCs(ccs);

    } catch (err) {
      toast.error('Failed to load team data');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Please enter a team name');
      return;
    }
    if (!zone) {
      toast.error('Please select a target zone');
      return;
    }
    if (selectedCCs.length === 0) {
      toast.error('Please select at least one Care Companion for the team');
      return;
    }

    try {
      setSaving(true);
      const selectedZoneObj = availableZones.find(z => z.id === zone);
      await teamApi.updateTeam(id!, {
        name,
        fieldManagerId: selectedFM === 'none' || !selectedFM ? null : selectedFM,
        zone: selectedZoneObj?.name || '',
        zoneId: zone,
        careCompanionIds: selectedCCs
      });
      toast.success('Team updated successfully');
      navigate('/teams');
    } catch (err) {
      toast.error('Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  const toggleCCSelection = (ccId: string) => {
    setSelectedCCs(prev => 
      prev.includes(ccId) ? prev.filter(id => id !== ccId) : [...prev, ccId]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="animate-spin text-[#FF7A00] mb-4" size={48} />
        <h3 className="font-bold text-gray-600 uppercase text-sm tracking-widest">Loading Team Details...</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Edit Team" 
        description={`Update details and roster for ${name}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-1 space-y-6 bg-white p-8 rounded-[32px] shadow-sm border border-[#E7DED6]">
          <h2 className="text-xl font-bold text-gray-800">Team Details</h2>
          <form onSubmit={handleUpdateTeam} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase">Team Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. South Delhi Alpha"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase">Region / City Sector</label>
              <Select onValueChange={setSelectedRegion} value={selectedRegion}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Region" />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                  {availableRegions.length === 0 && <SelectItem value="none" disabled>No regions available</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase">Target Zone</label>
              <Select 
                onValueChange={setZone} 
                value={zone}
                disabled={!selectedRegion}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={selectedRegion ? "Choose Zone" : "Select Region First"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredZones.map(z => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase">Select Field Manager (Optional)</label>
              <Select onValueChange={setSelectedFM} value={selectedFM}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose FM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Field Manager Assigned</SelectItem>
                  {filteredFMs.map(fm => (
                    <SelectItem key={fm.id} value={fm.id}>
                      {fm.user.name} ({fm.zone})
                    </SelectItem>
                  ))}
                  {filteredFMs.length === 0 && selectedFM !== 'none' && (
                    <SelectItem value={selectedFM} disabled>Current Manager (Unavailable)</SelectItem>
                  )}
                  {filteredFMs.length === 0 && zone && (
                    <SelectItem value="none" disabled>No FMs available in this zone</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/teams')}
                className="flex-1 py-6 rounded-xl font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-[#FF7A00] hover:bg-[#E66E00] text-white py-6 rounded-xl font-bold uppercase tracking-widest"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Selection Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Care Companion Roster</h2>
            <span className="bg-[#F4EAE3] text-[#FF7A00] px-4 py-1 rounded-full text-xs font-bold">
              {selectedCCs.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCCs.map(cc => (
              <div 
                key={cc.id}
                onClick={() => toggleCCSelection(cc.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedCCs.includes(cc.id) 
                    ? 'border-[#FF7A00] bg-[#FFF5EE]' 
                    : 'border-[#E7DED6] bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <EntityAvatar 
                    name={cc.name} 
                    photoUrl={cc.photo} 
                    type="care_companion" 
                    className="w-12 h-12 text-lg" 
                  />
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{cc.name}</h3>
                    <p className="text-xs text-gray-400">{cc.zone}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {cc.specialization.slice(0, 2).map((s: string) => (
                    <span key={s} className="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-[#E7DED6] uppercase text-gray-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {filteredCCs.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                {zone ? `No available Care Companions found in ${zone}.` : 'Select a Target Zone to see available Care Companions.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
