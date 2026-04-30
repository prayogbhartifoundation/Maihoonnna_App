import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { teamApi } from '../../services/api';
import { toast } from 'sonner';
import { Users, UserCheck, ShieldCheck, MapPin } from 'lucide-react';
import { EntityAvatar } from '../components/common/EntityAvatar';

export default function CreateTeamPage() {
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [selectedFM, setSelectedFM] = useState('');
  const [selectedCCs, setSelectedCCs] = useState<string[]>([]);
  
  const [availableFMs, setAvailableFMs] = useState<any[]>([]);
  const [availableCCs, setAvailableCCs] = useState<any[]>([]);
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter staff based on selected zone
  const filteredFMs = React.useMemo(() => {
    if (!zone) return availableFMs;
    return availableFMs.filter(fm => fm.zone === zone);
  }, [availableFMs, zone]);

  const filteredCCs = React.useMemo(() => {
    if (!zone) return availableCCs;
    return availableCCs.filter(cc => cc.zone === zone);
  }, [availableCCs, zone]);

  // Clear selections when zone changes to prevent cross-zone assignments
  useEffect(() => {
    setSelectedFM('');
    setSelectedCCs([]);
  }, [zone]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fms, ccs, zonesData] = await Promise.all([
        teamApi.getAvailableManagers(),
        teamApi.getAvailableCompanions(),
        teamApi.getZones()
      ]);
      setAvailableFMs(fms);
      setAvailableCCs(ccs);
      setAvailableZones(zonesData);
    } catch (err) {
      toast.error('Failed to load available staff');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !zone || selectedCCs.length === 0) {
      toast.error('Please fill name and zone, and select at least one Care Companion');
      return;
    }

    try {
      await teamApi.createTeam({
        name,
        fieldManagerId: selectedFM === 'none' || !selectedFM ? undefined : selectedFM,
        zone,
        careCompanionIds: selectedCCs
      });
      toast.success('Team created successfully');
      setName('');
      setZone('');
      setSelectedFM('');
      setSelectedCCs([]);
      loadData();
    } catch (err) {
      toast.error('Failed to create team');
    }
  };

  const toggleCCSelection = (ccId: string) => {
    setSelectedCCs(prev => 
      prev.includes(ccId) ? prev.filter(id => id !== ccId) : [...prev, ccId]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Team" 
        description="Form a new team by assigning a Field Manager and Care Companions"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-1 space-y-6 bg-white p-8 rounded-[32px] shadow-sm border border-[#E7DED6]">
          <h2 className="text-xl font-bold text-gray-800">Team Details</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
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
              <label className="text-[10px] font-black text-gray-400 uppercase">Target Zone</label>
              <Select onValueChange={setZone} value={zone}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose Zone" />
                </SelectTrigger>
                <SelectContent>
                  {availableZones.map(z => (
                    <SelectItem key={z.id} value={z.name}>
                      {z.name}
                    </SelectItem>
                  ))}
                  {availableZones.length === 0 && <SelectItem value="none" disabled>No available zones</SelectItem>}
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
                  {filteredFMs.length === 0 && zone && <SelectItem value="none" disabled>No FMs available in this zone</SelectItem>}
                  {filteredFMs.length === 0 && !zone && <SelectItem value="none" disabled>Select a zone first</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-white py-6 rounded-xl font-bold uppercase tracking-widest mt-4">
              Form Team
            </Button>
          </form>
        </div>

        {/* Selection Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Available Care Companions</h2>
            <span className="bg-[#F4EAE3] text-[#FF7A00] px-4 py-1 rounded-full text-xs font-bold">
              {selectedCCs.length} Selected
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 italic">Loading staff availability...</div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
