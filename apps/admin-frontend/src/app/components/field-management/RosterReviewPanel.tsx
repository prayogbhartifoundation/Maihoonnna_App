import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, User, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Check, Clock, ShieldCheck, ShieldAlert, AlertTriangle, Send, Lock, Eye, Edit3, Trash2 } from 'lucide-react';
import { visitApi, zoneApi, fieldManagerApi } from '../../../services/api';
import { toast } from 'sonner';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import VisitDetailsModal from './VisitDetailsModal';

interface RosterReviewPanelProps {
  mode: 'timeline' | 'feedback';
}

interface ZoneOption {
  id: string;
  name: string;
}

interface CCOption {
  id: string;
  name: string;
}

export default function RosterReviewPanel({ mode }: RosterReviewPanelProps) {
  // ── Filters & Selectors ──────────────────────────────────────────────────
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [zonesLoading, setZonesLoading] = useState<boolean>(false);

  const [periodType, setPeriodType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const [ccs, setCcs] = useState<CCOption[]>([]);
  const [ccsLoading, setCcsLoading] = useState<boolean>(false);

  const [visits, setVisits] = useState<any[]>([]);
  const [visitsLoading, setVisitsLoading] = useState<boolean>(false);

  // ── Approvals & Feedback State ───────────────────────────────────────────
  const [approvalStatus, setApprovalStatus] = useState<any | null>(null);
  const [approving, setApproving] = useState<boolean>(false);

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [zoneFeedback, setZoneFeedback] = useState<string>('');
  const [ccFeedbacks, setCcFeedbacks] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // ── Edit & Reschedule ────────────────────────────────────────────────────
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [editTime, setEditTime] = useState<string>('');
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editCcId, setEditCcId] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
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

  // ── Load CCs & Visits when Zone/Date changes ──────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedZoneId) return;

    setCcsLoading(true);
    setVisitsLoading(true);

    try {
      // 1. Get the Field Manager team associated with the zone to list CCs
      // Find the FM profile that matches the zone
      const fmList = await fieldManagerApi.getAll();
      const zoneName = zones.find(z => z.id === selectedZoneId)?.name;
      const matchedFm = fmList.find((f: any) => f.zone === zoneName);

      let ccList: CCOption[] = [];
      if (matchedFm) {
        const team = await fieldManagerApi.getMyTeam(matchedFm.id);
        ccList = team.map((cc: any) => ({ id: cc.id, name: cc.name }));
      }
      setCcs(ccList);

      // 2. Fetch all visits for the selected period
      const params: any = {};
      if (matchedFm) params.fmUserId = matchedFm.userId;

      if (periodType === 'daily') {
        params.date = selectedDate;
      } else {
        params.date = 'next_7'; // Fallback query for weekly timeline fetches
      }

      const allVisits = await visitApi.getAll(params);
      
      // If weekly, filter visits to the 7-day range starting from the week containing selectedDate
      if (periodType === 'weekly') {
        const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
        const weekEnd = addDays(weekStart, 6);
        const filtered = allVisits.filter((v: any) => {
          const t = new Date(v.scheduledTime);
          return t >= weekStart && t <= weekEnd;
        });
        setVisits(filtered);
      } else {
        setVisits(allVisits);
      }

      // 3. Fetch Roster approvals
      const approvalRes = await visitApi.getRosterApprovals({
        date: selectedDate,
        periodType,
        zoneId: selectedZoneId
      });
      setApprovalStatus(approvalRes.data && approvalRes.data.length > 0 ? approvalRes.data[0] : null);

      // 4. Fetch Roster feedbacks
      const feedbackRes = await visitApi.getRosterFeedbacks({
        date: selectedDate,
        zoneId: selectedZoneId
      });
      setFeedbacks(feedbackRes.data || []);
      
      // Pre-fill feedback values
      const ccMap: Record<string, string> = {};
      feedbackRes.data?.forEach((f: any) => {
        if (f.ccId) ccMap[f.ccId] = f.feedback;
        else if (f.zoneId && !f.ccId) setZoneFeedback(f.feedback);
      });
      setCcFeedbacks(ccMap);

    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load roster data');
    } finally {
      setCcsLoading(false);
      setVisitsLoading(false);
    }
  }, [selectedZoneId, periodType, selectedDate, zones]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Timeline Conflict Detection ──────────────────────────────────────────
  // Identifies visits that have overlapping schedules for the same CC
  const conflicts = useMemo(() => {
    const map: Record<string, boolean> = {};
    
    // Group visits by CC ID
    const byCC: Record<string, any[]> = {};
    visits.forEach(v => {
      if (v.status !== 'cancelled' && v.careCompanionId) {
        if (!byCC[v.careCompanionId]) byCC[v.careCompanionId] = [];
        byCC[v.careCompanionId].push(v);
      }
    });

    // Check overlaps within each CC's schedule
    Object.keys(byCC).forEach(ccId => {
      const list = byCC[ccId];
      for (let i = 0; i < list.length; i++) {
        const startA = new Date(list[i].scheduledTime).getTime();
        const durationA = (list[i].durationMinutes || 60) * 60000;
        const endA = startA + durationA;

        for (let j = i + 1; j < list.length; j++) {
          const startB = new Date(list[j].scheduledTime).getTime();
          const durationB = (list[j].durationMinutes || 60) * 60000;
          const endB = startB + durationB;

          // Standard interval overlap condition
          if (startA < endB && startB < endA) {
            map[list[i].id] = true;
            map[list[j].id] = true;
          }
        }
      }
    });

    return map;
  }, [visits]);

  // ── Roster Approval Handler ──────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedZoneId) return;
    setApproving(true);
    try {
      const res = await visitApi.approveRoster({
        date: selectedDate,
        periodType,
        zoneId: selectedZoneId
      });
      if (res.success) {
        setApprovalStatus(res.data);
        toast.success('Roster approved successfully!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve roster');
    } finally {
      setApproving(false);
    }
  };

  // ── Feedback Submit Handler ──────────────────────────────────────────────
  const handleSubmitFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      // 1. Submit overall zone feedback
      if (zoneFeedback.trim()) {
        await visitApi.submitRosterFeedback({
          date: selectedDate,
          zoneId: selectedZoneId,
          feedback: zoneFeedback
        });
      }

      // 2. Submit CC-specific feedback
      const ccPromises = Object.keys(ccFeedbacks).map(ccId => {
        const text = ccFeedbacks[ccId];
        if (!text.trim()) return Promise.resolve();
        return visitApi.submitRosterFeedback({
          date: selectedDate,
          zoneId: selectedZoneId,
          ccId,
          feedback: text
        });
      });

      await Promise.all(ccPromises);
      toast.success('Daily roster review feedback saved!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // ── Visit Cancel Handler ─────────────────────────────────────────────────
  const handleCancelVisit = async (visitId: string) => {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return;
    try {
      await visitApi.cancel(visitId);
      toast.success('Visit cancelled successfully');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel visit');
    }
  };

  // ── Open Reschedule Modal ───────────────────────────────────────────────
  const handleOpenEdit = (visit: any) => {
    setEditingVisit(visit);
    
    // Format date correctly for datetime-local input
    const d = new Date(visit.scheduledTime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setEditTime(localISOTime);
    setEditDuration(visit.durationMinutes || 60);
    setEditCcId(visit.careCompanionId);
  };

  // ── Save Edit ────────────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;
    setEditSaving(true);

    try {
      await visitApi.update(editingVisit.id, {
        careCompanionId: editCcId,
        scheduledTime: new Date(editTime).toISOString(),
        durationMinutes: editDuration,
      });
      toast.success('Visit rescheduled successfully');
      setEditingVisit(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule visit');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Weekly Days Calculations ─────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
  }, [selectedDate]);

  // ── Render Timeline Mode ─────────────────────────────────────────────────
  const renderTimeline = () => {
    if (ccs.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed border-[#E7DED6] rounded-[24px] bg-white">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-600">No Care Companions assigned in this zone.</p>
          <p className="text-xs text-gray-400 mt-1">Please configure team mapping for this zone first.</p>
        </div>
      );
    }

    if (periodType === 'daily') {
      // Daily Gantt Timeline (8:00 AM to 8:00 PM)
      const startHour = 8;
      const endHour = 20;
      const hoursCount = endHour - startHour; // 12 hours total
      const totalMinutes = hoursCount * 60;   // 720 minutes

      return (
        <div className="bg-white rounded-[24px] border border-[#E7DED6] overflow-x-auto shadow-sm">
          <div className="min-w-[900px] divide-y divide-[#E7DED6]">
            {/* Hour Header */}
            <div className="flex bg-[#FAF8F5] select-none font-bold text-[10px] text-gray-400 uppercase tracking-widest py-3">
              <div className="w-[180px] pl-6 flex-shrink-0 flex items-center border-r border-[#E7DED6]">Care Companion</div>
              <div className="flex-1 grid grid-cols-12 text-center">
                {Array.from({ length: hoursCount }).map((_, i) => {
                  const hr = startHour + i;
                  const displayHr = hr > 12 ? `${hr - 12} PM` : hr === 12 ? '12 PM' : `${hr} AM`;
                  return (
                    <div key={i} className="border-r border-[#E7DED6]/60 last:border-r-0 py-1">
                      {displayHr}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CC Rows */}
            {ccs.map(cc => {
              // Get visits scheduled for this CC on selectedDate
              const ccVisits = visits.filter(v => 
                v.careCompanionId === cc.id &&
                v.status !== 'cancelled' &&
                isSameDay(new Date(v.scheduledTime), new Date(selectedDate))
              );

              return (
                <div key={cc.id} className="flex min-h-[90px] items-stretch group hover:bg-[#FAF8F5]/40 transition-colors">
                  {/* Name column */}
                  <div className="w-[180px] pl-6 py-4 flex-shrink-0 border-r border-[#E7DED6] flex flex-col justify-center gap-0.5">
                    <span className="text-sm font-black text-gray-800 leading-tight">{cc.name}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      {ccVisits.length} Visit{ccVisits.length !== 1 ? 's' : ''} Scheduled
                    </span>
                  </div>

                  {/* Timeline cell */}
                  <div className="flex-1 relative bg-white/50">
                    {/* Hour Vertical Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                      {Array.from({ length: hoursCount }).map((_, i) => (
                        <div key={i} className="border-r border-[#E7DED6]/40 h-full last:border-r-0" />
                      ))}
                    </div>

                    {/* Visit blocks */}
                    <div className="absolute inset-x-0 top-3 bottom-3">
                      {ccVisits.map(visit => {
                        const schedTime = new Date(visit.scheduledTime);
                        const dur = visit.durationMinutes || 60;
                        const isConflict = !!conflicts[visit.id];

                        // Calculate horizontal offset
                        const startMinutes = (schedTime.getHours() * 60) + schedTime.getMinutes();
                        const timelineStartMinutes = startHour * 60;
                        const offsetFromStart = startMinutes - timelineStartMinutes;

                        // Width & Left percentages
                        let leftPercent = (offsetFromStart / totalMinutes) * 100;
                        let widthPercent = (dur / totalMinutes) * 100;

                        // Constrain within visible timeline boundaries
                        if (leftPercent < 0) {
                          widthPercent += leftPercent;
                          leftPercent = 0;
                        }
                        if (leftPercent + widthPercent > 100) {
                          widthPercent = 100 - leftPercent;
                        }

                        if (widthPercent <= 0) return null;

                        // Actual checkout indicators if completed
                        const checkIn = visit.checkInTime ? new Date(visit.checkInTime) : null;
                        const checkOut = visit.checkOutTime ? new Date(visit.checkOutTime) : null;
                        
                        let actualLeftPercent = 0;
                        let actualWidthPercent = 0;

                        if (checkIn && checkOut) {
                          const actualStartMinutes = (checkIn.getHours() * 60) + checkIn.getMinutes();
                          const actualDur = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
                          const actualOffset = actualStartMinutes - timelineStartMinutes;

                          actualLeftPercent = (actualOffset / totalMinutes) * 100;
                          actualWidthPercent = (actualDur / totalMinutes) * 100;

                          if (actualLeftPercent < 0) {
                            actualWidthPercent += actualLeftPercent;
                            actualLeftPercent = 0;
                          }
                          if (actualLeftPercent + actualWidthPercent > 100) {
                            actualWidthPercent = 100 - actualLeftPercent;
                          }
                        }

                        return (
                          <div key={visit.id}>
                            {/* Planned Bar */}
                            <div
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                              className={`absolute h-7 rounded-lg text-[10px] font-bold px-2 py-1 select-none flex items-center justify-between border cursor-pointer group/bar shadow-sm transition-all hover:scale-[1.02] hover:z-10 ${
                                isConflict 
                                  ? 'bg-red-50 border-red-200 text-red-700 hover:border-red-400' 
                                  : visit.status === 'completed'
                                  ? 'bg-[#E8F0FF] border-[#D1E0FF] text-[#1D4ED8]'
                                  : 'bg-[#FFF5EE] border-[#FFE0C7] text-[#FF7A00]'
                              }`}
                              title={`${visit.beneficiary?.name} (${format(schedTime, 'hh:mm a')}) - ${dur}m`}
                              onClick={() => handleOpenEdit(visit)}
                            >
                              <span className="truncate flex items-center gap-1">
                                {isConflict && <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />}
                                {visit.beneficiary?.name}
                              </span>
                              
                              {/* Hover controls inside visual block */}
                              <div className="hidden group-hover/bar:flex items-center gap-1 bg-white/95 px-1 py-0.5 rounded shadow border border-gray-200">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewingVisitId(visit.id); }}
                                  className="text-gray-500 hover:text-blue-600 p-0.5"
                                  title="View"
                                >
                                  <Eye size={10} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(visit); }}
                                  className="text-gray-500 hover:text-amber-600 p-0.5"
                                  title="Reschedule"
                                >
                                  <Edit3 size={10} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCancelVisit(visit.id); }}
                                  className="text-gray-500 hover:text-red-600 p-0.5"
                                  title="Cancel"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>

                            {/* Actual Execution Bar (rendered underneath planned bar) */}
                            {checkIn && checkOut && actualWidthPercent > 0 && (
                              <div
                                style={{ left: `${actualLeftPercent}%`, width: `${actualWidthPercent}%` }}
                                className="absolute top-8 h-3.5 rounded bg-green-50 border border-green-200 hover:border-green-400 select-none flex items-center px-1 text-[8px] font-black text-green-700 uppercase tracking-widest shadow-sm cursor-help"
                                title={`Actual: ${format(checkIn, 'hh:mm a')} - ${format(checkOut, 'hh:mm a')} (${Math.round((checkOut.getTime() - checkIn.getTime()) / 60000)}m)`}
                              >
                                <span className="truncate">Actual</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Weekly Grid Layout (CC x Day)
      return (
        <div className="bg-white rounded-[24px] border border-[#E7DED6] overflow-x-auto shadow-sm">
          <table className="w-full min-w-[950px] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] select-none text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-[#E7DED6]">
                <th className="w-[180px] text-left pl-6 py-4 border-r border-[#E7DED6]">Care Companion</th>
                {weekDays.map((day, idx) => (
                  <th key={idx} className="px-4 py-4 text-center border-r border-[#E7DED6]/80 last:border-r-0">
                    <p className="font-black text-gray-800">{format(day, 'EEEE')}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-0.5">{format(day, 'MMM d')}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED6]">
              {ccs.map(cc => (
                <tr key={cc.id} className="hover:bg-[#FAF8F5]/30 transition-colors">
                  <td className="w-[180px] pl-6 py-4 border-r border-[#E7DED6] font-black text-sm text-gray-800">
                    {cc.name}
                  </td>
                  {weekDays.map((day, idx) => {
                    const ccDayVisits = visits.filter(v => 
                      v.careCompanionId === cc.id &&
                      v.status !== 'cancelled' &&
                      isSameDay(new Date(v.scheduledTime), day)
                    );

                    return (
                      <td key={idx} className="p-3 border-r border-[#E7DED6]/60 last:border-r-0 align-top h-[120px] bg-white/40">
                        <div className="flex flex-col gap-2">
                          {ccDayVisits.map(visit => {
                            const dateObj = new Date(visit.scheduledTime);
                            const isConflict = !!conflicts[visit.id];

                            return (
                              <div
                                key={visit.id}
                                className={`p-2 rounded-xl border text-xs shadow-sm cursor-pointer hover:scale-[1.02] transition-transform ${
                                  isConflict 
                                    ? 'bg-red-50 border-red-200 text-red-700' 
                                    : visit.status === 'completed'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-[#FFF5EE] border-[#FFE0C7] text-[#FF7A00]'
                                }`}
                                onClick={() => handleOpenEdit(visit)}
                              >
                                <div className="flex justify-between items-start font-bold">
                                  <span>{format(dateObj, 'h:mm a')}</span>
                                  {isConflict && <AlertTriangle size={11} className="text-red-500" />}
                                </div>
                                <p className="font-black mt-0.5 truncate">{visit.beneficiary?.name}</p>
                                <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-black/5 text-[9px] font-bold text-gray-400">
                                  <span>{visit.durationMinutes}m</span>
                                  <span className="uppercase">{visit.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  // ── Render Feedback Mode ─────────────────────────────────────────────────
  const renderFeedback = () => {
    if (ccs.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed border-[#E7DED6] rounded-[24px] bg-white">
          <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-600">No Care Companions in this zone to review.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overall Zone Comments */}
        <div className="bg-white rounded-[24px] border border-[#E7DED6] p-6 shadow-sm">
          <h3 className="text-base font-black text-gray-800 mb-3 flex items-center gap-2">
            Overall Zone Feedback — {zones.find(z => z.id === selectedZoneId)?.name}
          </h3>
          <textarea
            value={zoneFeedback}
            onChange={e => setZoneFeedback(e.target.value)}
            placeholder="Log overall roster operational issues, delay details, or check-in anomalies for the zone today..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm focus:outline-none focus:border-[#FF7A00] transition-colors"
          />
        </div>

        {/* CC wise list */}
        <div className="bg-white rounded-[24px] border border-[#E7DED6] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#E7DED6] bg-[#FAF8F5]">
            <h3 className="text-base font-black text-gray-800">Care Companion Wise Review Comments</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Capturing daily check-in anomalies and performance notes</p>
          </div>

          <div className="divide-y divide-[#E7DED6]">
            {ccs.map(cc => {
              // Pull today's visits for metadata display
              const ccTodayVisits = visits.filter(v => 
                v.careCompanionId === cc.id &&
                v.status !== 'cancelled' &&
                isSameDay(new Date(v.scheduledTime), new Date(selectedDate))
              );

              return (
                <div key={cc.id} className="p-6 flex flex-col md:flex-row gap-5 items-start">
                  <div className="w-full md:w-[220px] flex-shrink-0">
                    <p className="text-sm font-black text-gray-800">{cc.name}</p>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-500">
                        {ccTodayVisits.length} visit{ccTodayVisits.length !== 1 ? 's' : ''} today
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={ccFeedbacks[cc.id] || ''}
                      onChange={e => setCcFeedbacks({ ...ccFeedbacks, [cc.id]: e.target.value })}
                      placeholder={`Enter notes for ${cc.name}...`}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm focus:outline-none focus:border-[#FF7A00] transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-[#E7DED6] bg-[#FAF8F5] flex justify-end">
            <button
              onClick={handleSubmitFeedback}
              disabled={submittingFeedback}
              className="px-6 py-3 bg-[#FF7A00] hover:bg-[#E06B00] text-white text-sm font-black rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submittingFeedback ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              Save Roster Feedback
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Sub-Filters & Actions Bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-[#E7DED6] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Zone Selection */}
            <div className="relative">
              <select
                value={selectedZoneId}
                onChange={e => setSelectedZoneId(e.target.value)}
                disabled={zonesLoading}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-700 cursor-pointer focus:outline-none focus:border-[#1D4ED8]"
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} Zone</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Daily/Weekly Toggle */}
            {mode === 'timeline' && (
              <div className="flex bg-[#FFFAF7] border border-[#E7DED6] rounded-xl p-0.5">
                {(['daily', 'weekly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriodType(p)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      periodType === p
                        ? 'bg-[#1D4ED8] text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl border border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold focus:outline-none focus:border-[#1D4ED8]"
              />
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Roster Approval Action */}
          <div className="flex items-center gap-3">
            {approvalStatus ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm">
                <Lock size={14} />
                <span>Roster Approved</span>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                disabled={approving || !selectedZoneId}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {approving ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                Approve Roster
              </button>
            )}

            <button
              onClick={fetchData}
              disabled={visitsLoading}
              className="p-2.5 rounded-xl border border-[#E7DED6] bg-white hover:border-[#1D4ED8] text-gray-400 hover:text-[#1D4ED8] transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw size={15} className={visitsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Conflicts Alert Indicator */}
        {mode === 'timeline' && Object.keys(conflicts).length > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs font-bold">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <span>Overlapping schedules detected. Conflicts highlighted in red. Please reschedule to resolve conflicts.</span>
          </div>
        )}
      </div>

      {/* ── Content View ─────────────────────────────────────────────────────── */}
      {visitsLoading && visits.length === 0 ? (
        <div className="flex justify-center items-center py-20 bg-white border border-[#E7DED6] rounded-[24px]">
          <RefreshCw size={32} className="animate-spin text-[#FF7A00]" />
        </div>
      ) : mode === 'timeline' ? (
        renderTimeline()
      ) : (
        renderFeedback()
      )}

      {/* ── Reschedule Edit Modal ─────────────────────────────────────────────── */}
      {editingVisit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] shadow-2xl border border-[#E7DED6] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E7DED6] bg-[#FAF8F5] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-800">Reschedule Visit</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  {editingVisit.visitCode ? <span className="font-mono text-[#FF7A00]">{editingVisit.visitCode}</span> : `Encounter ${editingVisit.encounterId}`}
                </p>
              </div>
              <button
                onClick={() => setEditingVisit(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="bg-[#FFF5EE] border border-[#FFE4D3] rounded-2xl p-4 flex items-center gap-3">
                <User size={18} className="text-[#FF7A00]" />
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Beneficiary</p>
                  <p className="text-sm font-black text-gray-800">{editingVisit.beneficiary?.name || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm font-semibold focus:outline-none focus:border-[#FF7A00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Duration (Minutes)</label>
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
                  className="flex-1 py-3 bg-[#FF7A00] text-white text-sm font-black rounded-xl hover:bg-[#E06B00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {editSaving ? <RefreshCw size={15} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
