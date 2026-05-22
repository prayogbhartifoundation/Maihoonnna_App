import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

export interface FilterState {
  search: string;
  searchBy?: string;
  [key: string]: string | number | undefined;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface DataFilterProps {
  onFilterChange: (filters: FilterState) => void;
  searchPlaceholder?: string;
  dropdownFilters?: FilterOption[];
  searchByOptions?: { label: string; value: string }[];
  debounceMs?: number;
}

const DataFilter: React.FC<DataFilterProps> = ({
  onFilterChange,
  searchPlaceholder = "Search...",
  dropdownFilters = [],
  searchByOptions = [],
  debounceMs = 500
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [localSearchBy, setLocalSearchBy] = useState<string>('all');
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allOptions = [{ label: 'All', value: 'all' }, ...searchByOptions];
  const activeOption = allOptions.find(opt => opt.value === localSearchBy) || allOptions[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        search: localSearch,
        searchBy: localSearchBy === 'all' ? '' : localSearchBy,
        ...localFilters
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, localSearchBy, localFilters, debounceMs, onFilterChange]);

  const handleClearAll = () => {
    setLocalSearch('');
    setLocalSearchBy('all');
    setLocalFilters({});
    setIsDropdownOpen(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Integrated Search Group (Amazon/Flipkart Style) */}
        <div className="relative flex-1 flex items-stretch bg-white border border-[#E7DED6] rounded-[20px] shadow-sm hover:shadow-md transition-all focus-within:border-[#FF7A00] focus-within:ring-2 focus-within:ring-[#FF7A00]/10 overflow-visible group h-14 w-full">
          
          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-full px-5 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors border-r border-[#E7DED6] bg-gray-50/50 rounded-l-[20px] hover:bg-gray-100/50"
            >
              <span className="whitespace-nowrap">{activeOption.label}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E7DED6] rounded-2xl shadow-xl z-[100] py-2 animate-in fade-in slide-in-from-top-2">
                {allOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setLocalSearchBy(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                      localSearchBy === option.value
                        ? 'bg-[#FFF5EE] text-[#FF7A00] font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Content */}
          <div className="relative flex-1 flex items-center px-4">
            <Search className="text-gray-400 mr-3" size={18} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium placeholder:text-gray-400 placeholder:font-normal h-full"
            />
            
            {(localSearch || localSearchBy !== 'all' || Object.keys(localFilters).length > 0) && (
              <button
                onClick={handleClearAll}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                title="Clear All"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        {dropdownFilters.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {dropdownFilters.map((filter) => (
              <select
                key={filter.key}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                value={localFilters[filter.key] || ''}
                className="px-4 py-3 bg-white border border-[#E7DED6] rounded-[20px] text-sm font-bold text-gray-600 focus:outline-none focus:border-[#FF7A00] shadow-sm transition-all h-14 min-w-[140px]"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFilter;
