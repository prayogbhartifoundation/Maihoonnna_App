/**
 * Reusable Status Chip Component
 * Displays status indicators with appropriate colors
 */

import React from 'react';
import { cn } from '../ui/utils';

interface StatusChipProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function StatusChip({ status, variant = 'default', className }: StatusChipProps) {
  const variantStyles = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-[#DFF4E6] text-[#1F8A3E]',
    warning: 'bg-[#FFF5EE] text-[#FF7A00]',
    error: 'bg-destructive/10 text-destructive',
    info: 'bg-blue-50 text-blue-700',
  };

  // Auto-detect variant based on status text
  const autoVariant = (() => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('verified') || lowerStatus.includes('active') || lowerStatus.includes('success')) {
      return 'success';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('scheduled') || lowerStatus.includes('in_progress')) {
      return 'warning';
    }
    if (lowerStatus.includes('failed') || lowerStatus.includes('rejected') || lowerStatus.includes('cancelled')) {
      return 'error';
    }
    return variant;
  })();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[autoVariant],
        className
      )}
    >
      {status}
    </span>
  );
}
