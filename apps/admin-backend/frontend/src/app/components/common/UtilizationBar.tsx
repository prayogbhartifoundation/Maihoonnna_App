/**
 * Utilization Bar Component
 * Shows percentage-based utilization with visual bar
 */

import React from 'react';
import { cn } from '../ui/utils';
import { Progress } from '../ui/progress';

interface UtilizationBarProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

export function UtilizationBar({ value, label, className }: UtilizationBarProps) {
  const getColorClass = (val: number) => {
    if (val >= 90) return 'text-destructive';
    if (val >= 75) return 'text-[#FF7A00]';
    return 'text-success-foreground';
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        {label && <span className="text-muted-foreground">{label}</span>}
        <span className={cn('font-medium', getColorClass(value))}>{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
