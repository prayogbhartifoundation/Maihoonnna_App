import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  Phone,
  User,
  MapPin,
  Clock,
  CheckCircle,
  ShieldAlert,
  Send,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Users,
  FileText,
  Stethoscope,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  HeartPulse,
  Droplet,
  ChevronRight,
  Activity,
  Building2
} from 'lucide-react';
import { emergencyApi } from '../../services/api';
import { sanitizeImgSrc, sanitizeTelLink } from '../utils/sanitizeUrl';
import LocationPickerModal from '../components/common/LocationPickerModal';

interface EmergencyNote {
  timestamp: string;
  note: string;
  author?: string;
}

interface EmergencyContactItem {
  id?: string;
  name: string;
  phone: string;
  relationship?: string;
  isPrimary?: boolean;
}

interface EmergencyRequestItem {
  id: string;
  ticketNumber: string;
  beneficiaryId: string;
  requestedBy: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
  type?: string;
  description?: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationAddress?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  notes?: EmergencyNote[];
  beneficiary?: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    primaryPhysicianName?: string;
    primaryPhysicianPhone?: string;
    primaryPhysicianSpec?: string;
    emergencyContacts?: EmergencyContactItem[];
    fieldManager?: {
      name?: string;
      phone?: string;
    };
    user?: {
      phone?: string;
      profilePhoto?: string;
      location?: string;
      flatPlot?: string;
      streetArea?: string;
      landmark?: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
    };
    subscriber?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
    primaryCC?: {
      user?: { name: string; phone: string };
    };
    secondaryCC?: {
      user?: { name: string; phone: string };
    };
  };
}

