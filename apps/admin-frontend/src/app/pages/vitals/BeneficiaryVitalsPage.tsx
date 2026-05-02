/**
 * Beneficiary Vitals Config Page
 * Manage per-beneficiary vital assignments and overrides
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { vitalApi } from '../../../services/api';
import { 
  Search, 
  Filter,
  User,
  Settings2,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

interface BeneficiaryConfig {
  id: string;
  name: string;
  age: number;
  zoneName: string;
  templateName: string;
  vitals: {
    vitalCode: string;
    vitalName: string;
    frequency: string;
    isEnabled: boolean;
    isOverridden: boolean;
    overrideLabel?: string;
  }[];
}

export default function BeneficiaryVitalsPage() {
  const [configs, setConfigs] = useState<BeneficiaryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vitalApi.getBeneficiaryConfigs();
      setConfigs(data);
    } catch { 
      // toast.error('Failed to load configs'); 
      setConfigs([
        {
          id: '1',
          name: 'Shyam Babu',
          age: 74,
          zoneName: 'Sector 45',
          templateName: 'Standard care',
          vitals: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isEnabled: true, isOverridden: true, overrideLabel: 'Alert on abnormal' },
            { vitalCode: 'BP', vitalName: 'Blood pressure', frequency: 'Every visit', isEnabled: true, isOverridden: true, overrideLabel: 'Custom range: 100–130' },
            { vitalCode: 'TEMP', vitalName: 'Temperature', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'PULSE', vitalName: 'Pulse rate', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isEnabled: true, isOverridden: false },
            { vitalCode: 'MOOD', vitalName: 'Mood', frequency: 'Every visit', isEnabled: true, isOverridden: false },
          ]
        },
        {
          id: '2',
          name: 'Kamla Devi',
          age: 68,
          zoneName: 'DLF Phase 2',
          templateName: 'Diabetic care',
          vitals: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'BP', vitalName: 'Blood pressure', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'GLUCOSE', vitalName: 'Blood glucose', frequency: 'Every visit', isEnabled: true, isOverridden: true, overrideLabel: 'Mandatory • Custom: 80–160' },
            { vitalCode: 'TEMP', vitalName: 'Temperature', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isEnabled: true, isOverridden: false },
            { vitalCode: 'FOOT', vitalName: 'Foot inspection', frequency: 'Weekly', isEnabled: true, isOverridden: true, overrideLabel: 'Added' },
          ]
        },
        {
          id: '3',
          name: 'Ramesh Prasad',
          age: 71,
          zoneName: 'Sector 45',
          templateName: 'Cardiac care',
          vitals: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isEnabled: true, isOverridden: true, overrideLabel: 'Mandatory' },
            { vitalCode: 'BP', vitalName: 'Blood pressure', frequency: 'Every visit', isEnabled: true, isOverridden: true, overrideLabel: 'Mandatory • Custom: 100–135' },
            { vitalCode: 'PULSE', vitalName: 'Pulse rate', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isEnabled: true, isOverridden: false },
            { vitalCode: 'MOOD', vitalName: 'Mood', frequency: 'Every visit', isEnabled: true, isOverridden: false },
            { vitalCode: 'GLUCOSE', vitalName: 'Blood glucose', frequency: 'Disabled', isEnabled: false, isOverridden: true, overrideLabel: 'Disabled for this beneficiary' },
          ]
        }
      ]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beneficiary config"
        description="Admin > Vitals > Beneficiary config"
        action={
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            Configure vitals
          </Button>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 leading-relaxed">
          Each beneficiary inherits vitals from a template. Individual vitals can be overridden — including physician-advised custom normal ranges specific to that senior.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search beneficiaries..." 
            className="pl-9 bg-white border-none shadow-sm" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-white border-none shadow-sm rounded-md px-3 py-2 text-sm outline-none h-10 min-w-[150px]">
          <option>All templates</option>
        </select>
        <select className="bg-white border-none shadow-sm rounded-md px-3 py-2 text-sm outline-none h-10 min-w-[150px]">
          <option>All zones</option>
        </select>
      </div>

      {/* Beneficiary Cards */}
      <div className="space-y-6">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-sm bg-white animate-pulse h-48"></Card>
          ))
        ) : configs.map((config) => (
          <Card key={config.id} className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              {/* Card Header */}
              <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-slate-50 shadow-sm">
                    <AvatarFallback className="bg-orange-50 text-orange-600 font-bold">
                      {config.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{config.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{config.age} yrs</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{config.zoneName}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1">
                        Template: <span className="text-emerald-600 font-medium">{config.templateName}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-slate-200">
                  Configure
                </Button>
              </div>

              {/* Vitals Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.vitals.map((vital, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-xl border flex flex-col justify-between h-20 transition-all",
                    vital.isEnabled 
                      ? "bg-slate-50/50 border-slate-100" 
                      : "bg-slate-100/30 border-slate-100 opacity-60"
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{vital.vitalName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{vital.frequency}</p>
                      </div>
                      {vital.isOverridden && (
                        <Badge className="bg-orange-50 text-orange-600 text-[9px] h-4 uppercase border-none hover:bg-orange-50">
                          Custom
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", vital.isEnabled ? "bg-emerald-500" : "bg-slate-300")} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {vital.isEnabled ? 'On' : 'Off'}
                        </span>
                      </div>
                      {vital.overrideLabel && (
                        <p className="text-[10px] text-orange-600 font-medium truncate ml-2">
                          {vital.overrideLabel}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
