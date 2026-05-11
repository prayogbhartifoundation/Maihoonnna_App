/**
 * Field Management — Shared UI Primitives
 * Lightweight, focused building blocks used across all field management views.
 */

import React from 'react';
import { Loader2, Users, AlertCircle } from 'lucide-react';

// ─── Loading State ────────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF7A00]" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({
  message,
  icon,
  action,
}: {
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <div className="opacity-20 mb-1">{icon ?? <Users className="w-12 h-12" />}</div>
      <p className="text-sm font-semibold">{message}</p>
      {action}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm font-semibold text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-bold text-[#FF7A00] border border-[#FF7A00] rounded-lg hover:bg-[#FFF5EE] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  color = 'orange',
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: 'orange' | 'green' | 'blue' | 'purple' | 'red';
}) {
  const colors = {
    orange: 'bg-[#FFF5EE] text-[#FF7A00] border-[#FFE4D3]',
    green:  'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]',
    blue:   'bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]',
    purple: 'bg-[#FAF5FF] text-[#7E22CE] border-[#F3E8FF]',
    red:    'bg-[#FFF1F2] text-[#BE123C] border-[#FFE4E6]',
  };
  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-sm ${colors[color]}`}>
      {icon && (
        <div className="flex items-center gap-2 mb-2 opacity-70">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
      )}
      {!icon && <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{label}</p>}
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

// ─── Availability Badge ────────────────────────────────────────────────────────
export function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tight ${
        isAvailable
          ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7]'
          : 'bg-[#FFF1F2] text-[#E11D48] border-[#FFE4E6]'
      }`}
    >
      {isAvailable ? 'Available' : 'Busy'}
    </span>
  );
}

// ─── CC Load Badge ────────────────────────────────────────────────────────────
export function CCLoadBadge({ count, max = 5 }: { count: number; max?: number }) {
  const full = count >= max;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
        full ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {count}/{max}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black shrink-0`}
    >
      {initial}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-[#F4EAE3]">
      <div className="flex items-center gap-3">
        {icon && <div className="text-[#FF7A00]">{icon}</div>}
        <div>
          <h3 className="text-base font-black text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
