/**
 * Subscriptions Page - Product Factory Wizard
 * Step-by-step package creation for non-tech admins
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { packageApi, benefitApi } from '../../services/api';
import type { SubscriptionPackage, Benefit, PackageBenefit } from '../../types';
import { Plus, Check, ArrowRight, ArrowLeft, Package, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatusChip } from '../components/common/StatusChip';

type WizardStep = 'define' | 'benefits' | 'units' | 'review';

export default function SubscriptionsPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('define');
  const [packageName, setPackageName] = useState('');
  const [duration, setDuration] = useState('12');
  const [activeFrom, setActiveFrom] = useState('2026-01-01');
  const [activeTo, setActiveTo] = useState('2026-12-31');
  const [selectedBenefits, setSelectedBenefits] = useState<Set<string>>(new Set());
  const [benefitUnits, setBenefitUnits] = useState<Record<string, number>>({});
  const [totalCost, setTotalCost] = useState('15000');
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isGlobal, setIsGlobal] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Automatic cost calculation
  useEffect(() => {
    if (!showWizard) return;
    
    let monthlySubtotal = 0;
    Array.from(selectedBenefits).forEach(id => {
      const benefit = benefits.find(b => b.id === id);
      if (benefit && benefit.unitCost) {
        const units = benefitUnits[id] || 0;
        monthlySubtotal += benefit.unitCost * units;
      }
    });

    const months = parseInt(duration) || 0;
    const calculatedTotal = monthlySubtotal * months;
    setTotalCost(String(calculatedTotal));
  }, [selectedBenefits, benefitUnits, duration, benefits, showWizard]);

  const loadData = async () => {
    const [pkgs, bnfs] = await Promise.all([
      packageApi.getAll(),
      benefitApi.getAll({ activeOnly: true }),
    ]);
    setPackages(pkgs);
    setBenefits(bnfs);
  };

  const toggleBenefit = (benefitId: string) => {
    const newSelected = new Set(selectedBenefits);
    if (newSelected.has(benefitId)) {
      newSelected.delete(benefitId);
      const newUnits = { ...benefitUnits };
      delete newUnits[benefitId];
      setBenefitUnits(newUnits);
    } else {
      newSelected.add(benefitId);
      const benefit = benefits.find(b => b.id === benefitId);
      if (benefit) {
        setBenefitUnits({ ...benefitUnits, [benefitId]: benefit.defaultUnits });
      }
    }
    setSelectedBenefits(newSelected);
  };

  const updateUnits = (benefitId: string, units: number) => {
    setBenefitUnits({ ...benefitUnits, [benefitId]: units });
  };

  const handlePublish = async () => {
    const packageBenefits: PackageBenefit[] = Array.from(selectedBenefits).map(benefitId => ({
      benefitId,
      monthlyUnits: benefitUnits[benefitId] || 0,
    }));

    const payload = {
      name: packageName,
      duration: parseInt(duration),
      benefits: packageBenefits,
      totalCost: parseInt(totalCost),
      isActive: true,
      activeFrom: new Date(activeFrom).toISOString(),
      activeTo: activeTo ? new Date(activeTo).toISOString() : null,
      createdBy: 'U001',
      isGlobal,
    };

    try {
      if (editingPackageId) {
        await packageApi.update(editingPackageId, payload);
        toast.success('Package updated successfully!');
      } else {
        await packageApi.create(payload);
        toast.success('Package published successfully!');
      }
      await loadData();
      resetWizard();
    } catch (error) {
      toast.error(editingPackageId ? 'Failed to update package' : 'Failed to publish package');
    }
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name);
    setDuration(String(pkg.duration));
    setTotalCost(String(pkg.totalCost));
    // Date strings for input[type="date"] need to be YYYY-MM-DD
    setActiveFrom(pkg.activeFrom ? pkg.activeFrom.split('T')[0] : '');
    setActiveTo(pkg.activeTo ? pkg.activeTo.split('T')[0] : '');
    setIsGlobal(pkg.isGlobal ?? true);
    
    const selected = new Set<string>();
    const units: Record<string, number> = {};
    
    (pkg.benefits || []).forEach(b => {
      selected.add(b.benefitId);
      units[b.benefitId] = b.monthlyUnits;
    });
    
    setSelectedBenefits(selected);
    setBenefitUnits(units);
    setShowWizard(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this package?')) return;
    try {
      await packageApi.delete(id);
      toast.success('Package deactivated');
      await loadData();
    } catch (error) {
      toast.error('Failed to deactivate package');
    }
  };

  const resetWizard = () => {
    setShowWizard(false);
    setCurrentStep('define');
    setPackageName('');
    setDuration('12');
    setSelectedBenefits(new Set());
    setBenefitUnits({});
    setTotalCost('15000');
    setEditingPackageId(null);
    setIsGlobal(true);
  };

  const steps = [
    { id: 'define', label: 'Define Package', icon: Package },
    { id: 'benefits', label: 'Add Benefits', icon: Plus },
    { id: 'units', label: 'Set Units', icon: Check },
    { id: 'review', label: 'Review', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div>
      <PageHeader
        title="Product Factory"
        description="Create and manage subscription packages"
        action={
          !showWizard && (
            <Button onClick={() => setShowWizard(true)} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create New Package
            </Button>
          )
        }
      />

      {showWizard && (
        <div className="mb-4">
          <Button variant="ghost" onClick={resetWizard} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      )}

      {showWizard ? (
        <div className="max-w-4xl mx-auto">
          {/* Wizard Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isCompleted
                            ? 'border-[#1F8A3E] bg-[#DFF4E6] text-success-foreground'
                            : 'border-border bg-card text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs mt-1 font-medium">{step.label}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 w-20 mx-2 ${isCompleted ? 'bg-[#1F8A3E]' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-6">
              {currentStep === 'define' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Define Package</h2>
                    <p className="text-sm text-muted-foreground">Enter basic package information</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="packageName">Package Name</Label>
                      <Input
                        id="packageName"
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                        placeholder="e.g., Essential Care Package"
                        className="bg-input-background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Months)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="bg-input-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost">Total Cost (₹) — <span className="text-[10px] text-primary uppercase font-bold">Auto-calculated</span></Label>
                        <Input
                          id="cost"
                          type="number"
                          value={totalCost}
                          onChange={(e) => setTotalCost(e.target.value)}
                          className="bg-input-background font-bold text-primary border-primary/20"
                          placeholder="Calculated from benefits..."
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Sum of (Benefit Cost × Units) × {duration} months
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="activeFrom">Active From</Label>
                        <Input
                          id="activeFrom"
                          type="date"
                          value={activeFrom}
                          onChange={(e) => setActiveFrom(e.target.value)}
                          className="bg-input-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activeTo">Active To</Label>
                        <Input
                          id="activeTo"
                          type="date"
                          value={activeTo}
                          onChange={(e) => setActiveTo(e.target.value)}
                          className="bg-input-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'benefits' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Add Benefits</h2>
                    <p className="text-sm text-muted-foreground">Select benefits from the library</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedBenefits.has(benefit.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleBenefit(benefit.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedBenefits.has(benefit.id)}
                            onCheckedChange={() => toggleBenefit(benefit.id)}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{benefit.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {benefit.description}
                            </p>
                            <p className="text-xs text-primary mt-2">
                              Default: {benefit.defaultUnits} {benefit.unitLabel}
                              {benefit.unitCost ? ` • ₹${benefit.unitCost}/${benefit.unitLabel.replace(/s$/, '')}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'units' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Set Units</h2>
                    <p className="text-sm text-muted-foreground">
                      Define monthly units for each selected benefit
                    </p>
                  </div>
                  <div className="space-y-4">
                    {Array.from(selectedBenefits).map(benefitId => {
                      const benefit = benefits.find(b => b.id === benefitId);
                      if (!benefit) return null;
                      return (
                        <div key={benefitId} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{benefit.name}</h3>
                            <p className="text-xs text-muted-foreground">{benefit.unitLabel}</p>
                          </div>
                          <div className="w-48 flex items-center gap-3">
                            {benefit.unitCost && (
                              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                                ₹{benefit.unitCost * (benefitUnits[benefitId] || 0)}
                              </span>
                            )}
                            <Input
                              type="number"
                              value={benefitUnits[benefitId] || 0}
                              onChange={(e) => updateUnits(benefitId, parseInt(e.target.value) || 0)}
                              className="bg-input-background"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Review Package</h2>
                    <p className="text-sm text-muted-foreground">
                      Review and publish your package
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Checkbox
                      id="isGlobal"
                      checked={isGlobal}
                      onCheckedChange={(val) => setIsGlobal(!!val)}
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="isGlobal" className="font-semibold text-orange-900 cursor-pointer text-base">Make this package Global</Label>
                      <p className="text-sm text-orange-700">
                        When checked, this package will be visible to all app users. When unchecked, it will be kept private.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <h3 className="font-semibold text-lg">{packageName}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2 font-medium">{duration} months</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="ml-2 font-medium">₹{totalCost}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Active From:</span>
                          <span className="ml-2 font-medium">{activeFrom}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Active To:</span>
                          <span className="ml-2 font-medium">{activeTo}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Included Benefits:</h4>
                      <div className="space-y-2">
                        {Array.from(selectedBenefits).map(benefitId => {
                          const benefit = benefits.find(b => b.id === benefitId);
                          if (!benefit) return null;
                          return (
                            <div key={benefitId} className="flex items-center justify-between p-3 border border-border rounded">
                              <span className="font-medium">{benefit.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {benefitUnits[benefitId]} {benefit.unitLabel}/month
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'define') {
                      resetWizard();
                    } else {
                      const prevIndex = Math.max(0, currentStepIndex - 1);
                      setCurrentStep(steps[prevIndex].id as WizardStep);
                    }
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 'define' ? 'Cancel' : 'Back'}
                </Button>

                {currentStep === 'review' ? (
                  <Button onClick={handlePublish} className="bg-primary">
                    <Check className="w-4 h-4 mr-2" />
                    Publish Package
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const nextIndex = Math.min(steps.length - 1, currentStepIndex + 1);
                      setCurrentStep(steps[nextIndex].id as WizardStep);
                    }}
                    disabled={
                      (currentStep === 'define' && !packageName) ||
                      (currentStep === 'benefits' && selectedBenefits.size === 0)
                    }
                    className="bg-primary"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="packages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="benefits">Benefits Library</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {pkg.name}
                        {pkg.isGlobal ? (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold uppercase">Global</span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold uppercase">Private</span>
                        )}
                      </CardTitle>
                      <StatusChip status={pkg.isActive ? 'Active' : 'Inactive'} />
                    </div>
                    <CardDescription>{pkg.duration} months</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">₹{pkg.totalCost}</span>
                      <span className="text-sm text-muted-foreground">per package</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Active: {pkg.activeFrom} to {pkg.activeTo}</p>
                    </div>
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {pkg.benefits.length} benefits included
                      </p>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary"
                          onClick={() => handleEdit(pkg)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <Card key={benefit.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{benefit.name}</CardTitle>
                    <CardDescription className="text-xs">{benefit.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Default:</span>
                      <span className="ml-2 font-medium">
                        {benefit.defaultUnits} {benefit.unitLabel}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
