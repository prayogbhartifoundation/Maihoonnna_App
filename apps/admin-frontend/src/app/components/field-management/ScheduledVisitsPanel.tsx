import React, { useEffect, useState, useCallback } from 'react';
import { CalendarClock, User, UserCheck, AlertCircle, RefreshCw, Trash2, Edit3, ChevronDown, X, Clock, Loader2 } from 'lucide-react';
import { visitApi, fieldManagerApi } from '../../../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ScheduledVisitsPanelProps {
  /** Optional: pre-select a FM by their userId when rendered inside an FM-scoped view */
  defaultFmUserId?: string | null;
  /** If true, hide the FM selector (e.g. FieldManagerView already has context) */
  hideFmSelector?: boolean;
}

interface FMOption {
  id: string;       // FM profile ID
  userId: string;   // User ID used for filtering
  name: string;
}

interface CCOption {
  id: string;
  name: string;
}

export default function ScheduledVisitsPanel({ defaultFmUserId, hideFmSelector }: ScheduledVisitsPanelProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [fieldManagers, setFieldManagers] = useState<FMOption[]>([]);
  const [fmLoading, setFmLoading] = useState(false);
  const [selectedFmUserId, setSelectedFmUserId] = useState<string>(defaultFmUserId || '');

  const [ccOptions, setCcOptions] = useState<CCOption[]>([]);
  const [ccLoading, setCcLoading] = useState(false);
  const [selectedCcId, setSelectedCcId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // ── Edit modal state ────────────────────────────────────────────────────────
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editCcId, setEditCcId] = useState<string>('');
  const [editCcOptions, setEditCcOptions] = useState<CCOption[]>([]);
  const [editCcLoading, setEditCcLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // ── Load all field managers for the dropdown ─────────────────────────────────
  useEffect(() => {
    if (hideFmSelector) return;
    setFmLoading(true);
    fieldManagerApi.getAll()
      .then((raw: any[]) => {
        setFieldManagers(raw.map((fm: any) => ({ id: fm.id, userId: fm.userId, name: fm.name })));
      })
      .catch(() => toast.error('Failed to load field managers'))
      .finally(() => setFmLoading(false));
  }, [hideFmSelector]);

  // ── When FM changes: load their team CCs ────────────────────────────────────
  useEffect(() => {
    if (!selectedFmUserId) {
      setCcOptions([]);
      setSelectedCcId('');
      return;
    }
    // Find the FM profile ID from userId (needed for getMyTeam)
    const fm = fieldManagers.find(f => f.userId === selectedFmUserId);
    if (!fm && !hideFmSelector) return;

    setCcLoading(true);
    setSelectedCcId('');
    const fmProfileId = fm?.id;
    fieldManagerApi.getMyTeam(fmProfileId)
      .then((team: any[]) => {
        setCcOptions(team.map((cc: any) => ({ id: cc.id, name: cc.name })));
      })
      .catch(() => toast.error('Failed to load team CCs'))
      .finally(() => setCcLoading(false));
  }, [selectedFmUserId, fieldManagers, hideFmSelector]);

  // ── Fetch visits based on filters ───────────────────────────────────────────
  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedFmUserId) params.fmUserId = selectedFmUserId;
      if (selectedCcId) params.careCompanionId = selectedCcId;
      if (selectedDate) params.date = selectedDate;
      const response = await visitApi.getAll(params);
      setVisits(Array.isArray(response) ? response : []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch scheduled visits');
    } finally {
      setLoading(false);
    }
  }, [selectedFmUserId, selectedCcId, selectedDate]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // ── Cancel a visit ──────────────────────────────────────────────────────────
  const handleCancel = async (visitId: string) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return;
    setCancellingId(visitId);
    try {
      await visitApi.cancel(visitId);
      toast.success('Visit cancelled successfully');
      setVisits(prev => prev.filter(v => v.id !== visitId));
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel visit');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Open Edit modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = async (visit: any) => {
    setEditingVisit(visit);
    
    // Format date correctly for datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(visit.scheduledTime);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setEditTime(localISOTime);
    setEditDuration(visit.durationMinutes || 60);
    setEditCcId(visit.careCompanionId);
    
    // Fetch care companions for this specific visit's field manager team
    setEditCcLoading(true);
    setEditCcOptions([]);
    try {
      const fmProfileId = visit.careCompanion?.team?.fieldManager?.id;
      if (fmProfileId) {
        const team = await fieldManagerApi.getMyTeam(fmProfileId);
        setEditCcOptions(team.map((cc: any) => ({ id: cc.id, name: cc.name })));
      } else {
        // Fallback: use general options or existing ones
        setEditCcOptions(ccOptions);
      }
    } catch (err) {
      toast.error('Failed to load care companion options for editing');
    } finally {
      setEditCcLoading(false);
    }
  };

  // ── Save Edit Changes ───────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;
    if (!editCcId || !editTime || !editDuration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setEditSaving(true);
    try {
      await visitApi.update(editingVisit.id, {
        careCompanionId: editCcId,
        scheduledTime: new Date(editTime).toISOString(),
        durationMinutes: editDuration,
      });
      toast.success('Visit rescheduled successfully');
      setEditingVisit(null);
      fetchVisits(); // refresh lists
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule visit');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-[#E7DED6] overflow-hidden flex flex-col mt-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="p-6 border-b border-[#E7DED6] bg-[#FAF8F5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E8F0FF] rounded-xl flex items-center justify-center">
              <CalendarClock size={20} className="text-[#1D4ED8]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800">Scheduled Visits</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Upcoming Appointments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-400 mr-1">
              {visits.length} Visit{visits.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchVisits}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-gray-400 hover:text-[#1D4ED8] bg-white border border-[#E7DED6] hover:border-[#1D4ED8] rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filter Row ──────────────────────────────────────────────────── */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Field Manager filter */}
          {!hideFmSelector && (
            <div className="flex-1 relative">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Filter by Field Manager
              </label>
              <div className="relative">
                <select
                  value={selectedFmUserId}
                  onChange={e => { setSelectedFmUserId(e.target.value); setSelectedCcId(''); }}
                  disabled={fmLoading}
                  className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <option value="">— All Field Managers —</option>
                  {fieldManagers.map(fm => (
                    <option key={fm.id} value={fm.userId}>{fm.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Care Companion filter */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Filter by Care Companion
            </label>
            <div className="relative">
              <select
                value={selectedCcId}
                onChange={e => setSelectedCcId(e.target.value)}
                disabled={ccLoading || (!selectedFmUserId && !hideFmSelector)}
                className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#1D4ED8] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {(!selectedFmUserId && !hideFmSelector) ? '— Select FM first —' : '— All Care Companions —'}
                </option>
                {ccOptions.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date filter */}
          <div className="flex-[1.5] relative">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between items-center">
              <span className="flex items-center gap-1.5"><CalendarClock size={12} className="text-[#1D4ED8]" /> Filter by Date</span>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate('')}
                  className="text-[#FF7A00] hover:text-[#E06B00] text-[9px] font-black uppercase tracking-tighter"
                >
                  Clear filter
                </button>
              )}
            </label>
            <div className="flex flex-col gap-2">
              <div className="relative group">
                <input
                  type="date"
                  value={selectedDate === 'next_7' ? '' : selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all cursor-pointer text-sm font-semibold focus:outline-none ${
                    selectedDate && selectedDate !== 'next_7'
                      ? 'border-[#1D4ED8] bg-[#E8F0FF]/30 text-[#1D4ED8]'
                      : 'border-[#E7DED6] bg-white text-gray-700 focus:border-[#1D4ED8]'
                  }`}
                />
                <Clock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  selectedDate && selectedDate !== 'next_7' ? 'text-[#1D4ED8]' : 'text-gray-400'
                }`} />
              </div>
              
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { label: 'Today', value: format(new Date(), 'yyyy-MM-dd') },
                  { label: 'Tomorrow', value: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd') },
                  { label: 'Next 7 Days', value: 'next_7' },
                ].map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => setSelectedDate(pill.value)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight transition-all border shadow-sm ${
                      selectedDate === pill.value
                        ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] scale-105'
                        : 'bg-white text-gray-400 border-[#E7DED6] hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Visit Cards ────────────────────────────────────────────────────── */}
      <div className="p-6">
        {loading && visits.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCw size={24} className="animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <p className="text-sm font-bold text-gray-600">{error}</p>
            <button onClick={fetchVisits} className="mt-3 text-sm text-[#1D4ED8] font-bold">Try Again</button>
          </div>
        ) : visits.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-[#E7DED6] rounded-[16px]">
            <CalendarClock size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-600">No visits found.</p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedFmUserId || hideFmSelector ? 'Try changing your filters or schedule a visit from the Beneficiaries tab.' : 'Select a Field Manager to see their scheduled visits.'}
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {visits.map((visit) => {
              const visitDate = new Date(visit.scheduledTime);
              return (
                <div key={visit.id} className="border border-[#E7DED6] rounded-[16px] p-4 bg-white hover:border-[#1D4ED8] transition-colors shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    {/* Date + Duration */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#E8F0FF] text-[#1D4ED8] px-3 py-1.5 rounded-lg">
                        <p className="text-[10px] font-black uppercase tracking-widest">{format(visitDate, 'MMM d, yyyy')}</p>
                        <p className="text-sm font-bold mt-0.5">{format(visitDate, 'h:mm a')}</p>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500">
                        {visit.durationMinutes || '—'} Min
                      </span>
                    </div>

                    {/* Beneficiary + CC */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FFEAE8] flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-[#FF4B4B]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Beneficiary</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{visit.beneficiary?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8F0FF] flex items-center justify-center flex-shrink-0">
                          <UserCheck size={14} className="text-[#1D4ED8]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Care Companion</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{visit.careCompanion?.name || 'Unknown'}</p>
                          {visit.careCompanion?.team?.fieldManager && (
                            <p className="text-[9px] text-gray-400 font-bold">FM: {visit.careCompanion.team.fieldManager.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer: status + actions */}
                  <div className="mt-4 pt-4 border-t border-[#E7DED6] flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      visit.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                      visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                      visit.status === 'cancelled' ? 'bg-red-100 text-red-400' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {visit.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-bold mr-1">
                        #{visit.encounterId?.substring(0, 10)}...
                      </span>
                      {visit.status === 'scheduled' && (
                        <>
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(visit)}
                            title="Edit Visit"
                            className="p-1.5 rounded-lg bg-[#FFEAD8] text-[#FF7A00] hover:bg-[#FFD3B4] transition-colors"
                          >
                            <Edit3 size={12} />
                          </button>
                          
                          {/* Cancel button */}
                          <button
                            onClick={() => handleCancel(visit.id)}
                            disabled={cancellingId === visit.id}
                            title="Cancel Visit"
                            className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === visit.id
                              ? <RefreshCw size={12} className="animate-spin" />
                              : <Trash2 size={12} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editingVisit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-[#E7DED6] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E7DED6] bg-[#FAF8F5] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-800">Reschedule Visit</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Encounter {editingVisit.encounterId}</p>
              </div>
              <button
                onClick={() => setEditingVisit(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              {/* Beneficiary read-only display */}
              <div className="bg-[#FFF5EE] border border-[#FFE4D3] rounded-2xl p-4 flex items-center gap-3">
                <User size={18} className="text-[#FF7A00]" />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Beneficiary</p>
                  <p className="text-sm font-black text-gray-800">{editingVisit.beneficiary?.name || 'Unknown'}</p>
                </div>
              </div>

              {/* Date & Time Input */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>

              {/* Duration selection */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEditDuration(mins)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        editDuration === mins
                          ? 'border-[#FF7A00] bg-[#FFF5EE] text-[#FF7A00]'
                          : 'border-[#E7DED6] bg-[#FFFAF7] text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Care Companion selection */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  Assigned Care Companion
                </label>
                <div className="relative">
                  {editCcLoading ? (
                    <div className="flex items-center gap-2 py-3 px-4 border-2 border-[#E7DED6] rounded-xl text-gray-400 bg-gray-50">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF7A00]" />
                      <span className="text-xs">Loading team companion pool...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        required
                        value={editCcId}
                        onChange={e => setEditCcId(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors cursor-pointer"
                      >
                        <option value="" disabled>— Select Care Companion —</option>
                        {editCcOptions.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-[#E7DED6]">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  disabled={editSaving}
                  className="flex-1 py-3 border-2 border-[#E7DED6] bg-white text-sm font-bold text-gray-600 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-3 bg-[#FF7A00] text-white text-sm font-bold rounded-xl hover:bg-[#E06B00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
