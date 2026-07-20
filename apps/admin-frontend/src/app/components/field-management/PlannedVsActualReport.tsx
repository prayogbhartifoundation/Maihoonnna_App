import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarClock, User, UserCheck, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Clock, ShieldCheck, ShieldAlert, AlertTriangle, Eye, ClipboardList, MapPin } from 'lucide-react';
import { visitApi, zoneApi, fieldManagerApi } from '../../../services/api';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import VisitDetailsModal from './VisitDetailsModal';

interface ZoneOption {
  id: string;
  name: string;
}

interface CCOption {
  id: string;
  name: string;
}

export default function PlannedVsActualReport() {
  // ── Filters & Selectors ──────────────────────────────────────────────────
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [zonesLoading, setZonesLoading] = useState<boolean>(false);

  const [ccOptions, setCcOptions] = useState<CCOption[]>([]);
  const [ccLoading, setCcLoading] = useState<boolean>(false);
  const [selectedCcId, setSelectedCcId] = useState<string>('');

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewingVisitId, setViewingVisitId] = useState<string | null>(null);

  // ── Load Zones ───────────────────────────────────────────────────────────
  useEffect(() => {
    setZonesLoading(true);
    zoneApi.getAll()
      .then((raw: any[]) => {
        const list = raw.map((z: any) => ({ id: z.id, name: z.name }));
        setZones(list);
        if (list.length > 0) setSelectedZoneId(list[0].id);
      })
      .catch(() => toast.error('Failed to load zones'))
      .finally(() => setZonesLoading(false));
  }, []);

  // ── Load CC Options when Zone changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedZoneId) {
      setCcOptions([]);
      setSelectedCcId('');
      return;
    }
    setCcLoading(true);
    fieldManagerApi.getAll()
      .then(async (fmList: any[]) => {
        const zoneName = zones.find(z => z.id === selectedZoneId)?.name;
        const fm = fmList.find((f: any) => f.zone === zoneName);
        if (fm) {
          const team = await fieldManagerApi.getMyTeam(fm.id);
          setCcOptions(team.map((cc: any) => ({ id: cc.id, name: cc.name })));
        } else {
          setCcOptions([]);
        }
      })
      .catch(() => toast.error('Failed to load zone care companions'))
      .finally(() => setCcLoading(false));
  }, [selectedZoneId, zones]);

  // ── Fetch Roster Visits Report ───────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!selectedZoneId) return;
    setLoading(true);
    try {
      const fmList = await fieldManagerApi.getAll();
      const zoneName = zones.find(z => z.id === selectedZoneId)?.name;
      const fm = fmList.find((f: any) => f.zone === zoneName);

      const params: any = {};
      if (fm) params.fmUserId = fm.userId;
      if (selectedCcId) params.careCompanionId = selectedCcId;
      if (selectedDate) params.date = selectedDate;

      const rawVisits = await visitApi.getAll(params);
      setVisits(rawVisits);
    } catch (e: any) {
      toast.error('Failed to fetch roster report');
    } finally {
      setLoading(false);
    }
  }, [selectedZoneId, selectedCcId, selectedDate, zones]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Filtered list by status ──────────────────────────────────────────────
  const filteredVisits = useMemo(() => {
    if (!selectedStatus) return visits;
    return visits.filter(v => v.status === selectedStatus);
  }, [visits, selectedStatus]);

  // ── Metrics calculations ──────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const completed = visits.filter(v => v.status === 'completed');
    const total = visits.length;
    const geoVerified = completed.filter(v => v.isGeoVerified).length;
    const verifiedRate = completed.length > 0 ? Math.round((geoVerified / completed.length) * 100) : 0;

    // Calculate average check-in delay (scheduledTime vs checkInTime) for completed visits
    let totalDelay = 0;
    let delayCount = 0;
    completed.forEach(v => {
      if (v.checkInTime) {
        const diff = differenceInMinutes(new Date(v.checkInTime), new Date(v.scheduledTime));
        totalDelay += diff;
        delayCount++;
      }
    });
    const avgDelay = delayCount > 0 ? Math.round(totalDelay / delayCount) : 0;

    return { total, completed: completed.length, verifiedRate, avgDelay };
  }, [visits]);

  return (
    <div className="space-y-6">
      {/* ── Filter & Search Controls ────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-[#E7DED6] p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Zone Selector */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Select Zone
            </label>
            <div className="relative">
              <select
                value={selectedZoneId}
                onChange={e => setSelectedZoneId(e.target.value)}
                disabled={zonesLoading}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} Zone</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Care Companion Selector */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Filter by Care Companion
            </label>
            <div className="relative">
              <select
                value={selectedCcId}
                onChange={e => setSelectedCcId(e.target.value)}
                disabled={ccLoading}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="">— All Companions —</option>
                {ccOptions.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Roster Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold focus:outline-none focus:border-[#1D4ED8]"
              />
              <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
              Visit Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
              >
                <option value="">— All Statuses —</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Performance Indicators (KPIs) ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] p-5 border border-[#E7DED6] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5EE] flex items-center justify-center text-[#FF7A00] flex-shrink-0">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Runs</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-[#E7DED6] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Completed Runs</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">{metrics.completed}</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-[#E7DED6] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FF] flex items-center justify-center text-[#1D4ED8] flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Avg Start Delay</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">
              {metrics.completed > 0 ? `${metrics.avgDelay} min` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-5 border border-[#E7DED6] shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Geo Verified Rate</p>
            <p className="text-xl font-black text-gray-800 mt-0.5">
              {metrics.completed > 0 ? `${metrics.verifiedRate}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Table Report Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-[#E7DED6] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E7DED6] bg-[#FAF8F5] flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-gray-800">Planned vs. Actual Comparison</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Roster execution performance & site arrival auditing</p>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black text-[#1D4ED8] bg-[#E8F0FF] rounded-lg transition-colors hover:bg-[#D1E0FF] disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Sync Report
          </button>
        </div>

        {loading && filteredVisits.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw size={32} className="animate-spin text-[#FF7A00]" />
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[#E7DED6] m-6 rounded-2xl">
            <CalendarClock size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-600">No matching visits found in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#FAF8F5] select-none text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-[#E7DED6]">
                  <th className="py-4 pl-6 border-r border-[#E7DED6]/60">Code</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60">Beneficiary</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60">Care Companion</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60">Planned Roster</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60">Actual Check-In/Out</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60">Arrival Status</th>
                  <th className="py-4 px-4 border-r border-[#E7DED6]/60 text-center">Status</th>
                  <th className="py-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DED6]">
                {filteredVisits.map((visit) => {
                  const plannedDate = new Date(visit.scheduledTime);
                  const checkIn = visit.checkInTime ? new Date(visit.checkInTime) : null;
                  const checkOut = visit.checkOutTime ? new Date(visit.checkOutTime) : null;

                  const isGeoVerified = visit.isGeoVerified === true;
                  const isManual = !!(visit.manualCheckInReason);
                  const hasBeneficiaryGps = !!(visit.beneficiary?.latitude);

                  return (
                    <tr key={visit.id} className="hover:bg-[#FAF8F5]/30 transition-colors">
                      {/* Visit Code */}
                      <td className="py-4 pl-6 border-r border-[#E7DED6]/60 font-mono text-xs font-black text-[#FF7A00]">
                        {visit.visitCode || `#${visit.encounterId.substring(0, 8)}`}
                      </td>

                      {/* Beneficiary */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60 font-black text-sm text-gray-800">
                        {visit.beneficiary?.name || 'Unknown'}
                      </td>

                      {/* Care Companion */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60 font-semibold text-sm text-gray-700">
                        {visit.careCompanion?.name || 'Unknown'}
                      </td>

                      {/* Planned details */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60 text-xs text-gray-600 space-y-0.5">
                        <p className="font-black text-gray-800">{format(plannedDate, 'hh:mm a')}</p>
                        <p className="font-semibold text-gray-400">{visit.durationMinutes || '—'} Min Dur</p>
                      </td>

                      {/* Actual details */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60 text-xs text-gray-600 space-y-0.5">
                        {checkIn && checkOut ? (
                          <>
                            <p className="font-black text-gray-800">
                              {format(checkIn, 'hh:mm a')} - {format(checkOut, 'hh:mm a')}
                            </p>
                            <p className="font-semibold text-green-600">
                              {differenceInMinutes(checkOut, checkIn)} min spent
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-gray-400 italic">No checkout data</p>
                        )}
                      </td>

                      {/* Arrival Verification */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60">
                        {visit.status === 'completed' || visit.status === 'in_progress' ? (
                          (() => {
                            if (isGeoVerified) {
                              return (
                                <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                  <ShieldCheck size={12} className="text-green-600 flex-shrink-0" />
                                  <span>Verified · {visit.geoDistanceMeters ?? '0'}m</span>
                                </div>
                              );
                            } else if (isManual) {
                              return (
                                <div 
                                  className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider truncate max-w-[170px]"
                                  title={visit.manualCheckInReason}
                                >
                                  <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                                  <span className="truncate">Manual: {visit.manualCheckInReason}</span>
                                </div>
                              );
                            } else if (!hasBeneficiaryGps) {
                              return (
                                <div className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                  <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                                  <span>No Patient GPS</span>
                                </div>
                              );
                            } else {
                              return (
                                <div className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                  <ShieldAlert size={12} className="text-red-500 flex-shrink-0" />
                                  <span>Out of Range · {visit.geoDistanceMeters ?? '—'}m</span>
                                </div>
                              );
                            }
                          })()
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 border-r border-[#E7DED6]/60 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                          visit.status === 'scheduled' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          visit.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          visit.status === 'cancelled' ? 'bg-red-50 text-red-400 border-red-200' :
                          visit.status === 'missed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {visit.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 text-right">
                        <button
                          onClick={() => setViewingVisitId(visit.id)}
                          className="p-1.5 rounded-lg bg-[#E8F0FF] text-[#1D4ED8] hover:bg-[#D1E0FF] transition-colors"
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Details Modal ────────────────────────────────────────────────── */}
      {viewingVisitId && (
        <VisitDetailsModal
          visitId={viewingVisitId}
          onClose={() => setViewingVisitId(null)}
        />
      )}
    </div>
  );
}
