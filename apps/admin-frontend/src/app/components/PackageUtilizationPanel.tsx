import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Loader2, RefreshCw, PackageCheck, Calendar } from 'lucide-react';
import { subscriptionApi } from '../../services/api';

interface BenefitBalance {
  benefitId: string;
  benefitName: string;
  unitLabel: string;
  benefitTypeName: string | null;
  description: string | null;
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
  usagePercent: number;
  isLowBalance: boolean;
  isExhausted: boolean;
}

interface LogEntry {
  id: string;
  visitId: string | null;
  encounterId: string | null;
  hoursConsumed: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  loggedAt: string;
  careCompanionName: string;
  ccType: string | null;
  visitStatus: string | null;
  actualMinutes: number | null;
}

interface UtilizationData {
  subscription: {
    id: string;
    packageName: string;
    packageType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    hoursTotal: number;
    hoursUsed: number;
    hoursRemaining: number;
    visitsTotal: number;
    visitsCompleted: number;
  } | null;
  benefits: BenefitBalance[];
  recentLogs: LogEntry[];
}

interface Props {
  beneficiaryId: string;
  beneficiaryName?: string;
}

/** SVG Circular progress ring */
function CircleRing({
  percent,
  size = 80,
  strokeWidth = 7,
  color,
  label,
  value,
  unit,
  isExhausted,
  isLow,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  value: string;
  unit: string;
  isExhausted: boolean;
  isLow: boolean;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  const ringColor = isExhausted ? '#EF4444' : isLow ? '#F59E0B' : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-black text-gray-800 leading-tight">{value}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase leading-tight">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider leading-tight max-w-[80px] text-center">{label}</p>
        {isExhausted && (
          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Exhausted</span>
        )}
        {!isExhausted && isLow && (
          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Low</span>
        )}
      </div>
    </div>
  );
}

const COLORS = ['#FF7A00', '#7C3AED', '#059669', '#2563EB', '#DB2777', '#D97706'];

