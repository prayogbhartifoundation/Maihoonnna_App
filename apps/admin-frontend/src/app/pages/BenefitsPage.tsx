/**
 * Benefits Library Page
 * Create and manage individual benefits (Morning Nurse Visit, Medicine Delivery, etc.)
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { benefitApi, benefitTypeApi } from '../../services/api';
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, BookOpen, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BenefitType { id: string; name: string; iconCode?: string; isActive?: boolean; }
interface Benefit {
  id: string;
  code?: string;
  name: string;
  description?: string;
  isChargeable: boolean;
  unitCost?: number;
  unitLabel?: string;
  defaultUnits: number;
  isActive: boolean;
  displayOrder: number;
  benefitTypeId: string;
  benefitType: BenefitType;
}

const BLANK_FORM = {
  code: '',
  name: '',
  description: '',
  benefitTypeId: '',
  unitLabel: 'per visit',
  defaultUnits: 1,
  isChargeable: false,
  unitCost: undefined as number | undefined
};

const generateBenefitCode = (typeObj?: BenefitType, count: number = 101) => {
  if (!typeObj) return `BNF_${count}`;
  const name = typeObj.name.toUpperCase();
  let prefix = 'BNF';
  if (name.includes('EMERGENCY') || name.includes('AMBULANCE')) prefix = 'EMR';
  else if (name.includes('SATHI') || name.includes('COMPANION')) prefix = 'SATHI';
  else if (name.includes('NURSE')) prefix = 'NURS';
  else if (name.includes('TELE') || name.includes('DOCTOR')) prefix = 'DOC';
  else if (name.includes('PHYSIO')) prefix = 'PHY';
  else if (name.includes('LAB') || name.includes('TEST')) prefix = 'LAB';
  else if (name.includes('PHARMACY') || name.includes('MED')) prefix = 'MED';
  else prefix = name.substring(0, 4).replace(/[^A-Z]/g, '');

  return `${prefix}_${count}`;
};

const STANDARD_UNITS = [
  { value: 'per hour', label: 'Per Hour' },
  { value: 'per visit', label: 'Per Visit' },
  { value: 'per session', label: 'Per Session' },
  { value: 'per test', label: 'Per Test' },
  { value: 'per trip', label: 'Per Trip' },
  { value: 'per consult', label: 'Per Consult' },
  { value: 'per order', label: 'Per Order' },
];

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Benefit | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterTypeId, setFilterTypeId] = useState('all');
  const [form, setForm] = useState(BLANK_FORM);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([benefitApi.getAll(), benefitTypeApi.getAll()]);
      setBenefits(b);
      setBenefitTypes(t);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = benefitTypes.find(t => t.id === typeId);
    const count = 100 + benefits.length + 1;
    const autoCode = generateBenefitCode(selectedType, count);
    setForm(f => ({
      ...f,
      benefitTypeId: typeId,
      code: autoCode,
    }));
  };

  const openNewForm = () => {
    setEditing(null);
    const defaultType = benefitTypes.find(t => t.isActive !== false) || benefitTypes[0];
    const typeId = defaultType ? defaultType.id : '';
    const count = 100 + benefits.length + 1;
    const autoCode = generateBenefitCode(defaultType, count);

    setForm({
      code: autoCode,
      name: '',
      description: '',
      benefitTypeId: typeId,
      unitLabel: 'per visit',
      defaultUnits: 1,
      isChargeable: false,
      unitCost: undefined
    });
    setShowForm(true);
  };

  const openEdit = (b: Benefit) => {
    setEditing(b);
    const selectedType = benefitTypes.find(t => t.id === b.benefitTypeId);
    const count = 100 + benefits.length + 1;
    const autoCode = generateBenefitCode(selectedType, count);

    setForm({
      code: b.code && b.code.trim() !== '' ? b.code : autoCode,
      name: b.name,
      description: b.description ?? '',
      benefitTypeId: b.benefitTypeId,
      unitLabel: b.unitLabel ?? 'per visit',
      defaultUnits: b.defaultUnits,
      isChargeable: b.isChargeable,
      unitCost: b.unitCost
    });
    setShowForm(true);
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(BLANK_FORM); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.benefitTypeId) return toast.error('Name and type are required');
    setSaving(true);
    try {
      const payload = { ...form, unitCost: form.isChargeable ? form.unitCost : undefined };
      if (editing) {
        await benefitApi.update(editing.id, payload);
        toast.success('Benefit updated');
      } else {
        await benefitApi.create(payload as any);
        toast.success('Benefit created');
      }
      resetForm();
      await load();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (b: Benefit) => {
    try {
      await benefitApi.update(b.id, { isActive: !b.isActive });
      toast.success(`${b.name} ${b.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = filterTypeId === 'all' ? benefits : benefits.filter(b => b.benefitTypeId === filterTypeId);
  const grouped = filtered.reduce<Record<string, Benefit[]>>((acc, b) => {
    const key = b.benefitType?.name ?? 'Other';
    acc[key] = [...(acc[key] ?? []), b];
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Benefits Library"
        description="Manage individual benefits available to include in subscription packages"
        action={
          !showForm && (
            <Button onClick={openNewForm} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Benefit
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-lg">
          <CardContent className="p-5 space-y-4 mt-2">
            <h3 className="font-semibold text-base">{editing ? 'Edit Benefit' : 'New Benefit'}</h3>
            <div className="space-y-1">
              <Label>Benefit Type *</Label>
              <Select value={form.benefitTypeId} onValueChange={handleTypeChange}>
                <SelectTrigger className="bg-input-background">
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {benefitTypes.filter(t => t.isActive !== false).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.iconCode} {t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Benefit ID / Code (Auto-Generated)</Label>
                <span className="text-[11px] text-muted-foreground">Ex: EMR_101 for Emergency</span>
              </div>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. EMR_101"
                className="font-mono uppercase font-medium bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning Nurse Visit" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Unit Type *</Label>
                <Select value={form.unitLabel} onValueChange={v => setForm(f => ({ ...f, unitLabel: v }))}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select unit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Default Units</Label>
                <Input type="number" value={form.defaultUnits} onChange={e => setForm(f => ({ ...f, defaultUnits: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm(f => ({ ...f, isChargeable: !f.isChargeable }))}
                className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.isChargeable ? 'bg-primary justify-end' : 'bg-gray-200 justify-start'}`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
              </button>
              <span className="text-sm font-medium">Chargeable benefit</span>
            </div>
            {form.isChargeable && (
              <div className="space-y-1">
                <Label>Unit Price (₹)</Label>
                <Input type="number" value={form.unitCost ?? ''} onChange={e => setForm(f => ({ ...f, unitCost: Number(e.target.value) }))} placeholder="e.g. 800" />
                <p className="text-[11px] text-muted-foreground">Updating price updates pricing unit without forcing benefit version changes.</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {editing ? 'Update Benefit' : 'Create Benefit'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setFilterTypeId('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterTypeId === 'all' ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
        >
          All
        </button>
        {benefitTypes.map(t => (
          <button
            key={t.id}
            onClick={() => setFilterTypeId(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filterTypeId === t.id ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50'}`}
          >
            {t.iconCode} {t.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading benefits…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No benefits yet</p>
          <p className="text-sm mt-1">Add your first benefit to the library</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([typeName, items]) => (
            <div key={typeName}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{typeName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(b => (
                  <Card key={b.id} className={!b.isActive ? 'opacity-60 bg-gray-50 border-dashed' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {b.code && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {b.code}
                              </span>
                            )}
                            <h4 className="font-medium text-sm leading-snug">{b.name}</h4>
                          </div>
                        </div>
                        {b.isChargeable && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ml-2">
                            <DollarSign className="w-3 h-3" /> {b.unitCost ? `₹${b.unitCost}` : 'Paid'}
                          </span>
                        )}
                      </div>
                      {b.description && <p className="text-xs text-muted-foreground mb-2">{b.description}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Default: <strong>{b.defaultUnits}</strong> {b.unitLabel ?? 'unit'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                          {b.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3 pt-2 border-t">
                        <Button size="sm" variant="outline" onClick={() => openEdit(b)} className="h-6 px-2 text-xs">
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={b.isActive ? 'ghost' : 'outline'}
                          onClick={() => toggleActive(b)}
                          className={`h-6 px-2 text-xs ${b.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-green-700 hover:bg-green-50'}`}
                        >
                          {b.isActive ? <ToggleRight className="w-3 h-3 mr-1 text-green-600" /> : <ToggleLeft className="w-3 h-3 mr-1 text-gray-400" />}
                          {b.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
