/**
 * BeneficiaryList
 * Searchable list of beneficiaries assigned to a Field Manager's zone.
 * Core feature: inline CC appointment — select a CC from the FM's team and save.
 */

import React, { useState, useMemo } from 'react';
import {
  Search, Filter, UserCheck, Users, CheckCircle2,
  Loader2, AlertCircle, X, ChevronRight, Phone, MapPin
} from 'lucide-react';
import { LoadingState, EmptyState, Avatar, AvailabilityBadge, SectionHeader } from './SharedComponents';
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
  onAssignCC: (beneficiaryId: string, ccId: string) => Promise<void>;
  onRemoveCC?: (beneficiaryId: string) => Promise<void>;
}

type FilterMode = 'all' | 'unassigned' | 'assigned';

export default function BeneficiaryList({
  beneficiaries,
  team,
  loading,
  submittingId,
  onAssignCC,
  onRemoveCC,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingCcId, setPendingCcId] = useState<Record<string, string>>({});

  // Available CCs (for assignment dropdown)
  const availableCCs = team.filter(cc => cc.primaryBeneficiariesCount < 5);

  // Filtered & searched list
  const filtered = useMemo(() => {
    return beneficiaries
      .filter(b => {
        if (filter === 'unassigned') return !b.primaryCcId;
        if (filter === 'assigned') return !!b.primaryCcId;
        return true;
      })
      .filter(b => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.phone?.includes(q) ||
          b.city?.toLowerCase().includes(q)
        );
      });
  }, [beneficiaries, search, filter]);

  const handleAssign = async (beneficiaryId: string) => {
    const ccId = pendingCcId[beneficiaryId];
    if (!ccId) return;
    await onAssignCC(beneficiaryId, ccId);
    // Clear pending selection on success
    setPendingCcId(prev => {
      const next = { ...prev };
      delete next[beneficiaryId];
      return next;
    });
    setExpandedId(null);
  };

  const unassignedCount = beneficiaries.filter(b => !b.primaryCcId).length;
  const assignedCount = beneficiaries.filter(b => !!b.primaryCcId).length;

  return (
    <div className="bg-white border border-[#E7DED6] rounded-2xl overflow-hidden">
      <SectionHeader
        title="Beneficiaries"
        subtitle={
          loading
            ? 'Loading...'
            : `${beneficiaries.length} total · ${unassignedCount} unassigned`
        }
        icon={<UserCheck size={18} />}
      />

      {/* Search + Filter Bar */}
      <div className="p-4 border-b border-[#F4EAE3] flex flex-col sm:flex-row gap-3">
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

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
          {(['all', 'unassigned', 'assigned'] as FilterMode[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-white text-[#FF7A00] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f === 'all'
                ? `All (${beneficiaries.length})`
                : f === 'unassigned'
                ? `Unassigned (${unassignedCount})`
                : `Assigned (${assignedCount})`}
            </button>
          ))}
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
              : filter === 'unassigned'
              ? 'All beneficiaries have been assigned a CC!'
              : 'No beneficiaries found for this field manager.'
          }
          icon={<Users className="w-12 h-12" />}
          action={
            filter !== 'all' ? (
              <button
                onClick={() => setFilter('all')}
                className="text-xs font-bold text-[#FF7A00] hover:underline"
              >
                Show all
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-[#F4EAE3]">
          {filtered.map(ben => {
            const isExpanded = expandedId === ben.id;
            const isSubmitting = submittingId === ben.id;
            const currentCc = team.find(cc => cc.id === ben.primaryCcId);
            const selectedCcId = pendingCcId[ben.id] ?? '';

            return (
              <div key={ben.id} className="transition-colors">
                {/* Row */}
                <div
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#FFF5EE]/40 transition-colors ${
                    isExpanded ? 'bg-[#FFF5EE]/60' : ''
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : ben.id)}
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

                  {/* Assignment Status */}
                  <div className="shrink-0 flex items-center gap-3">
                    {ben.primaryCcId ? (
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">CC</p>
                        <p className="text-xs font-black text-green-700">{ben.primaryCcName || 'Assigned'}</p>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                        Unassigned
                      </span>
                    )}
                    <ChevronRight
                      size={16}
                      className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Expanded: Assign Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-[#FFF5EE]/30 border-t border-[#F4EAE3]">
                    <div className="max-w-lg">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Appoint Care Companion
                      </p>

                      {/* Current assignment info */}
                      {ben.primaryCcId && currentCc && (
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-green-50 border border-green-200">
                          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-black text-green-800">Currently Assigned</p>
                            <p className="text-xs text-green-600">{currentCc.name}</p>
                          </div>
                          {onRemoveCC && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onRemoveCC(ben.id);
                              }}
                              disabled={isSubmitting}
                              className="text-[10px] font-black text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <select
                          value={selectedCcId}
                          onChange={e =>
                            setPendingCcId(prev => ({ ...prev, [ben.id]: e.target.value }))
                          }
                          onClick={e => e.stopPropagation()}
                          className="flex-1 px-3 py-2.5 rounded-xl border border-[#E7DED6] bg-white text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF7A00] transition-colors"
                        >
                          <option value="">— Select Care Companion —</option>
                          {team.map(cc => (
                            <option
                              key={cc.id}
                              value={cc.id}
                              disabled={cc.primaryBeneficiariesCount >= 5}
                            >
                              {cc.name}
                              {cc.isAvailable ? ' ✓' : ' (Busy)'}
                              {` · ${cc.primaryBeneficiariesCount}/5`}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleAssign(ben.id);
                          }}
                          disabled={!selectedCcId || isSubmitting}
                          className="px-5 py-2.5 bg-[#FF7A00] text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-[#E66E00] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 shadow-sm shadow-orange-200"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} />
                              Appoint
                            </>
                          )}
                        </button>
                      </div>

                      {availableCCs.length === 0 && (
                        <div className="flex items-center gap-2 mt-3 text-amber-600">
                          <AlertCircle size={13} />
                          <p className="text-xs font-bold">
                            All care companions in this team have reached max capacity (5).
                          </p>
                        </div>
                      )}
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