export function PackageUtilizationPanel({ beneficiaryId, beneficiaryName }: Props) {
  const [data, setData] = useState<UtilizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionApi.getBeneficiaryUtilization(beneficiaryId);
      setData(result as unknown as UtilizationData);
    } catch (err: any) {
      setError(err.message || 'Failed to load utilization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beneficiaryId) load();
  }, [beneficiaryId]);

  if (loading) {
    return (
      <div className="bg-white rounded-[32px] p-12 border border-[#E7DED6] flex items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#FF7A00]" size={24} />
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading utilization data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[32px] p-10 border border-[#E7DED6] text-center">
        <AlertTriangle className="text-amber-400 mx-auto mb-3" size={32} />
        <p className="text-sm font-bold text-gray-600">{error}</p>
        <button onClick={load} className="mt-4 text-[#FF7A00] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mx-auto">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  if (!data || !data.subscription) {
    return (
      <div className="bg-white rounded-[32px] p-12 border border-dashed border-[#E7DED6] flex flex-col items-center justify-center gap-4 text-center">
        <PackageCheck size={36} className="text-gray-200" />
        <div>
          <h3 className="font-black text-gray-600 text-sm uppercase tracking-widest">No Active Subscription</h3>
          <p className="text-xs text-gray-400 mt-1">Enroll this beneficiary in a package to track utilization.</p>
        </div>
      </div>
    );
  }

  const { subscription, benefits, recentLogs } = data;
  const visibleLogs = showAllLogs ? recentLogs : recentLogs.slice(0, 8);
  const hasWarnings = benefits.some(b => b.isLowBalance || b.isExhausted);

  return (
    <div className="space-y-6">
      {/* Package Header */}
      <div className="bg-white rounded-[28px] p-6 border border-[#E7DED6] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PackageCheck size={18} className="text-[#FF7A00]" />
              <h3 className="text-lg font-black text-gray-900">{subscription.packageName}</h3>
              <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} />
              {new Date(subscription.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              &nbsp;→&nbsp;
              {new Date(subscription.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-gray-400 hover:text-[#FF7A00] transition-colors"
            title="Refresh utilization"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Warning Banner */}
        {hasWarnings && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl mb-4">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs font-bold text-amber-700">
              {benefits.filter(b => b.isExhausted).length > 0
                ? `${benefits.filter(b => b.isExhausted).length} benefit(s) exhausted — renewal or top-up needed`
                : `${benefits.filter(b => b.isLowBalance).length} benefit(s) running low (< 20% remaining)`}
            </p>
          </div>
        )}

        {/* Benefit Rings */}
        {benefits.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8 py-6">
            {benefits.map((b, i) => (
              <CircleRing
                key={b.benefitId}
                percent={b.usagePercent}
                size={90}
                strokeWidth={8}
                color={COLORS[i % COLORS.length]}
                label={b.benefitName || 'Benefit'}
                value={`${b.remainingUnits}`}
                unit={`/ ${b.totalUnits} ${b.unitLabel}`}
                isExhausted={b.isExhausted}
                isLow={b.isLowBalance}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8 italic">No benefit balances configured for this subscription.</p>
        )}

        {/* Benefit Detail Cards */}
        {benefits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {benefits.map((b, i) => {
              const accent = COLORS[i % COLORS.length];
              return (
                <div
                  key={b.benefitId}
                  className={`p-4 rounded-2xl border transition-all ${b.isExhausted
                      ? 'bg-red-50 border-red-100'
                      : b.isLowBalance
                        ? 'bg-amber-50 border-amber-100'
                        : 'bg-[#FDFBF9] border-gray-100'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-gray-700">{b.benefitName}</p>
                    {b.isExhausted ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-red-600 uppercase">
                        <AlertTriangle size={10} /> Exhausted
                      </span>
                    ) : b.isLowBalance ? (
                      <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                        <AlertTriangle size={10} /> Low
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase">
                        <CheckCircle2 size={10} /> OK
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${b.usagePercent}%`,
                        backgroundColor: b.isExhausted ? '#EF4444' : b.isLowBalance ? '#F59E0B' : accent,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500">
                      {b.usedUnits} used · {b.remainingUnits} left
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">{b.unitLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
      {recentLogs.length > 0 && (
        <div className="bg-white rounded-[28px] p-6 border border-[#E7DED6] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-[#FF7A00]" />
              Recent Activity Log
            </h4>
            <span className="text-[10px] font-bold text-gray-400">{recentLogs.length} entries</span>
          </div>
          <div className="space-y-2">
            {visibleLogs.map((log) => {
              const isHours = (log.hoursConsumed ?? 0) > 0;
              const billMinutes = log.actualMinutes ? Math.max(60, log.actualMinutes) : null;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAFAFA] border border-gray-50 hover:border-[#E7DED6] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-[#FF7A00]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {log.description || log.encounterId || 'Manual deduction'}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {log.careCompanionName}
                        {log.ccType && <span className="ml-1 opacity-60">· {log.ccType.replace('_', ' ')}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-800">
                      {isHours
                        ? `${billMinutes}m billed`
                        : `−1 visit`}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {new Date(log.loggedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {recentLogs.length > 8 && (
            <button
              onClick={() => setShowAllLogs(v => !v)}
              className="w-full mt-4 py-3 rounded-2xl bg-[#F4EAE3] text-gray-600 font-black text-[10px] uppercase tracking-widest hover:bg-[#E7DED6] transition-colors"
            >
              {showAllLogs ? 'Show Less' : `View All ${recentLogs.length} Entries`}
            </button>
          )}
        </div>
      )}

      {recentLogs.length === 0 && (
        <div className="bg-white rounded-[28px] p-8 border border-dashed border-[#E7DED6] text-center">
          <TrendingUp size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No consumption logged yet</p>
          <p className="text-xs text-gray-400 mt-1">Activity will appear here once visits are scheduled and completed.</p>
        </div>
      )}
    </div>
  );
}

export default PackageUtilizationPanel;
