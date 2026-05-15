/**
 * TeamPanel
 * Displays the Care Companions belonging to a selected Field Manager's team.
 * Each CC card shows name, availability, load count, and CC type.
 */

import React from 'react';
import { Users, Phone, RefreshCw } from 'lucide-react';
import { fieldManagerApi } from '../../../services/api';
import { LoadingState, EmptyState, AvailabilityBadge, CCLoadBadge, Avatar, SectionHeader } from './SharedComponents';

export interface CCMember {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  zone?: string;
  ccType?: string;
  isAvailable: boolean;
  teamName?: string;
  primaryBeneficiariesCount: number;
  secondaryBeneficiariesCount: number;
  todayVisitCount?: number;
}

interface Props {
  team: CCMember[];
  loading: boolean;
  onRefresh?: () => void;
}

export default function TeamPanel({ team, loading, onRefresh }: Props) {
  const available = team.filter(cc => cc.isAvailable).length;
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const handleToggle = async (ccId: string, currentStatus: boolean) => {
    setTogglingId(ccId);
    try {
      await fieldManagerApi.toggleCCAvailability(ccId, !currentStatus);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      import('sonner').then(({ toast }) => toast.error('Failed to update status'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#E7DED6] rounded-2xl overflow-hidden">
      <SectionHeader
        title="Team — Care Companions"
        subtitle={
          loading
            ? 'Loading...'
            : `${team.length} member${team.length !== 1 ? 's' : ''} · ${available} online`
        }
        icon={<Users size={18} />}
        action={
          onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-[#FF7A00] uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )
        }
      />

      {loading ? (
        <LoadingState message="Loading team members..." />
      ) : team.length === 0 ? (
        <EmptyState
          message="No care companions in this team yet."
          icon={<Users className="w-12 h-12" />}
        />
      ) : (
        <div className="divide-y divide-[#F4EAE3]">
          {team.map(cc => (
            <div
              key={cc.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#FFF5EE]/40 transition-colors"
            >
              {/* Left: Avatar + Name */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={cc.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 truncate">{cc.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                    {cc.ccType === 'nurse' ? '🏥 Nurse' : '🤝 Care Assistant'}
                    {cc.teamName ? ` · ${cc.teamName}` : ''}
                  </p>
                  {cc.phone && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Phone size={9} />
                      {cc.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Load: primary / secondary */}
                <div className="hidden sm:flex items-center gap-2 text-right">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Primary</p>
                    <CCLoadBadge count={cc.primaryBeneficiariesCount} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Secondary</p>
                    <CCLoadBadge count={cc.secondaryBeneficiariesCount} />
                  </div>
                </div>

                {/* Today visits */}
                <div className="hidden md:block text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Today</p>
                  <p className="text-sm font-black text-gray-700">{cc.todayVisitCount ?? 0}</p>
                </div>

                {/* Availability Toggle */}
                <AvailabilityBadge 
                  isAvailable={cc.isAvailable} 
                  onClick={() => handleToggle(cc.id, cc.isAvailable)}
                  loading={togglingId === cc.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
