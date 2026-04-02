/**
 * Benefit Types Management Page
 * Create and manage benefit categories (Nurse, Pharmacy, Physio, etc.)
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { benefitTypeApi } from '../../services/api';
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface BenefitType {
  id: string;
  name: string;
  description?: string;
  iconCode?: string;
  displayOrder: number;
  isActive: boolean;
  _count?: { benefits: number };
}

const ICON_OPTIONS = ['🏥', '💊', '🧑‍⚕️', '🧪', '🚑', '📞', '🏋️', '🩺', '🛒', '❤️'];

export default function BenefitTypesPage() {
  const [types, setTypes] = useState<BenefitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BenefitType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconCode, setIconCode] = useState('🏥');
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await benefitTypeApi.getAll();
      setTypes(data);
    } catch {
      toast.error('Failed to load benefit types');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (type: BenefitType) => {
    setEditing(type);
    setName(type.name);
    setDescription(type.description ?? '');
    setIconCode(type.iconCode ?? '🏥');
    setDisplayOrder(type.displayOrder);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setDescription('');
    setIconCode('🏥');
    setDisplayOrder(0);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editing) {
        await benefitTypeApi.update(editing.id, { name, description, iconCode, displayOrder });
        toast.success('Benefit type updated');
      } else {
        await benefitTypeApi.create({ name, description, iconCode, displayOrder });
        toast.success('Benefit type created');
      }
      resetForm();
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (type: BenefitType) => {
    try {
      await benefitTypeApi.update(type.id, { isActive: !type.isActive });
      toast.success(`${type.name} ${type.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      <PageHeader
        title="Benefit Types"
        description="Manage the categories of benefits offered (Nurse, Pharmacy, Lab Test, etc.)"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Benefit Type
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6 max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">{editing ? 'Edit Benefit Type' : 'New Benefit Type'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="bt-name">Name *</Label>
              <Input id="bt-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nurse, Pharmacy" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bt-desc">Description</Label>
              <Input id="bt-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setIconCode(icon)}
                    className={`text-2xl p-1.5 rounded-lg border-2 transition-all ${iconCode === icon ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bt-order">Display Order</Label>
              <Input id="bt-order" type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} className="w-28" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-primary">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading benefit types…
        </div>
      ) : types.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No benefit types yet</p>
          <p className="text-sm mt-1">Add your first benefit type to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(type => (
            <Card key={type.id} className={!type.isActive ? 'opacity-50' : ''}>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-3xl mt-0.5">{type.iconCode ?? '🏥'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{type.name}</h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {type.description && <p className="text-xs text-muted-foreground mb-2">{type.description}</p>}
                  <p className="text-xs text-muted-foreground">{type._count?.benefits ?? 0} benefits</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(type)} className="h-7 px-2 text-xs">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(type)} className="h-7 px-2 text-xs">
                      {type.isActive ? <ToggleRight className="w-3 h-3 mr-1 text-green-600" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                      {type.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
