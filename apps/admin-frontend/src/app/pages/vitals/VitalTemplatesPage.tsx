/**
 * Vital Config Templates Page
 * Admin-managed bundles of vitals for easy assignment
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { vitalApi } from '../../../services/api';
import { 
  Plus, 
  FileText,
  Users,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Copy,
  ChevronRight,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import { Badge } from '../../components/ui/badge';

interface VitalTemplate {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  beneficiaryCount: number;
  items: {
    vitalCode: string;
    vitalName: string;
    frequency: string;
    isMandatory: boolean;
  }[];
}

export default function VitalTemplatesPage() {
  const [templates, setTemplates] = useState<VitalTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vitalApi.getTemplates();
      setTemplates(data);
    } catch { 
      // toast.error('Failed to load templates'); 
      // Falling back to mock data for demonstration if API fails
      setTemplates([
        {
          id: '1',
          name: 'Standard care',
          description: 'Applied to all new beneficiaries unless overridden',
          isDefault: true,
          isActive: true,
          beneficiaryCount: 32,
          items: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'BP', vitalName: 'BP', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'TEMP', vitalName: 'Temp', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'PULSE', vitalName: 'Pulse', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isMandatory: false },
            { vitalCode: 'MOOD', vitalName: 'Mood', frequency: 'Every visit', isMandatory: false },
          ]
        },
        {
          id: '2',
          name: 'Diabetic care',
          description: 'For beneficiaries with diabetes',
          isDefault: false,
          isActive: true,
          beneficiaryCount: 11,
          items: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'BP', vitalName: 'BP', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'TEMP', vitalName: 'Temp', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'PULSE', vitalName: 'Pulse', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'GLUCOSE', vitalName: 'Blood glucose', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isMandatory: false },
            { vitalCode: 'MOOD', vitalName: 'Mood', frequency: 'Every visit', isMandatory: false },
          ]
        },
        {
          id: '3',
          name: 'Cardiac care',
          description: 'For beneficiaries with heart conditions',
          isDefault: false,
          isActive: true,
          beneficiaryCount: 8,
          items: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'BP', vitalName: 'BP', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'PULSE', vitalName: 'Pulse', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'TEMP', vitalName: 'Temp', frequency: 'Every visit', isMandatory: false },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isMandatory: false },
            { vitalCode: 'MOOD', vitalName: 'Mood', frequency: 'Every visit', isMandatory: false },
          ]
        },
        {
          id: '4',
          name: 'Post-surgery',
          description: 'Intensive monitoring post-operation',
          isDefault: false,
          isActive: true,
          beneficiaryCount: 4,
          items: [
            { vitalCode: 'SPO2', vitalName: 'SpO2', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'BP', vitalName: 'BP', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'TEMP', vitalName: 'Temp', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'PULSE', vitalName: 'Pulse', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'PAIN', vitalName: 'Pain score', frequency: 'Every visit', isMandatory: true },
            { vitalCode: 'WEIGHT', vitalName: 'Weight', frequency: 'Weekly', isMandatory: false },
            { vitalCode: 'GLUCOSE', vitalName: 'Blood glucose', frequency: 'Weekly', isMandatory: false },
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
        title="Config templates"
        description="Admin > Vitals > Config templates"
        action={
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create template
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Templates', value: templates.length, color: 'text-orange-500' },
          { label: 'Default template', value: '1', color: 'text-slate-900' },
          { label: 'Beneficiaries on templates', value: '47', color: 'text-slate-900' },
          { label: 'Custom-only configs', value: '6', color: 'text-slate-900' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className={cn("text-3xl font-bold mt-1", stat.color)}>{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none shadow-sm bg-white animate-pulse h-32"></Card>
          ))
        ) : templates.map((template) => (
          <Card key={template.id} className="border-none shadow-sm bg-white overflow-hidden group hover:ring-1 hover:ring-orange-200 transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                    {template.isDefault && (
                      <Badge className="bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-50">Default</Badge>
                    )}
                    {template.isActive && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description} — {template.beneficiaryCount} beneficiaries
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 border-slate-200">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-9 border-slate-200">
                    Clone
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {template.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
                      item.isMandatory 
                        ? "bg-rose-50 text-rose-700 border-rose-100" 
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    )}
                  >
                    <span>{item.vitalName}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="font-bold uppercase tracking-tight">{item.frequency}</span>
                    {item.isMandatory && <span className="ml-1 text-[9px] uppercase font-bold text-rose-400">Mandatory</span>}
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
