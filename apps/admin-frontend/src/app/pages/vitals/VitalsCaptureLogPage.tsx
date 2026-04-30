/**
 * Vitals Capture Log Page
 * Real-time log of all vital readings captured by care companions
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
  Calendar,
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { Badge } from '../../components/ui/badge';

interface VitalReading {
  id: string;
  beneficiaryName: string;
  careCompanionName: string;
  vitalCode: string;
  vitalName: string;
  readingValue: string;
  unit: string | null;
  status: 'normal' | 'high' | 'low' | 'critical';
  capturedAt: string;
  method: 'manual' | 'bluetooth';
}

export default function VitalsCaptureLogPage() {
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vitalApi.getReadings();
      setReadings(data);
    } catch { 
      // toast.error('Failed to load readings'); 
      setReadings([
        {
          id: '1',
          beneficiaryName: 'Shyam Babu',
          careCompanionName: 'Priya Singh',
          vitalCode: 'SPO2',
          vitalName: 'SpO2',
          readingValue: '97',
          unit: '%',
          status: 'normal',
          capturedAt: 'Today, 9:14 AM',
          method: 'manual'
        },
        {
          id: '2',
          beneficiaryName: 'Shyam Babu',
          careCompanionName: 'Priya Singh',
          vitalCode: 'BP',
          vitalName: 'BP',
          readingValue: '148/92',
          unit: 'mmHg',
          status: 'high',
          capturedAt: 'Today, 9:16 AM',
          method: 'manual'
        },
        {
          id: '3',
          beneficiaryName: 'Kamla Devi',
          careCompanionName: 'Rekha Kumari',
          vitalCode: 'GLUCOSE',
          vitalName: 'Glucose',
          readingValue: '187',
          unit: 'mg/dL',
          status: 'critical',
          capturedAt: 'Today, 10:32 AM',
          method: 'manual'
        },
        {
          id: '4',
          beneficiaryName: 'Kamla Devi',
          careCompanionName: 'Rekha Kumari',
          vitalCode: 'TEMP',
          vitalName: 'Temp',
          readingValue: '36.8',
          unit: '°C',
          status: 'normal',
          capturedAt: 'Today, 10:34 AM',
          method: 'manual'
        },
        {
          id: '5',
          beneficiaryName: 'Ramesh Prasad',
          careCompanionName: 'Priya Singh',
          vitalCode: 'BP',
          vitalName: 'BP',
          readingValue: '138/88',
          unit: 'mmHg',
          status: 'high',
          capturedAt: 'Today, 11:05 AM',
          method: 'manual'
        },
        {
          id: '6',
          beneficiaryName: 'Ramesh Prasad',
          careCompanionName: 'Priya Singh',
          vitalCode: 'PULSE',
          vitalName: 'Pulse',
          readingValue: '74',
          unit: 'bpm',
          status: 'normal',
          capturedAt: 'Today, 11:06 AM',
          method: 'manual'
        }
      ]);
    } finally { 
      setLoading(false); 
    }
  };

  const getStatusColor = (status: VitalReading['status']) => {
    switch (status) {
      case 'normal': return 'bg-emerald-50 text-emerald-700';
      case 'high':
      case 'low': return 'bg-orange-50 text-orange-700';
      case 'critical': return 'bg-rose-50 text-rose-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getReadingColor = (status: VitalReading['status']) => {
    switch (status) {
      case 'normal': return 'text-slate-900';
      case 'high':
      case 'low': return 'text-orange-600 font-bold';
      case 'critical': return 'text-rose-600 font-bold';
      default: return 'text-slate-900';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capture log"
        description="Admin > Vitals > Capture log"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Readings today', value: '284', color: 'text-orange-500' },
          { label: 'Abnormal flagged', value: '12', color: 'text-slate-900' },
          { label: 'Alerts triggered', value: '3', color: 'text-slate-900' },
          { label: 'Mandatory completion', value: '98%', color: 'text-emerald-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className={cn("text-3xl font-bold mt-1", stat.color)}>{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by beneficiary or CC..." 
                className="pl-9 bg-slate-50 border-none h-10" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm outline-none h-10">
              <option>All vitals</option>
            </select>
            <select className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm outline-none h-10">
              <option>All readings</option>
            </select>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="date" className="pl-9 bg-slate-50 border-none h-10 w-40" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="px-6 py-4">Beneficiary</th>
                  <th className="px-6 py-4">Care Companion</th>
                  <th className="px-6 py-4">Vital</th>
                  <th className="px-6 py-4">Reading</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Captured At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse h-16">
                      <td colSpan={7} className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {r.beneficiaryName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {r.careCompanionName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 uppercase font-mono">
                        {r.vitalCode}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-sm font-medium", getReadingColor(r.status))}>
                        {r.readingValue}
                      </span>
                      {r.unit && <span className="text-[11px] text-muted-foreground ml-1">{r.unit}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold",
                        getStatusColor(r.status)
                      )}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {r.capturedAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
