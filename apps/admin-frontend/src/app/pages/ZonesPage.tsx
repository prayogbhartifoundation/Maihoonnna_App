import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, X, Building2, Power, PowerOff,
  Phone, Calendar, Edit2, Trash2, Loader2,
  Navigation, AlertTriangle, Users, UserCheck, ChevronRight
} from 'lucide-react';
import { usePincodeLookup } from '../hooks/usePincodeLookup';
import DataFilter from '../components/common/DataFilter';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Zone {
  id: string;
  name: string;
  city: string;
  address: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
   isActive: boolean;
   fieldManagerId: string | null;
   operationsManagerId: string | null;
   createdAt: string;
   updatedAt: string;
 }

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  phone: string;
}

const emptyForm = {
  name: '', city: '', address: '', state: '', pincode: '',
  phone: '', latitude: '', longitude: '',
  leaseStartDate: '', leaseEndDate: '',
  fieldManagerId: ''
};

const ZonesPage = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [fieldManagers, setFieldManagers] = useState<StaffMember[]>([]);
  const [operationsManagers, setOperationsManagers] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [assigningZone, setAssigningZone] = useState<Zone | null>(null);
  const [assignType, setAssignType] = useState<'fm' | 'om'>('om');
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showLookupResults, setShowLookupResults] = useState(false);
  const { loading: lookupLoading, error: lookupError, results: lookupResults, lookup: runLookup, reset: resetLookup } = usePincodeLookup();

  // ─── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: limit.toString()
      });

      const [zonesRes, fmsRes, omsRes] = await Promise.all([
        fetch(`${API_BASE}/zones?${params.toString()}`),
        fetch(`${API_BASE}/users/field-managers`),
        fetch(`${API_BASE}/users/operations-managers`)
      ]);

      const zonesJson = await zonesRes.json();
      const fmsJson = await fmsRes.json();
      const omsJson = await omsRes.json();

      if (zonesJson.success) {
        setZones(zonesJson.data);
        setTotal(zonesJson.total || 0);
        setTotalPages(zonesJson.totalPages || 1);
      }
      if (fmsJson.success) setFieldManagers(fmsJson.data);
      if (omsJson.success) setOperationsManagers(omsJson.data);

      if (!zonesJson.success) throw new Error(zonesJson.message);
    } catch (err: any) {
      setError(err.message || 'Failed to load data. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Open modal ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingZone(null);
    setForm({ ...emptyForm });
    setShowLookupResults(false);
    resetLookup();
    setShowModal(true);
  };

  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      city: zone.city,
      address: zone.address,
      state: zone.state,
      pincode: zone.pincode,
      phone: zone.phone || '',
      latitude: zone.latitude?.toString() || '',
      longitude: zone.longitude?.toString() || '',
      leaseStartDate: zone.leaseStartDate ? zone.leaseStartDate.slice(0, 10) : '',
      leaseEndDate: zone.leaseEndDate ? zone.leaseEndDate.slice(0, 10) : '',
      fieldManagerId: zone.fieldManagerId || ''
    });
    setShowLookupResults(false);
    resetLookup();
    setShowModal(true);
  };

  const openAssignModal = (zone: Zone, type: 'fm' | 'om' = 'om') => {
    setAssigningZone(zone);
    setAssignType(type);
    setShowAssignModal(true);
  };

  // ─── Save (create or update) ─────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ─── Validations ─────────────────────────────────────────────────────────
    if (form.phone && form.phone.length !== 10) {
      alert("Phone number must be exactly 10 digits");
      return;
    }
    if (form.pincode && form.pincode.length !== 6) {
      alert("Pincode must be exactly 6 digits");
      return;
    }

    if (form.leaseEndDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.leaseEndDate) < today) {
        alert("Lease Expiry Date cannot be in the past");
        return;
      }
    }

    if (form.leaseStartDate && form.leaseEndDate) {
      if (new Date(form.leaseEndDate) < new Date(form.leaseStartDate)) {
        alert("Lease Expiry Date cannot be before the Lease Start Date");
        return;
      }
    }

    if (form.latitude) {
      const lat = parseFloat(form.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        alert("Latitude must be a valid number between -90 and 90");
        return;
      }
    }

    if (form.longitude) {
      const lon = parseFloat(form.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        alert("Longitude must be a valid number between -180 and 180");
        return;
      }
    }

    setSaving(true);
    try {
      const url = editingZone
        ? `${API_BASE}/zones/${editingZone.id}`
        : `${API_BASE}/zones`;
      const method = editingZone ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      await fetchData();
      setShowModal(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── Assign Staff (FM or OM) ────────────────────────────────────────────────
  const handleAssignStaff = async (staffId: string) => {
    if (!assigningZone) return;
    setSaving(true);
    try {
      const payload = assignType === 'om' 
        ? { operationsManagerId: staffId === 'none' ? null : staffId }
        : { fieldManagerId: staffId === 'none' ? null : staffId };

      const res = await fetch(`${API_BASE}/zones/${assigningZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setZones(prev => prev.map(z => z.id === assigningZone.id ? json.data : z));
      setShowAssignModal(false);
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── Toggle active ───────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/zones/${id}/toggle`, { method: 'PATCH' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setZones(prev => prev.map(z => z.id === id ? json.data : z));
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/zones/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setZones(prev => prev.filter(z => z.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  const isLeaseExpiringSoon = (end: string | null) => {
    if (!end) return false;
    const diff = new Date(end).getTime() - Date.now();
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000; // 60 days
  };

  const isLeaseExpired = (end: string | null) => {
    if (!end) return false;
    return new Date(end).getTime() < Date.now();
  };

  return (
    <div className="p-8 bg-[#F4EAE3] min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Zones Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage nodal centers — {zones.length} zone{zones.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-[#e06e00] transition"
        >
          <Plus size={20} /> Add Zone
        </button>
      </div>

      <div className="mb-6">
        <DataFilter 
          onFilterChange={(state) => {
            setSearch(state.search);
            setPage(1); // reset to page 1 on search
          }} 
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3 text-red-700">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Results Area */}
      <div className="relative min-h-[400px]">
        {loading && zones.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground flex-col gap-4">
            <Loader2 className="animate-spin text-[#FF7A00]" size={36} />
            <p className="font-bold text-sm uppercase tracking-widest text-[#FF7A00]">Loading Zones...</p>
          </div>
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[32px] border border-dashed border-[#E7DED6]">
            <Building2 size={48} className="text-[#FF7A00] opacity-40 mb-4" />
            <h3 className="font-black text-gray-600 uppercase text-sm tracking-widest">No Zones Found</h3>
            <p className="text-gray-400 text-xs mt-2">Adjust your search or click "Add Zone" to register one.</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {zones.map(zone => (
                <div
                  key={zone.id}
                  className={`bg-white rounded-[24px] p-6 shadow-sm border transition-all ${zone.isActive ? 'border-[#E7DED6]' : 'opacity-60 grayscale border-gray-200'}`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-[#FF7A00]">{zone.name}</h3>
                      <p className="text-gray-500 font-semibold text-sm mt-0.5">{zone.city}, {zone.state} — {zone.pincode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => openAssignModal(zone, 'om')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition text-[10px] font-black uppercase"
                        >
                          <Users size={12} />
                          {zone.operationsManagerId ? 'Change OM' : 'Assign OM'}
                        </button>
                        <button
                          onClick={() => openAssignModal(zone, 'fm')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-[10px] font-black uppercase"
                        >
                          <UserCheck size={12} />
                          {zone.fieldManagerId ? 'Change FM' : 'Assign FM'}
                        </button>
                      </div>
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(zone.id)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase transition ${zone.isActive ? 'bg-[#DFF4E6] text-green-700 hover:bg-green-100' : 'bg-[#FFE3E3] text-red-700 hover:bg-red-100'}`}
                      >
                        {zone.isActive ? <Power size={12} /> : <PowerOff size={12} />}
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        disabled={deletingId === zone.id}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition"
                      >
                        {deletingId === zone.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-gray-600">
                      <MapPin size={14} className="text-[#FF7A00] mt-0.5 shrink-0" />
                      <span>{zone.address}</span>
                    </div>

                    {zone.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} className="text-[#FF7A00] shrink-0" />
                        <span>{zone.phone}</span>
                      </div>
                    )}

                    {(zone.latitude || zone.longitude) && (
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Navigation size={13} className="text-[#FF7A00] shrink-0" />
                        <span>{zone.latitude?.toFixed(5)}, {zone.longitude?.toFixed(5)}</span>
                      </div>
                    )}

                    {zone.operationsManagerId && (
                      <div className="flex items-center gap-2 text-[#FF7A00] font-black uppercase text-[10px] tracking-tight">
                        <Users size={14} className="shrink-0" />
                        <span>Ops Manager: {operationsManagers.find(m => m.userId === zone.operationsManagerId)?.name || 'Assigned'}</span>
                      </div>
                    )}

                    {zone.fieldManagerId && (
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-tight">
                        <UserCheck size={14} className="shrink-0" />
                        <span>Field Manager: {fieldManagers.find(m => m.userId === zone.fieldManagerId)?.name || 'Assigned'}</span>
                      </div>
                    )}
                  </div>

                  {/* Lease dates */}
                  {(zone.leaseStartDate || zone.leaseEndDate) && (
                    <div className="mt-4 pt-4 border-t border-[#E7DED6]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lease Period</p>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Start</p>
                          <p className="font-bold text-sm text-gray-700">{formatDate(zone.leaseStartDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">Expiry</p>
                          <p className={`font-bold text-sm ${isLeaseExpired(zone.leaseEndDate) ? 'text-red-600' : isLeaseExpiringSoon(zone.leaseEndDate) ? 'text-amber-600' : 'text-gray-700'}`}>
                            {formatDate(zone.leaseEndDate)}
                            {isLeaseExpired(zone.leaseEndDate) && ' ⚠ Expired'}
                            {isLeaseExpiringSoon(zone.leaseEndDate) && ' ⚠ Expiring Soon'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {loading && zones.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] z-10 rounded-[32px]">
                <div className="bg-white px-6 py-3 rounded-full shadow-lg border border-[#E7DED6] flex items-center gap-3 text-sm font-bold text-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF7A00]" /> 
                  <span>Updating zones...</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center bg-white border border-[#E7DED6] rounded-[24px] px-6 py-4 shadow-sm mb-8 mt-6">
          <p className="text-sm font-semibold text-gray-500">
            Showing <span className="text-[#FF7A00]">{(page - 1) * limit + 1}</span> to <span className="text-[#FF7A00]">{Math.min(page * limit, total)}</span> of <span className="text-[#FF7A00]">{total}</span> zones
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

      {/* MODAL: Create / Edit Zone */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-gray-800 uppercase">
                {editingZone ? 'Edit Zone' : 'Register New Zone'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Zone / Nodal Center Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                  placeholder="e.g. Delhi North Hub"
                />
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">City *</label>
                  <input
                    required
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                    placeholder="New Delhi"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">State *</label>
                  <input
                    required
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                    placeholder="Delhi"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Full Address *</label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00] resize-none"
                  placeholder="Street, locality, landmark..."
                />
              </div>

              {/* Pincode + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Pincode *</label>
                  <input
                    required
                    maxLength={6}
                    value={form.pincode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm(f => ({ ...f, pincode: val }));
                      if (val.length === 6) {
                        runLookup(val);
                        setShowLookupResults(true);
                      } else {
                        setShowLookupResults(false);
                        resetLookup();
                        if (val.length === 0) {
                          setForm(f => ({ ...f, city: '', state: '' }));
                        }
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                    placeholder="110001"
                  />
                  {lookupLoading && (
                    <div className="absolute right-3 top-9">
                      <Loader2 size={16} className="text-[#FF7A00] animate-spin" />
                    </div>
                  )}

                  {/* Pincode Lookup Results */}
                  {showLookupResults && (lookupResults.length > 0 || lookupError) && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-[#E7DED6] rounded-2xl shadow-xl overflow-hidden max-h-[200px] overflow-y-auto">
                      {lookupError && (
                        <div className="p-3 text-xs text-red-500 font-medium flex items-center gap-2">
                          <AlertTriangle size={14} />
                          {lookupError}
                        </div>
                      )}
                      
                      {lookupResults.length > 0 && (
                        <div>
                          <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                            Select Area ({lookupResults.length} found)
                          </p>
                          {lookupResults.map((po, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, city: po.District, state: po.State }));
                                setShowLookupResults(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 flex items-center justify-between group"
                            >
                              <div>
                                <p className="font-bold text-sm text-gray-800">{po.Name}</p>
                                <p className="text-[10px] text-gray-400 uppercase">{po.District}, {po.State}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF7A00] transition" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Phone Number</label>
                    <input
                      maxLength={10}
                      value={form.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm(f => ({ ...f, phone: val }));
                      }}
                      className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
              </div>

              {/* Geo Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Latitude</label>
                  <input
                    type="text"
                    value={form.latitude}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.-]/g, '');
                      // Only allow one decimal point and one minus sign
                      if ((val.match(/\./g) || []).length <= 1 && (val.match(/-/g) || []).length <= 1) {
                        setForm(f => ({ ...f, latitude: val }));
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                    placeholder="28.6139"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Longitude</label>
                  <input
                    type="text"
                    value={form.longitude}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.-]/g, '');
                      if ((val.match(/\./g) || []).length <= 1 && (val.match(/-/g) || []).length <= 1) {
                        setForm(f => ({ ...f, longitude: val }));
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                    placeholder="77.2090"
                  />
                </div>
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={form.leaseStartDate}
                    onChange={e => setForm(f => ({ ...f, leaseStartDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Lease Expiry Date</label>
                  <input
                    type="date"
                    value={form.leaseEndDate}
                    onChange={e => setForm(f => ({ ...f, leaseEndDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F4EAE3]/40 border border-[#E7DED6] font-semibold text-sm focus:outline-none focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#FF7A00] text-white py-4 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-orange-100 hover:bg-[#e06e00] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {editingZone ? 'Save Changes' : 'Register Zone'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Field Manager */}
      {showAssignModal && assigningZone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase">
                  Assign {assignType === 'om' ? 'Operations' : 'Field'} Manager
                </h2>
                <p className="text-xs text-gray-500 mt-1">Assigning staff to {assigningZone.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAssignType('om')}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition ${assignType === 'om' ? 'bg-[#FF7A00] text-white shadow-lg shadow-orange-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                Ops Manager
              </button>
              <button
                onClick={() => setAssignType('fm')}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition ${assignType === 'fm' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              >
                Field Manager
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAssignStaff('none')}
                className={`w-full text-left px-5 py-4 rounded-2xl border transition ${
                  (assignType === 'om' ? !assigningZone.operationsManagerId : !assigningZone.fieldManagerId) 
                    ? 'bg-red-50 border-red-200' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <p className="font-bold text-sm text-red-600">None / Unassign</p>
                <p className="text-[10px] text-red-400 uppercase">Remove current {assignType === 'om' ? 'OM' : 'FM'}</p>
              </button>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {(assignType === 'om' ? operationsManagers : fieldManagers).map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleAssignStaff(member.userId)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border transition ${
                      (assignType === 'om' ? assigningZone.operationsManagerId === member.userId : assigningZone.fieldManagerId === member.userId) 
                        ? (assignType === 'om' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200') 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{member.name}</p>
                        <p className="text-[10px] text-gray-400">{member.phone}</p>
                      </div>
                      <UserCheck size={18} className={(assignType === 'om' ? assigningZone.operationsManagerId === member.userId : assigningZone.fieldManagerId === member.userId) ? (assignType === 'om' ? 'text-orange-500' : 'text-blue-500') : 'text-gray-200'} />
                    </div>
                  </button>
                ))}

                {(assignType === 'om' ? operationsManagers : fieldManagers).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm italic">No {assignType === 'om' ? 'operations' : 'field'} managers found.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full mt-6 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesPage;