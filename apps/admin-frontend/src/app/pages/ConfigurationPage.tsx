import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, ShieldAlert, Sliders, CheckCircle } from 'lucide-react';
import { configApi } from '../../services/api';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  group: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

const ConfigurationPage = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await configApi.getAll();
      setConfigs(res);
      
      // Initialize edit values
      const vals: Record<string, string> = {};
      res.forEach((item) => {
        vals[item.key] = item.value;
      });
      setEditValues(vals);
    } catch (err: any) {
      console.error('Fetch configurations error:', err);
      setError(err.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleValueChange = (key: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    const value = editValues[key];
    if (value === undefined || value.trim() === '') {
      alert('Value cannot be empty');
      return;
    }

    // Basic numerical validation depending on keys
    if (['max_cc_per_team', 'max_beneficiary_per_team', 'max_primary_cc', 'max_secondary_cc', 'max_teams_per_zone'].includes(key)) {
      const num = parseInt(value, 10);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid positive integer');
        return;
      }
    } else if (['zone_radius_km', 'region_radius_km'].includes(key)) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        alert('Please enter a valid positive decimal number');
        return;
      }
    }

    try {
      setSavingKey(key);
      setSuccessKey(null);
      await configApi.update(key, { value });
      
      setSuccessKey(key);
      setTimeout(() => {
        setSuccessKey(null);
      }, 3000);
      
      // Refresh configs
      const res = await configApi.getAll();
      setConfigs(res);
    } catch (err: any) {
      alert(err.message || 'Failed to update configuration setting');
    } finally {
      setSavingKey(null);
    }
  };

  // Humanize keys for display
  const humanizeKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/^(max|min|global|default)/, (m) => m.toUpperCase())
      .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
  };

  // Group configurations
  const groups: Record<string, ConfigItem[]> = {};
  configs.forEach((item) => {
    const groupName = item.group || 'General Settings';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(item);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-gray-800 uppercase flex items-center gap-2">
          <Settings className="text-[#FF7A00]" size={28} />
          System Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure operations thresholds, coverage metrics, and capacity parameters dynamically
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 h-64">
          <Loader2 className="animate-spin text-[#FF7A00] mb-4" size={40} />
          <p className="font-bold text-xs uppercase tracking-widest text-gray-400">Loading Configuration...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
          <ShieldAlert className="text-red-500 mx-auto mb-3" size={48} />
          <p className="text-red-800 font-bold mb-2">{error}</p>
          <button
            onClick={fetchConfigs}
            className="text-[#FF7A00] font-black uppercase text-xs tracking-wider underline hover:text-[#e06e00]"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} className="space-y-4">
              <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase pl-1">
                {groupName}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item) => {
                  const isSaving = savingKey === item.key;
                  const isSuccess = successKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition duration-300"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-sm text-gray-700 uppercase tracking-tight">
                            {humanizeKey(item.key)}
                          </h3>
                          <span className="text-[10px] bg-orange-50 text-[#FF7A00] px-2 py-0.5 rounded font-mono font-bold">
                            {item.key}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed font-bold">
                          {item.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="mt-6 flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black uppercase text-gray-400">Setting Value</label>
                          <input
                            type="text"
                            value={editValues[item.key] || ''}
                            onChange={(e) => handleValueChange(item.key, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] outline-none font-bold text-sm transition-all"
                          />
                        </div>
                        
                        <button
                          onClick={() => handleSave(item.key)}
                          disabled={isSaving || editValues[item.key] === item.value}
                          className={`px-4 py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition duration-200 flex items-center gap-1.5 ${
                            isSuccess
                              ? 'bg-green-500 text-white'
                              : isSaving
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : editValues[item.key] === item.value
                              ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              : 'bg-[#FF7A00] text-white hover:bg-[#e06e00] shadow-sm shadow-orange-100'
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle size={14} />
                              Saved
                            </>
                          ) : isSaving ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              Saving
                            </>
                          ) : (
                            <>
                              <Save size={14} />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfigurationPage;
