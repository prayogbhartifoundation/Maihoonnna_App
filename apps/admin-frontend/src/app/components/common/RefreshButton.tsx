import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  label?: string;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, label = "Refresh", className = "" }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#FF7A00] transition-colors disabled:opacity-50 ${className}`}
    >
      <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
      {label}
    </button>
  );
};