export default function EmergencyRadarPage() {
  const [requests, setRequests] = useState<EmergencyRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Note Modal state
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequestItem | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Resolve Modal state
  const [resolvingRequest, setResolvingRequest] = useState<EmergencyRequestItem | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>('');

  // Map Modal state
  const [mapModalData, setMapModalData] = useState<{
    isOpen: boolean;
    lat?: number;
    lng?: number;
    address?: string;
  } | null>(null);

  const handleOpenMap = (req: EmergencyRequestItem) => {
    const b = req.beneficiary;
    const u = b?.user;
    const lat = req.locationLat ?? u?.latitude ?? undefined;
    const lng = req.locationLng ?? u?.longitude ?? undefined;

    const fullAddress =
      req.locationAddress ||
      u?.location ||
      [u?.flatPlot, u?.streetArea, u?.landmark, u?.city, u?.state, u?.pincode]
        .filter(Boolean)
        .join(', ') ||
      undefined;

    setMapModalData({
      isOpen: true,
      lat,
      lng,
      address: fullAddress,
    });
  };

  const fetchRequests = async () => {
    try {
      const data = await emergencyApi.getRequests(filterStatus !== 'ALL' ? filterStatus : undefined);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch emergency requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, filterStatus]);

  const handleUpdateStatus = async (id: string, newStatus: string, notes?: string) => {
    try {
      await emergencyApi.updateStatus(id, newStatus, notes);
      fetchRequests();
      if (resolvingRequest?.id === id) {
        setResolvingRequest(null);
        setResolutionInput('');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      await emergencyApi.addNote(selectedRequest.id, noteInput.trim(), 'ERC Dispatch Admin');
      setNoteInput('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(elapsedMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredRequests = requests.filter((r) => {
    const searchLower = searchQuery.toLowerCase();
    const bName = r.beneficiary?.name?.toLowerCase() || '';
    const bPhone = r.beneficiary?.user?.phone?.toLowerCase() || '';
    const subName = r.beneficiary?.subscriber?.name?.toLowerCase() || '';
    const subPhone = r.beneficiary?.subscriber?.phone?.toLowerCase() || '';
    const docName = r.beneficiary?.primaryPhysicianName?.toLowerCase() || '';
    const fmName = r.beneficiary?.fieldManager?.name?.toLowerCase() || '';
    const ticket = r.ticketNumber.toLowerCase();
    return (
      bName.includes(searchLower) ||
      bPhone.includes(searchLower) ||
      subName.includes(searchLower) ||
      subPhone.includes(searchLower) ||
      docName.includes(searchLower) ||
      fmName.includes(searchLower) ||
      ticket.includes(searchLower)
    );
  });

  const activeCount = requests.filter((r) => r.status === 'open' || r.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-900/50 rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/50 text-red-500 shadow-inner">
              <Radio size={32} className="animate-pulse" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-white">Emergency Response Radar</h1>
                {activeCount > 0 ? (
                  <span className="bg-red-600/30 text-red-400 border border-red-500/50 text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {activeCount} Active SOS {activeCount === 1 ? 'Alert' : 'Alerts'}
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold">
                    System Normal
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Live SOS emergency monitoring • Instant caregiver, physician & emergency contacts dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Live Polling (5s)' : 'Polling Paused'}
            </button>
            <button
              onClick={fetchRequests}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors shadow-md"
              title="Manual Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                {st === 'ALL' ? 'All Alerts' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search beneficiary, physician, FM, ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={36} className="animate-spin text-red-500 mb-3" />
          <p className="text-sm text-slate-400 font-medium">Scanning Emergency Radar...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
          <ShieldAlert size={52} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Emergency Alerts Found</h3>
          <p className="text-xs text-slate-400">No active SOS requests matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const b = req.beneficiary;
            const u = b?.user;
            const sub = b?.subscriber;
            const isOpen = req.status === 'open';
            const isInProgress = req.status === 'in_progress';

            const primaryEmergencyContact = Array.isArray(b?.emergencyContacts) && b.emergencyContacts.length > 0
              ? b.emergencyContacts.find((c) => c.isPrimary) || b.emergencyContacts[0]
              : null;

            const mapQuery = u?.latitude && u?.longitude
              ? `${u.latitude},${u.longitude}`
              : encodeURIComponent(req.locationAddress || u?.location || 'India');

            return (
              <div
                key={req.id}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xl ${
                  isOpen
                    ? 'bg-slate-900/95 border-red-600/80 shadow-red-950/40 ring-1 ring-red-500/40'
                    : isInProgress
                    ? 'bg-slate-900/95 border-amber-500/60 shadow-amber-950/20'
                    : 'bg-slate-900/60 border-slate-800 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Emergency Card Top Bar */}
                <div
                  className={`px-5 py-3.5 flex items-center justify-between border-b ${
                    isOpen ? 'bg-red-950/60 border-red-900/50' : 'bg-slate-800/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-red-400 bg-red-950 border border-red-800/70 px-3 py-1 rounded-xl shadow-inner">
                      {req.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                      <Clock size={13} className="text-slate-500" />
                      {getTimeAgo(req.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOpen && (
                      <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-md flex items-center gap-1">
                        <AlertTriangle size={11} /> SOS OPEN
                      </span>
                    )}
                    {isInProgress && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert size={11} /> DISPATCH IN PROGRESS
                      </span>
                    )}
                    {req.status === 'resolved' && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle size={11} /> RESOLVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {/* Beneficiary Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={sanitizeImgSrc(u?.profilePhoto, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120')}
                        alt={b?.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 bg-slate-800 shadow-md"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {b?.name || 'Unknown Beneficiary'}
                          </h3>
                          {b?.age && (
                            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-lg border border-slate-700">
                              {b.age} yrs
                            </span>
                          )}
                          {b?.bloodGroup && b.bloodGroup !== 'unknown' && (
                            <span className="text-xs bg-red-950/80 text-red-400 font-bold px-2 py-0.5 rounded-lg border border-red-800/60 uppercase flex items-center gap-0.5">
                              <Droplet size={10} fill="currentColor" /> {b.bloodGroup}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                          <Phone size={12} className="text-slate-500" />
                          Direct Phone:{' '}
                          <a
                            href={sanitizeTelLink(u?.phone)}
                            className="text-red-400 hover:text-red-300 font-bold hover:underline"
                          >
                            {u?.phone || 'Not registered'}
                          </a>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenMap(req)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold border border-slate-700 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      <MapPin size={14} />
                      Maps
                    </button>

                  </div>

                  {/* Location Address Banner */}
                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner">
                    <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          SOS Location Address
                        </p>
                        {req.locationLat && req.locationLng && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                            GPS Fix: {req.locationLat.toFixed(4)}, {req.locationLng.toFixed(4)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1 leading-relaxed">
                        {req.locationAddress || u?.location || 'Address not listed'}
                      </p>
                    </div>
                  </div>

                  {/* 6-Block Contact Details Grid */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-red-400" />
                      Emergency Care Network Contacts
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {/* 1. Subscriber (Family) */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <User size={11} /> Subscriber
                          </span>
                          <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-800/40 px-1.5 py-0.2 rounded font-semibold">
                            Family
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">{sub?.name || 'N/A'}</p>
                        {sub?.phone ? (
                          <a
                            href={sanitizeTelLink(sub.phone)}
                            className="text-[11px] text-red-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {sub.phone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No phone</p>
                        )}
                      </div>

                      {/* 2. Family Emergency Contact */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle size={11} /> Emergency Contact
                          </span>
                          {primaryEmergencyContact?.relationship && (
                            <span className="text-[9px] bg-red-950/60 text-red-400 border border-red-800/40 px-1.5 py-0.2 rounded font-semibold capitalize truncate max-w-[80px]">
                              {primaryEmergencyContact.relationship}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {primaryEmergencyContact?.name || 'Not Provided'}
                        </p>
                        {primaryEmergencyContact?.phone ? (
                          <a
                            href={sanitizeTelLink(primaryEmergencyContact.phone)}
                            className="text-[11px] text-red-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {primaryEmergencyContact.phone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No contact</p>
                        )}
                      </div>

                      {/* 3. Primary Physician */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <Stethoscope size={11} /> Primary Physician
                          </span>
                          {b?.primaryPhysicianSpec && (
                            <span className="text-[9px] bg-blue-950/60 text-blue-400 border border-blue-800/40 px-1.5 py-0.2 rounded font-semibold truncate max-w-[80px]">
                              {b.primaryPhysicianSpec}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {b?.primaryPhysicianName || 'Dr. Not Listed'}
                        </p>
                        {b?.primaryPhysicianPhone ? (
                          <a
                            href={sanitizeTelLink(b.primaryPhysicianPhone)}
                            className="text-[11px] text-blue-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {b.primaryPhysicianPhone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No phone</p>
                        )}
                      </div>

                      {/* 4. Field Manager */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={11} /> Field Manager
                          </span>
                          <span className="text-[9px] bg-purple-950/60 text-purple-400 border border-purple-800/40 px-1.5 py-0.2 rounded font-semibold">
                            Zone Lead
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {b?.fieldManager?.name || 'Unassigned'}
                        </p>
                        {b?.fieldManager?.phone ? (
                          <a
                            href={sanitizeTelLink(b.fieldManager.phone)}
                            className="text-[11px] text-purple-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {b.fieldManager.phone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No phone</p>
                        )}
                      </div>

                      {/* 5. Primary Care Companion */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <UserCheck size={11} /> Primary CC
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {b?.primaryCC?.user?.name || 'Unassigned'}
                        </p>
                        {b?.primaryCC?.user?.phone ? (
                          <a
                            href={sanitizeTelLink(b.primaryCC.user.phone)}
                            className="text-[11px] text-emerald-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {b.primaryCC.user.phone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No phone</p>
                        )}
                      </div>

                      {/* 6. Secondary Care Companion */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
                            <Users size={11} /> Secondary CC
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {b?.secondaryCC?.user?.name || 'Unassigned'}
                        </p>
                        {b?.secondaryCC?.user?.phone ? (
                          <a
                            href={sanitizeTelLink(b.secondaryCC.user.phone)}
                            className="text-[11px] text-teal-400 hover:underline font-semibold flex items-center gap-1 mt-1"
                          >
                            <PhoneCall size={10} /> {b.secondaryCC.user.phone}
                          </a>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">No phone</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Logs & Timeline */}
                  {Array.isArray(req.notes) && req.notes.length > 0 && (
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={12} className="text-slate-400" /> Dispatch Logs & Operational Notes (
                        {req.notes.length})
                      </p>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {req.notes.map((n, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-slate-900 border border-slate-800/90 rounded-xl p-2.5"
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-bold text-slate-300 flex items-center gap-1">
                                <ShieldAlert size={10} className="text-red-400" /> {n.author || 'System Log'}
                              </span>
                              <span>{getTimeAgo(n.timestamp)}</span>
                            </div>
                            <p className="text-slate-200 font-medium leading-relaxed">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes if Resolved */}
                  {req.status === 'resolved' && req.resolutionNotes && (
                    <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-3.5">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Resolution Remarks
                      </p>
                      <p className="text-xs text-emerald-200 font-medium leading-relaxed">{req.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex items-center gap-2.5">
                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                        className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldAlert size={15} />
                        Acknowledge & Dispatch Support
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setResolvingRequest(req)}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={15} />
                        Mark SOS Resolved
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <FileText size={14} />
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Note */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Operational Log Note</h3>
            <p className="text-xs text-slate-400 mb-4">
              Ticket: <span className="font-mono text-red-400 font-bold">{selectedRequest.ticketNumber}</span> •{' '}
              {selectedRequest.beneficiary?.name}
            </p>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                required
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type dispatch update, ambulance status, or contact report..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 shadow-inner"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  <Send size={14} />
                  {savingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Resolved */}
      {resolvingRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <CheckCircle size={20} /> Mark Emergency Resolved
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ticket: <span className="font-mono text-red-400 font-bold">{resolvingRequest.ticketNumber}</span> •{' '}
              {resolvingRequest.beneficiary?.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Resolution Summary / Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="e.g. Ambulance arrived on scene. Beneficiary stabilized and family notified."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingRequest(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(resolvingRequest.id, 'resolved', resolutionInput)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  <CheckCircle size={14} />
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Location Picker Modal */}
      {mapModalData?.isOpen && (
        <LocationPickerModal
          isOpen={mapModalData.isOpen}
          onClose={() => setMapModalData(null)}
          onSelectLocation={() => setMapModalData(null)}
          initialLat={mapModalData.lat}
          initialLng={mapModalData.lng}
          initialAddress={mapModalData.address}
        />
      )}
    </div>
  );
}
