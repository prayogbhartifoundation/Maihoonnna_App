import React from 'react';
import ScheduledVisitsPanel from '../components/field-management/ScheduledVisitsPanel';

export default function VisitsPage() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-[#FAF8F5] p-6 rounded-[24px] border border-[#E7DED6]">
        <h1 className="text-2xl font-black text-gray-800">Global Visits</h1>
        <p className="text-sm font-bold text-gray-500 mt-1">
          Monitor and manage all scheduled, in-progress, and completed visits across all zones.
        </p>
      </div>

      <ScheduledVisitsPanel hideFmSelector={false} />
    </div>
  );
}
