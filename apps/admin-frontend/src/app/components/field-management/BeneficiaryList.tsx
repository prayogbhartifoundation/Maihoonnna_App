/**
 * BeneficiaryList
 * Searchable list of beneficiaries assigned to a Field Manager's zone.
 * Core feature: inline visit scheduling — select a CC from the FM's team, set date/time, and save.
 */

import React, { useState, useMemo } from 'react';
import {
  Search, Users, Calendar, Clock,
  Loader2, AlertCircle, X, ChevronRight, Phone, MapPin
} from 'lucide-react';
import { visitApi } from '../../../services/api';
import { LoadingState, EmptyState, Avatar, SectionHeader } from './SharedComponents';
import { PackageUtilizationPanel } from '../PackageUtilizationPanel';
import type { CCMember } from './TeamPanel';

export interface BeneficiaryItem {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  city?: string;
  pincode?: string;
  primaryCcId?: string | null;
  primaryCcName?: string | null;
  secondaryCcId?: string | null;
  secondaryCcName?: string | null;
  activePackage?: string | null;
  subscriberName?: string | null;
}

interface Props {
  beneficiaries: BeneficiaryItem[];
  team: CCMember[];
  loading: boolean;
  submittingId: string | null;
  onScheduleVisit: (beneficiaryId: string, ccId: string, scheduledTime: string, durationMinutes: number) => Promise<void>;
}

