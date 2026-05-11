/**
 * FMSelectorDropdown
 * A styled dropdown to select an active Field Manager.
 * Shows name, zone, and team/beneficiary counts.
 */

import React from 'react';
import { Users, ChevronDown, Loader2 } from 'lucide-react';
import { Avatar } from './SharedComponents';

export interface FieldManagerItem {
  id: string;          // FieldManager profile ID
  userId: string;      // User ID (used for fieldManagerId on beneficiary)
  name: string;
  zone?: string;
  teamCount?: number;
  beneficiaryCount?: number;
  isAvailable?: boolean;
}

interface Props {
  fieldManagers: FieldManagerItem[];
  selectedId: string | null;
  onChange: (fm: FieldManagerItem) => void;
  loading?: boolean;
}

export default function FMSelectorDropdown({ fieldManagers, selectedId, onChange, loading }: Props) {
  const selected = fieldManagers.find(fm => fm.id === selectedId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fm = fieldManagers.find(f => f.id === e.target.value);
    if (fm) onChange(fm);
  };

  return (
    <div className="bg-white border border-[#E7DED6] rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left: Label */}
        <div className="shrink-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Viewing Field Manager
          </p>
          <p className="text-sm text-gray-600 font-medium">
            Select a field manager to manage their team
          </p>
        </div>

        {/* Right: Selector */}
        <div className="flex-1 flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading managers...</span>
            </div>
          ) : (
            <div className="flex-1 relative">
              {/* Custom styled select */}
              <div className="relative">
                <select
                  id="fm-selector"
                  value={selectedId ?? ''}
                  onChange={handleChange}
                  className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-[#E7DED6] bg-[#FFFAF7] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#FF7A00] transition-colors cursor-pointer"
                >
                  <option value="" disabled>
                    — Select a Field Manager —
                  </option>
                  {fieldManagers.map(fm => (
                    <option key={fm.id} value={fm.id}>
                      {fm.name}{fm.zone ? ` — ${fm.zone}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
              </div>
            </div>
          )}

          {/* Selected FM mini-card */}
          {selected && (
            <div className="hidden sm:flex items-center gap-3 bg-[#FFF5EE] border border-[#FFE4D3] rounded-xl px-4 py-2.5 shrink-0">
              <Avatar name={selected.name} size="sm" />
              <div>
                <p className="text-sm font-black text-gray-800">{selected.name}</p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {selected.teamCount ?? 0} CCs · {selected.beneficiaryCount ?? 0} Beneficiaries
                </p>
              </div>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  selected.isAvailable ? 'bg-green-500' : 'bg-red-400'
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* No FMs fallback */}
      {!loading && fieldManagers.length === 0 && (
        <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3">
          <Users size={16} />
          <p className="text-xs font-bold">
            No active field managers found. Onboard a field manager first.
          </p>
        </div>
      )}
    </div>
  );
}
