/**
 * Field Management & Scheduling Page
 * Split-screen: Left - Care Companion cards with utilization, Right - Timeline schedule
 */

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataCard } from '../components/common/DataCard';
import { UtilizationBar } from '../components/common/UtilizationBar';
import { StatusChip } from '../components/common/StatusChip';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { careCompanionApi, scheduleApi } from '../../services/api';
import type { CareCompanion, VisitBlock } from '../../types';
import { teamApi } from '../../services/api';
import { Clock, Edit2, UserPlus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function FieldManagementPage() {
  const [careCompanions, setCareCompanions] = useState<CareCompanion[]>([]);
  const [todayVisits, setTodayVisits] = useState<VisitBlock[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ccs, visits] = await Promise.all([
      careCompanionApi.getAll(),
      scheduleApi.getTodayVisits(),
    ]);
    setCareCompanions(ccs);
    setTodayVisits(visits);
  };

  const handleAssignCC = async (visitId: string, ccId: string) => {
    try {
      await scheduleApi.assignCareCompanion(visitId, ccId);
      await loadData();
      toast.success('Care Companion assigned successfully');
      setSelectedVisit(null);
    } catch (error) {
      toast.error('Failed to assign Care Companion');
    }
  };

  const timeSlots = [
    { label: 'Morning', range: '08:00 - 12:00', slot: 'morning' },
    { label: 'Afternoon', range: '12:00 - 17:00', slot: 'afternoon' },
    { label: 'Evening', range: '17:00 - 20:00', slot: 'evening' },
  ];

  return (
    <div>
      <PageHeader
        title="Field Management & Scheduling"
        description="Manage Care Companions and schedule daily visits"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Care Companions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Care Companions</h2>
          <div className="space-y-3">
            {careCompanions.map((cc) => (
              <DataCard key={cc.id} title={cc.name} description={cc.phone}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Zone:</span>
                    <span className="font-medium">{cc.zoneId}</span>
                  </div>
                  <UtilizationBar value={cc.utilization} label="Capacity" />
                  <div className="flex flex-wrap gap-1">
                    {cc.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2 py-1 bg-secondary rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Verification:</span>
                      <StatusChip
                        status={cc.backgroundVerification.policeVerificationStatus}
                        variant={
                          cc.backgroundVerification.policeVerificationStatus === 'verified'
                            ? 'success'
                            : 'warning'
                        }
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-[#FF7A00]"
                      onClick={async () => {
                        try {
                          await teamApi.onboardFM({ userId: cc.id, zone: cc.zoneId });
                          toast.success('Field Manager onboarded for team formation');
                        } catch (err) {
                          toast.error('Failed to onboard FM');
                        }
                      }}
                      title="Onboard as Field Manager"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DataCard>
            ))}
          </div>
        </div>

        {/* Right Panel - Today's Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's Schedule</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>March 11, 2026</span>
            </div>
          </div>

          <div className="space-y-6">
            {timeSlots.map((timeSlot) => {
              const slotVisits = todayVisits.filter(v => v.timeSlot === timeSlot.slot);
              return (
                <div key={timeSlot.slot} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{timeSlot.label}</h3>
                      <p className="text-xs text-muted-foreground">{timeSlot.range}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {slotVisits.length} visits
                    </span>
                  </div>

                  <div className="space-y-2">
                    {slotVisits.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No visits scheduled
                      </p>
                    ) : (
                      slotVisits.map((visit) => {
                        const assignedCC = careCompanions.find(cc => cc.id === visit.careCompanionId);
                        return (
                          <div
                            key={visit.id}
                            className="p-3 border border-border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{visit.beneficiaryName}</p>
                                <p className="text-xs text-muted-foreground">{visit.visitType}</p>
                                <p className="text-xs text-muted-foreground">
                                  {visit.startTime} - {visit.endTime}
                                </p>
                              </div>
                              <StatusChip status={visit.status} />
                            </div>

                            {selectedVisit === visit.id ? (
                              <div className="flex items-center gap-2 mt-2">
                                <Select
                                  onValueChange={(ccId) => handleAssignCC(visit.id, ccId)}
                                >
                                  <SelectTrigger className="flex-1 h-8 text-xs">
                                    <SelectValue placeholder="Select Care Companion" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {careCompanions.map((cc) => (
                                      <SelectItem key={cc.id} value={cc.id}>
                                        {cc.name} ({cc.utilization}%)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedVisit(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                                <div className="text-xs">
                                  {assignedCC ? (
                                    <span className="text-success-foreground font-medium">
                                      Assigned to: {assignedCC.name}
                                    </span>
                                  ) : (
                                    <span className="text-destructive">Not assigned</span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedVisit(visit.id)}
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  {assignedCC ? 'Reassign' : 'Assign'}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
