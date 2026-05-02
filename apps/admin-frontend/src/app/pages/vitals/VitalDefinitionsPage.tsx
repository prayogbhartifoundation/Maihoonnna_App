/**
 * Vital Definitions Page — Full CRUD
 * Admin-managed catalog of all supported vitals
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { vitalApi } from '../../../services/api';
import {
  Plus, Search, Activity, Heart, Thermometer, Scale, Droplets,
  Edit2, Trash2, ToggleLeft, ToggleRight, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VitalDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string | null;
  dataType: string;
  normalMin: number | null;
  normalMax: number | null;
  displayOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

const EMPTY_FORM = {
  code: '',
  name: '',
  unit: '',
  description: '',
  dataType: 'numeric',
  normalMin: '',
  normalMax: '',
  displayOrder: '0',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getVitalIcon = (code: string) => {
  if (code.includes('BP') || code === 'PULSE') return <Heart className="w-4 h-4" />;
  if (code === 'SPO2') return <Activity className="w-4 h-4" />;
  if (code === 'TEMP') return <Thermometer className="w-4 h-4" />;
  if (code === 'WEIGHT') return <Scale className="w-4 h-4" />;
  if (code.includes('GLUCOSE') || code.includes('BLOOD')) return <Droplets className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
};

const getIconBg = (code: string) => {
  if (code === 'SPO2') return 'bg-emerald-100 text-emerald-600';
  if (code.includes('BP')) return 'bg-rose-100 text-rose-600';
  if (code === 'TEMP') return 'bg-orange-100 text-orange-600';
  if (code === 'PULSE') return 'bg-blue-100 text-blue-600';
  if (code.includes('GLUCOSE')) return 'bg-purple-100 text-purple-600';
  if (code === 'WEIGHT') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-600';
};

const TYPE_COLORS: Record<string, string> = {
  numeric: 'bg-blue-50 text-blue-700',
  dual_numeric: 'bg-purple-50 text-purple-700',
  text: 'bg-amber-50 text-amber-700',
  boolean: 'bg-slate-50 text-slate-700',
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

function Modal({ open, onClose, children, title, subtitle }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VitalDefinitionsPage() {
  const [vitals, setVitals] = useState<VitalDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VitalDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VitalDefinition | null>(null);
  const [toggleTarget, setToggleTarget] = useState<VitalDefinition | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vitalApi.getAll();
      setVitals(data);
    } catch {
      toast.error('Failed to load vital definitions');
    } finally {
      setLoading(false);
    }
  };

  // ── Open Add modal ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  // ── Open Edit modal ─────────────────────────────────────────────────────────
  const openEdit = (v: VitalDefinition) => {
    setEditTarget(v);
    setForm({
      code: v.code,
      name: v.name,
      unit: v.unit || '',
      description: v.description || '',
      dataType: v.dataType,
      normalMin: v.normalMin !== null ? String(v.normalMin) : '',
      normalMax: v.normalMax !== null ? String(v.normalMax) : '',
      displayOrder: String(v.displayOrder),
    });
    setFormOpen(true);
  };

  // ── Save (Add or Edit) ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.dataType) {
      toast.error('Code, Name and Type are required');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        unit: form.unit.trim() || null,
        description: form.description.trim() || null,
        dataType: form.dataType,
        normalMin: form.normalMin !== '' ? parseFloat(form.normalMin) : null,
        normalMax: form.normalMax !== '' ? parseFloat(form.normalMax) : null,
        displayOrder: parseInt(form.displayOrder) || 0,
      };

      if (editTarget) {
        await vitalApi.update(editTarget.id, payload);
        toast.success(`"${payload.name}" updated successfully`);
      } else {
        await vitalApi.create(payload);
        toast.success(`"${payload.name}" added to vital definitions`);
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vital');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await vitalApi.remove(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deactivated`);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vital');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Active/Inactive ──────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    try {
      await vitalApi.update(toggleTarget.id, { isActive: !toggleTarget.isActive });
      toast.success(
        `"${toggleTarget.name}" marked as ${!toggleTarget.isActive ? 'Active' : 'Inactive'}`
      );
      setToggleTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = vitals.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || v.dataType === typeFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? v.isActive : !v.isActive);
    return matchSearch && matchType && matchStatus;
  });

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vital definitions"
        description="Admin > Vitals > Vital definitions"
        action={
          <Button
            onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add vital
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total vitals defined', value: vitals.length, color: 'text-orange-500' },
          { label: 'Active', value: vitals.filter(v => v.isActive).length, color: 'text-emerald-600' },
          { label: 'Inactive', value: vitals.filter(v => !v.isActive).length, color: 'text-slate-400' },
          { label: 'Custom vitals', value: vitals.filter(v => !v.isSystem).length, color: 'text-slate-900' },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <h3 className={cn('text-3xl font-bold mt-1', s.color)}>{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vitals..."
                className="pl-9 bg-slate-50 border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm outline-none"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="numeric">Numeric</option>
              <option value="dual_numeric">Dual numeric</option>
              <option value="text">Text</option>
              <option value="boolean">Boolean</option>
            </select>
            <select
              className="bg-slate-50 border-none rounded-md px-3 py-2 text-sm outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="px-6 py-4">Vital Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Nor. Range</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading
                  ? Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                      </td>
                    </tr>
                  ))
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No vitals found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new vital</p>
                      </td>
                    </tr>
                  )
                  : filtered.map(v => (
                    <tr
                      key={v.id}
                      className={cn(
                        'hover:bg-slate-50/60 transition-colors',
                        !v.isActive && 'opacity-60'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0', getIconBg(v.code))}>
                            {getVitalIcon(v.code)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{v.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.isSystem ? 'System vital' : 'Custom vital'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                          {v.code}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <Badge className={cn('font-medium border-none', TYPE_COLORS[v.dataType] || 'bg-slate-50 text-slate-700')}>
                          {v.dataType.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {v.unit || '—'}
                      </td>

                      <td className="px-6 py-4">
                        {v.normalMin !== null && v.normalMax !== null ? (
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{v.normalMin}</span>
                              <span>{v.normalMax}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400/60 rounded-full mx-3" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No fixed range</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge className={cn(
                          'rounded-full text-[11px] border-none',
                          v.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        )}>
                          {v.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(v)}
                            title="Edit vital"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => setToggleTarget(v)}
                            title={v.isActive ? 'Deactivate' : 'Activate'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              v.isActive
                                ? 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            )}
                          >
                            {v.isActive
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(v)}
                            title="Delete vital"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit vital' : 'Add new vital'}
        subtitle={editTarget ? `Editing: ${editTarget.name}` : 'Define a new vital metric for the system'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Code" required>
              <Input
                placeholder="e.g. SPO2"
                className="uppercase"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                disabled={!!editTarget} // code shouldn't change after creation
              />
            </FormField>
            <FormField label="Display Order">
              <Input
                type="number"
                placeholder="0"
                value={form.displayOrder}
                onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Vital Name" required>
            <Input
              placeholder="e.g. Blood Oxygen Saturation"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Data Type" required>
              <select
                className="w-full bg-white border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                value={form.dataType}
                onChange={e => setForm(f => ({ ...f, dataType: e.target.value }))}
              >
                <option value="numeric">Numeric (single value)</option>
                <option value="dual_numeric">Dual Numeric (e.g. BP)</option>
                <option value="text">Text</option>
                <option value="boolean">Boolean (Yes/No)</option>
              </select>
            </FormField>
            <FormField label="Unit">
              <Input
                placeholder="e.g. %, mmHg, °C"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              />
            </FormField>
          </div>

          {(form.dataType === 'numeric' || form.dataType === 'dual_numeric') && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Normal Min">
                <Input
                  type="number"
                  placeholder="e.g. 95"
                  value={form.normalMin}
                  onChange={e => setForm(f => ({ ...f, normalMin: e.target.value }))}
                />
              </FormField>
              <FormField label="Normal Max">
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  value={form.normalMax}
                  onChange={e => setForm(f => ({ ...f, normalMax: e.target.value }))}
                />
              </FormField>
            </div>
          )}

          <FormField label="Description">
            <textarea
              rows={2}
              placeholder="Optional description..."
              className="w-full bg-white border border-input rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add vital'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Toggle Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.isActive ? 'Deactivate vital?' : 'Activate vital?'}
      >
        {toggleTarget && (
          <div className="space-y-4">
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl',
              toggleTarget.isActive ? 'bg-orange-50' : 'bg-emerald-50'
            )}>
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                getIconBg(toggleTarget.code)
              )}>
                {getVitalIcon(toggleTarget.code)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{toggleTarget.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{toggleTarget.code}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              {toggleTarget.isActive
                ? 'This vital will be hidden from care companions. Existing readings will be preserved.'
                : 'This vital will become available to care companions for capture during visits.'}
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setToggleTarget(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className={cn(
                  'flex-1 text-white',
                  toggleTarget.isActive
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                )}
                onClick={handleToggle}
                disabled={saving}
              >
                {saving ? 'Updating…' : toggleTarget.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove vital?"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-900">{deleteTarget.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{deleteTarget.code}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              This vital will be <strong>deactivated</strong> (soft deleted). It won't appear in new
              configurations but existing readings will remain intact.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Removing…' : 'Yes, remove it'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