export default function BeneficiaryList({
  beneficiaries,
  team,
  loading,
  submittingId,
  onScheduleVisit,
}: Props) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [scheduleState, setScheduleState] = useState<Record<string, { ccId: string; date: string; time: string; duration: number }>>({});

  // Available CCs (for dropdown)
  const availableCCs = team; 

  // Filtered & searched list
  const filtered = useMemo(() => {
    return beneficiaries.filter(b => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.city?.toLowerCase().includes(q)
      );
    });
  }, [beneficiaries, search]);

  const handleToggleExpand = (benId: string) => {
    const isExpanded = expandedId === benId;
    if (isExpanded) {
      setExpandedId(null);
    } else {
      setExpandedId(benId);
      // Initialize schedule state if not exists
      if (!scheduleState[benId]) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        setScheduleState(prev => ({
          ...prev,
          [benId]: { ccId: '', date: dateStr, time: '10:00', duration: 60 }
        }));
      }
    }
  };

  const handleSchedule = async (beneficiaryId: string) => {
    const state = scheduleState[beneficiaryId];
    if (!state || !state.ccId || !state.date || !state.time) return;
    
    // Construct ISO string for scheduledTime
    const scheduledTime = new Date(`${state.date}T${state.time}`).toISOString();
    
    await onScheduleVisit(beneficiaryId, state.ccId, scheduledTime, state.duration);
    
    // Clear selection on success
    setScheduleState(prev => {
      const next = { ...prev };
      delete next[beneficiaryId];
      return next;
    });
    setExpandedId(null);
  };

  const updateSchedule = (benId: string, key: string, value: any) => {
    setScheduleState(prev => {
      const newState = { ...prev, [benId]: { ...prev[benId], [key]: value } };
      checkConflict(benId, newState[benId]);
      return newState;
    });
  };

  const [conflicts, setConflicts] = useState<Record<string, string | null>>({});

  const checkConflict = async (benId: string, state: any) => {
    if (!state.ccId || !state.date || !state.time || !state.duration) {
      setConflicts(prev => ({ ...prev, [benId]: null }));
      return;
    }
    try {
      const scheduledTime = new Date(`${state.date}T${state.time}`).toISOString();
      const res = await visitApi.checkAvailability(state.ccId, scheduledTime, state.duration);
      setConflicts(prev => ({ ...prev, [benId]: res.isAvailable ? null : res.reason }));
    } catch (e) {
      console.error('Availability check failed', e);
    }
  };

  return (
    <div className="bg-white border border-[#E7DED6] rounded-2xl overflow-hidden">
      <SectionHeader
        title="Beneficiaries"
        subtitle={
          loading
            ? 'Loading...'
            : `${beneficiaries.length} total`
        }
        icon={<Users size={18} />}
      />

      {/* Search Bar */}
      <div className="p-4 border-b border-[#F4EAE3] flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search by name, phone, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E7DED6] text-sm bg-[#FFFAF7] focus:outline-none focus:border-[#FF7A00] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingState message="Loading beneficiaries..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            search
              ? `No beneficiaries matching "${search}"`
              : 'No beneficiaries found for this field manager.'
          }
          icon={<Users className="w-12 h-12" />}
        />
      ) : (
        <div className="divide-y divide-[#F4EAE3]">
          {filtered.map(ben => {
            const isExpanded = expandedId === ben.id;
            const isSubmitting = submittingId === ben.id;
            const state = scheduleState[ben.id] || { ccId: '', date: '', time: '', duration: 60 };

            return (
              <div key={ben.id} className="transition-colors">
                {/* Row */}
                <div
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FFF5EE]/40 transition-colors ${
                    isExpanded ? 'bg-[#FFF5EE]/60' : ''
                  }`}
                  onClick={() => handleToggleExpand(ben.id)}
                >
                  {/* Avatar */}
                  <Avatar name={ben.name} size="md" />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-gray-800 truncate">{ben.name}</p>
                      {ben.age && (
                        <span className="text-[10px] text-gray-400 font-bold">{ben.age}y</span>
                      )}
                      {ben.activePackage && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          {ben.activePackage}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {ben.phone && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                          <Phone size={9} />{ben.phone}
                        </span>
                      )}
                      {ben.city && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                          <MapPin size={9} />{ben.city}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <ChevronRight
                      size={16}
                      className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded: Schedule Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 bg-[#FFF5EE]/30 border-t border-[#F4EAE3]">
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left: Schedule Form */}
                      <div className="flex-1 max-w-lg">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Calendar size={12} /> Schedule a Visit
                        </p>

                      <div className="space-y-3">
                        {/* Care Companion Select */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Care Companion</label>
                            <select
                              value={state.ccId}
                              onChange={e => updateSchedule(ben.id, 'ccId', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-3 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors"
                            >
                              <option value="">— Select Care Companion —</option>
                              {availableCCs.map(cc => (
                                <option 
                                  key={cc.id} 
                                  value={cc.id}
                                  className={!cc.isAvailable ? 'text-gray-400' : ''}
                                  disabled={!cc.isAvailable}
                                >
                                  {cc.name} {!cc.isAvailable ? '(Offline)' : ''}
                                </option>
                              ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                          {/* Date Input */}
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                            <input
                              type="date"
                              value={state.date}
                              onChange={e => updateSchedule(ben.id, 'date', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-3 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors"
                            />
                          </div>

                          {/* Time Input */}
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Time</label>
                            <input
                              type="time"
                              value={state.time}
                              onChange={e => updateSchedule(ben.id, 'time', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors focus:outline-none ${
                                conflicts[ben.id] 
                                  ? 'bg-gray-50 text-gray-400 border-gray-200' 
                                  : 'bg-white text-gray-700 border-[#E7DED6] focus:border-[#FF7A00]'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 items-start pt-2">
                           {/* Duration Select */}
                           <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Clock size={10} /> Duration
                            </label>
                            <select
                              value={state.duration}
                              onChange={e => updateSchedule(ben.id, 'duration', parseInt(e.target.value, 10))}
                              onClick={e => e.stopPropagation()}
                              className="w-full px-3 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors"
                            >
                              <option value={30}>30 mins</option>
                              <option value={60}>1 hour</option>
                              <option value={90}>1.5 hours</option>
                              <option value={120}>2 hours</option>
                            </select>
                          </div>

                          {/* Submit Button */}
                          <div className="flex-1">
                            <label className="block h-4 mb-1"></label>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleSchedule(ben.id);
                              }}
                              disabled={!state.ccId || !state.date || !state.time || isSubmitting || !!conflicts[ben.id]}
                              className="w-full px-5 py-2.5 bg-[#FF7A00] text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-[#E66E00] transition-all disabled:opacity-40 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-orange-200 h-[42px]"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 size={13} className="animate-spin" />
                                  Scheduling...
                                </>
                              ) : (
                                <>
                                  <Calendar size={13} />
                                  Schedule Visit
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Conflict Warning */}
                        {conflicts[ben.id] && (
                          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] font-bold text-red-600 leading-tight">
                              {conflicts[ben.id]}
                            </p>
                          </div>
                        )}
                      </div> 
                    </div> 

                    {/* Right: Package Utilization */}
                    <div className="flex-1 lg:border-l lg:border-[#F4EAE3] lg:pl-8">
                      <PackageUtilizationPanel beneficiaryId={ben.id} beneficiaryName={ben.name} />
                    </div>
                  </div> 
                </div> 
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-[#F4EAE3] bg-gray-50/50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Showing {filtered.length} of {beneficiaries.length} beneficiaries
          </p>
        </div>
      )}
    </div>
  );
}
