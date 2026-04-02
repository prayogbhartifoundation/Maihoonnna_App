/**
 * Vitals Library Page
 * Manage vital tracking definitions across the platform
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { vitalApi } from '../../services/api';
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, Activity, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Vital {
  id: string;
  name: string;
  unit: string | null;
  description: string | null;
  iconCode: string | null;
  fieldKey: string;
  displayOrder: number;
  isActive: boolean;
}

const BLANK_FORM = {
  name: '',
  unit: '',
  description: '',
  iconCode: '',
  fieldKey: '',
  displayOrder: 0,
};

export default function VitalsPage() {
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vital | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vitalApi.getAll();
      setVitals(data);
    } catch { toast.error('Failed to load vitals data'); }
    finally { setLoading(false); }
  };

  const openEdit = (v: Vital) => {
    setEditing(v);
    setForm({
      name: v.name,
      description: v.description ?? '',
      unit: v.unit ?? '',
      iconCode: v.iconCode ?? '',
      fieldKey: v.fieldKey,
      displayOrder: v.displayOrder,
    });
    setShowForm(true);
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(BLANK_FORM); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.fieldKey.trim()) return toast.error('Name and Field Key are required');
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await vitalApi.update(editing.id, payload);
        toast.success('Vital updated');
      } else {
        await vitalApi.create(payload);
        toast.success('Vital created');
      }
      resetForm();
      await load();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (v: Vital) => {
    try {
      await vitalApi.update(v.id, { isActive: !v.isActive });
      toast.success(`${v.name} ${v.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div>
      <PageHeader
        title="Vitals Library"
        description="Manage the list of vitals that can be tracked across the platform"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add Vital
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-lg shadow-sm border-border mt-6">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-base mb-2">{editing ? 'Edit Vital' : 'New Vital'}</h3>
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Blood Pressure" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Field Key *</Label>
                <Input value={form.fieldKey} onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))} placeholder="e.g. bloodPressure" disabled={!!editing} className={editing ? "bg-muted text-muted-foreground" : ""} />
                <p className="text-[10px] text-muted-foreground mt-1">Unique camelCase key for database mapping.</p>
              </div>
              <div className="space-y-1">
                <Label>Unit of Measurement</Label>
                <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. mmHg" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description for caregivers" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Icon Code (Optional)</Label>
                <Input value={form.iconCode} onChange={e => setForm(f => ({ ...f, iconCode: e.target.value }))} placeholder="e.g. pulse-outline" />
              </div>
              <div className="space-y-1">
                <Label>Display Order</Label>
                <Input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center mt-6">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading vitals…
        </div>
      ) : vitals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-white rounded-xl border border-dashed border-border mt-6">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-lg font-medium text-foreground">No vital definitions yet</p>
          <p className="text-sm mt-1">Create your first vital metric to track</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {vitals.map(v => (
            <Card key={v.id} className={`shadow-sm border-border transition-all ${!v.isActive ? 'opacity-50 grayscale-[50%]' : 'hover:shadow-md'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-snug tracking-tight text-foreground">{v.name}</h4>
                      <p className="text-[11px] font-mono text-muted-foreground">{v.fieldKey}</p>
                    </div>
                  </div>
                  {v.unit && (
                    <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border/50 shrink-0">
                      {v.unit}
                    </span>
                  )}
                </div>
                
                {v.description && <p className="text-xs text-muted-foreground/80 mb-3 mt-1 leading-relaxed">{v.description}</p>}
                
                <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border/50">
                  <Button size="sm" variant="outline" onClick={() => openEdit(v)} className="h-7 px-3 text-xs flex-1 border-muted hover:bg-secondary">
                    <Pencil className="w-3 h-3 mr-1.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(v)} className="h-7 px-3 text-xs flex-1 bg-muted/50 hover:bg-muted">
                    {v.isActive ? <ToggleRight className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />}
                    {v.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
