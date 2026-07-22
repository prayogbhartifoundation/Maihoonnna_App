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
} from 'lucide-react';
import { emergencyApi } from '../../services/api';

interface EmergencyNote {
  timestamp: string;
  note: string;
  author?: string;
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
  const [resolving, setResolving] = useState<boolean>(false);

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
    const ticket = r.ticketNumber.toLowerCase();
    return bName.includes(searchLower) || bPhone.includes(searchLower) || subName.includes(searchLower) || ticket.includes(searchLower);
  });

  const activeCount = requests.filter((r) => r.status === 'open' || r.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header / Radar Title Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-900/40 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500">
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
                  <span className="bg-red-600/30 text-red-400 border border-red-500/50 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {activeCount} Active SOS Alerts
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-semibold">
                    System Normal
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-1">Real-time emergency monitoring, subscriber alerts & live dispatch radar</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
              {autoRefresh ? 'Live Polling ON (5s)' : 'Live Polling PAUSED'}
            </button>
            <button
              onClick={fetchRequests}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors"
              title="Manual Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
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

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search beneficiary, phone, ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-red-500 mb-3" />
          <p className="text-sm text-slate-400 font-medium">Scanning Emergency Radar...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <ShieldAlert size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No Emergency Alerts Found</h3>
          <p className="text-sm text-slate-400">No active SOS requests matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const b = req.beneficiary;
            const u = b?.user;
            const sub = b?.subscriber;
            const isOpen = req.status === 'open';
            const isInProgress = req.status === 'in_progress';

            const mapQuery = u?.latitude && u?.longitude
              ? `${u.latitude},${u.longitude}`
              : encodeURIComponent(req.locationAddress || 'India');

            return (
              <div
                key={req.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'bg-slate-950/90 border-red-600/80 shadow-2xl shadow-red-950/40 ring-1 ring-red-500/30'
                    : isInProgress
                    ? 'bg-slate-900/90 border-amber-500/50 shadow-xl'
                    : 'bg-slate-900/50 border-slate-800 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Emergency Card Top Bar */}
                <div className={`p-4 rounded-t-2xl flex items-center justify-between border-b ${
                  isOpen ? 'bg-red-950/40 border-red-900/40' : 'bg-slate-800/40 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-red-400 bg-red-950 border border-red-800/60 px-2.5 py-1 rounded-lg">
                      {req.ticketNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Clock size={13} />
                      {getTimeAgo(req.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOpen && (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                        SOS OPEN
                      </span>
                    )}
                    {isInProgress && (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        DISPATCH IN PROGRESS
                      </span>
                    )}
                    {req.status === 'resolved' && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle size={10} /> RESOLVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4">
                  {/* Beneficiary Header Row */}
                  <div className="flex items-start gap-4">
                    <img
                      src={u?.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120'}
                      alt={b?.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 bg-slate-800"
                    />
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {b?.name || 'Unknown Beneficiary'}
                        {b?.age && <span className="text-xs text-slate-400 font-normal">({b.age} yrs)</span>}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone size={12} className="text-slate-500" />
                        <a href={`tel:${u?.phone}`} className="hover:text-red-400 transition-colors">{u?.phone || 'No phone'}</a>
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold border border-slate-700 rounded-xl transition-colors"
                    >
                      <MapPin size={13} />
                      Maps
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {/* Location Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                    <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Address</p>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-relaxed">{req.locationAddress || 'Address not listed'}</p>
                    </div>
                  </div>

                  {/* Stakeholders Info Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-800/30 border border-slate-800/60 rounded-xl p-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <User size={11} /> Subscriber (Family)
                      </p>
                      <p className="text-xs font-bold text-slate-200">{sub?.name || 'N/A'}</p>
                      {sub?.phone && (
                        <a href={`tel:${sub.phone}`} className="text-xs text-red-400 hover:underline font-medium flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {sub.phone}
                        </a>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Users size={11} /> Care Companions
                      </p>
                      <p className="text-xs font-medium text-slate-300">
                        Primary: <span className="font-bold text-slate-200">{b?.primaryCC?.user?.name || 'Unassigned'}</span>
                      </p>
                      {b?.primaryCC?.user?.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone size={10} /> {b.primaryCC.user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes / Timeline Log */}
                  {Array.isArray(req.notes) && req.notes.length > 0 && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={11} /> Dispatch Logs & Notes ({req.notes.length})
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {req.notes.map((n, idx) => (
                          <div key={idx} className="text-xs bg-slate-900 border border-slate-800/80 rounded-lg p-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-bold text-slate-300">{n.author || 'System Log'}</span>
                              <span>{getTimeAgo(n.timestamp)}</span>
                            </div>
                            <p className="text-slate-300 font-medium">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes if Resolved */}
                  {req.status === 'resolved' && req.resolutionNotes && (
                    <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Resolution Remarks</p>
                      <p className="text-xs text-emerald-200">{req.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex items-center gap-2">
                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                        className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldAlert size={14} />
                        Acknowledge & Dispatch Support
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => setResolvingRequest(req)}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        Mark SOS Resolved
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <FileText size={13} />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Operational Log Note</h3>
            <p className="text-xs text-slate-400 mb-4">Ticket: {selectedRequest.ticketNumber} • {selectedRequest.beneficiary?.name}</p>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                required
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type dispatch update, ambulance status, or contact report..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <Send size={13} />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-emerald-400 mb-1 flex items-center gap-2">
              <CheckCircle size={20} /> Mark Emergency Resolved
            </h3>
            <p className="text-xs text-slate-400 mb-4">Ticket: {resolvingRequest.ticketNumber} • {resolvingRequest.beneficiary?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Resolution Summary / Notes</label>
                <textarea
                  rows={3}
                  value={resolutionInput}
                  onChange={(e) => setResolutionInput(e.target.value)}
                  placeholder="e.g. Ambulance arrived on scene. Beneficiary stabilized and family notified."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingRequest(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(resolvingRequest.id, 'resolved', resolutionInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle size={13} />
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
