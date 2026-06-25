import prisma from '../../core/database';
import { generateUUID, generateRandomPhone } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

// Map free-text frequencies from the mobile UI to valid DB enum values
const frequencyMap: Record<string, string> = {
  'once daily': 'once_daily',
  'daily': 'once_daily',
  'once a day': 'once_daily',
  'twice daily': 'twice_daily',
  'two times daily': 'twice_daily',
  'twice a day': 'twice_daily',
  'thrice daily': 'thrice_daily',
  'three times daily': 'thrice_daily',
  'thrice a day': 'thrice_daily',
  '4 times daily': 'four_times_daily',
  'four times daily': 'four_times_daily',
  'every 6 hours': 'every_6_hours',
  'every 8 hours': 'every_8_hours',
  'every 12 hours': 'every_12_hours',
  'weekly': 'weekly',
  'fortnightly': 'fortnightly',
  'monthly': 'monthly',
  'as needed': 'as_needed',
  'as required': 'as_needed',
  'prn': 'as_needed',
};

const normalizeFrequency = (raw: string): string => {
  if (!raw) return 'once_daily';
  const key = raw.toLowerCase().trim();
  return frequencyMap[key] ?? 'once_daily'; // fallback to once_daily if unrecognized
};

const normalizeGender = (raw: string): string => {
  if (!raw) return 'prefer_not_to_say';
  const g = raw.toLowerCase().trim();
  if (['male', 'female', 'other', 'prefer_not_to_say'].includes(g)) return g;
  return 'prefer_not_to_say';
};

const parseDob = (dobStr: string | null | undefined): Date | null => {
  if (!dobStr) return null;
  const parts = dobStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    } else if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(dobStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};


export const createBeneficiary = async (data: {
  subscriberId: string;
  phone: string; // Add real phone property
  name: string;
  photo?: string;
  age: number;
  gender: string;
  address: string;
  medicalConditions?: string[];
  medications?: string[];
  emergencyContacts?: any[];
  dob?: string;
}) => {
  const phone = data.phone.replace(/\D/g, '').slice(-10);
  // Check if user with this phone already exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("A user with this phone number already exists.");
  }

  const dobDate = parseDob(data.dob);

  const user = await prisma.user.create({
    data: {
      id: generateUUID(),
      phone, // Use normalized 10-digit phone
      name: data.name,
      role: 'beneficiary',
      age: data.age,
      dateOfBirth: dobDate
    },
  });

  return prisma.beneficiary.create({
    data: {
      id: generateUUID(),
      userId: user.id,
      subscriberId: data.subscriberId,
      name: data.name,
      photo: data.photo,
      age: data.age,
      dateOfBirth: dobDate,
      gender: (data.gender.toLowerCase() === 'male' ? 'male' : data.gender.toLowerCase() === 'female' ? 'female' : 'prefer_not_to_say') as any,
      address: data.address,
      emergencyContacts: {
        create: (data.emergencyContacts ?? []).map((c: any) => ({
          id: generateUUID(),
          name: c.name,
          phone: c.phone,
          relationship: c.relation || c.relationship || 'Emergency',
        })),
      },
    },
  });
};

export const getBeneficiary = async (beneficiaryId: string) => {
  const b = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } });
  if (!b) throw new Error('Beneficiary not found');
  return b;
};

export const getSubscriberBeneficiaries = async (subscriberId: string) => {
  return prisma.beneficiary.findMany({ where: { subscriberId } });
};

export const updateBeneficiary = async (beneficiaryId: string, updates: any) => {
  const { medicalConditions, medications, emergencyContacts, vitalsData, ...coreUpdates } = updates;

  return prisma.$transaction(async (tx) => {
    // 1. Update Core Beneficiary Fields
    // Sanitize coreUpdates: remove NaN/undefined and normalize enum-like fields
    const sanitizedCore: any = {};
    Object.entries(coreUpdates).forEach(([key, value]) => {
      if (value === undefined || (typeof value === 'number' && isNaN(value))) return;
      if (key === 'gender') {
        sanitizedCore[key] = normalizeGender(value as string);
      } else {
        sanitizedCore[key] = value;
      }
    });

    const beneficiary = await tx.beneficiary.update({
      where: { id: beneficiaryId },
      data: sanitizedCore,
      include: { user: true }
    });

    // 2. Sync Medications (Replace Completely as per user request)
    if (medications) {
      // Remove old medications
      await tx.medication.deleteMany({
        where: { beneficiaryId }
      });

      // Add new ones
      if (medications.length > 0) {
        await tx.medication.createMany({
          data: medications.map((m: any) => ({
            id: generateUUID(),
            beneficiaryId,
            name: m.name,
            dosage: m.dosage,
            frequency: normalizeFrequency(m.frequency) as any,
            timeSlots: m.timeSlots || [],
            setReminders: !!m.setReminders,
            instructions: m.instructions || '',
            startDate: new Date(), // Default to now if not provided
          }))
        });
      }
    }

    // 3. Sync Medical Conditions
    if (medicalConditions) {
      // Remove current links
      await tx.beneficiaryCondition.deleteMany({
        where: { beneficiaryId }
      });

      // Link new ones
      for (const condName of medicalConditions) {
        // Find or create the master medical condition entry
        let condition = await tx.medicalCondition.findUnique({
          where: { name: condName }
        });

        if (!condition) {
          condition = await tx.medicalCondition.create({
            data: {
              id: generateUUID(),
              name: condName,
              slug: condName.toLowerCase().replace(/\s+/g, '-'),
              category: 'General'
            }
          });
        }

        // Link beneficiary to this condition
        await tx.beneficiaryCondition.create({
          data: {
            id: generateUUID(),
            beneficiaryId,
            conditionId: condition.id
          }
        });
      }
    }

    // 4. Sync Vitals Configuration (Dynamic Relational System)
    if (vitalsData && typeof vitalsData === 'object') {
      const vitalIds = Object.keys(vitalsData);
      
      for (const vitalDefId of vitalIds) {
        const isActive = !!vitalsData[vitalDefId];
        
        await tx.beneficiaryVitalConfig.upsert({
          where: {
            beneficiaryId_vitalDefinitionId_effectiveFrom: {
              beneficiaryId,
              vitalDefinitionId: vitalDefId,
              effectiveFrom: new Date(new Date().setHours(0,0,0,0))
            }
          },
          update: { isActive },
          create: {
            beneficiaryId,
            vitalDefinitionId: vitalDefId,
            isActive,
            frequency: 'every_visit',
            effectiveFrom: new Date(new Date().setHours(0,0,0,0))
          }
        });

        // Also sync back to legacy boolean flags for backward compatibility if needed
        // (Optional: identify the code and update the core tracking flag)
        const def = await tx.vitalDefinition.findUnique({ where: { id: vitalDefId } });
        if (def) {
          const fieldMap: Record<string, string> = {
            'BP': 'trackBloodPressure',
            'PULSE': 'trackHeartRate',
            'BLOOD_GLUCOSE': 'trackBloodSugar',
            'TEMP': 'trackTemperature',
            'SPO2': 'trackOxygenSaturation',
            'WEIGHT': 'trackWeight',
            'PAIN': 'trackPainLevel',
            'RESP': 'trackRespiratoryRate'
          };
          const legacyField = fieldMap[def.code];
          if (legacyField) {
            await tx.beneficiary.update({
              where: { id: beneficiaryId },
              data: { [legacyField]: isActive }
            });
          }
        }
      }
    }

    // 5. Log Activity
    await tx.activityLog.create({
      data: {
        id: generateUUID(),
        userId: beneficiary.subscriberId, // The subscriber who made the update
        type: 'PROFILE',
        action: 'BENEFICIARY_UPDATED',
        details: {
          beneficiaryId,
          beneficiaryName: beneficiary.name,
          updatedFields: Object.keys(updates)
        } as any
      }
    });

    return beneficiary;
  });
};

export const getCareCompanions = async (zone?: string) => {
  return prisma.careCompanion.findMany({
    where: { isAvailable: true, ...(zone ? { zone } : {}) },
  });
};

export const getCareCompanion = async (ccId: string) => {
  const cc = await prisma.careCompanion.findUnique({ where: { id: ccId } });
  if (!cc) throw new Error('Care companion not found');
  return cc;
};

export const getBeneficiaryProfile = async (beneficiaryId: string) => {
  const now = new Date();

  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
    include: {
      conditions: {
        include: {
          condition: true
        }
      },
      medicationList: true,
      medicalRecords: {
        where: { isActive: true },
        orderBy: { recordDate: 'desc' }
      },
      vitalHistory: {
        orderBy: { recordedAt: 'desc' },
        take: 30 // To get enough data for 7-day trend
      },
      subscriptions: {
        where: { isActive: true },
        include: {
          benefitBalances: {
            include: {
              benefit: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      vitalConfigs: {
        where: { isActive: true },
        include: {
          vitalDefinition: true
        }
      }
    }
  });

  if (!beneficiary) throw new Error('Beneficiary not found');

  // Calculate Hours Used ONLY for benefits labeled as 'hours'
  let hoursUsedPercent = 0;
  const activeSub = beneficiary.subscriptions[0];
  if (activeSub && activeSub.benefitBalances.length > 0) {
    const hourBalances = activeSub.benefitBalances.filter(
      b => b.benefit.unitLabel?.toLowerCase() === 'hours' || b.benefit.unitLabel?.toLowerCase() === 'hour'
    );
    const totalUnits = hourBalances.reduce((sum, b) => sum + (b.totalUnits || 0), 0);
    const usedUnits = hourBalances.reduce((sum, b) => sum + (b.usedUnits || 0), 0);
    if (totalUnits > 0) {
      hoursUsedPercent = Math.round((usedUnits / totalUnits) * 100);
    }
  }

  // Query next visit separately (maximum of 1 record)
  const nextVisit = await prisma.visit.findFirst({
    where: {
      beneficiaryId: beneficiary.id,
      status: 'scheduled',
      scheduledTime: { gt: now }
    },
    include: {
      careCompanion: {
        include: {
          user: true
        }
      }
    },
    orderBy: { scheduledTime: 'asc' }
  });

  // Query past visits separately (maximum of 10 records)
  const pastVisits = await prisma.visit.findMany({
    where: {
      beneficiaryId: beneficiary.id,
      OR: [
        { status: 'completed' },
        { status: 'cancelled' },
        { scheduledTime: { lte: now } }
      ],
      ...(nextVisit ? { id: { not: nextVisit.id } } : {})
    },
    include: {
      careCompanion: {
        include: {
          user: true
        }
      }
    },
    orderBy: { scheduledTime: 'desc' },
    take: 10
  });

  // Query visits with vitals separately (no joins required, extremely lightweight)
  const visitsWithVitals = await prisma.visit.findMany({
    where: {
      beneficiaryId: beneficiary.id,
      OR: [
        { bpSystolic: { not: null } },
        { heartRate: { not: null } },
        { bloodSugarFasting: { not: null } },
        { temperature: { not: null } },
        { oxygenLevel: { not: null } },
        { weight: { not: null } }
      ]
    },
    orderBy: { scheduledTime: 'asc' }
  });

  const latestVisitWithVitals = visitsWithVitals[visitsWithVitals.length - 1] || null;

  const latestReadings = latestVisitWithVitals 
    ? {
        heartRate: latestVisitWithVitals.heartRate,
        bpSystolic: latestVisitWithVitals.bpSystolic,
        bpDiastolic: latestVisitWithVitals.bpDiastolic,
        bloodSugarFasting: latestVisitWithVitals.bloodSugarFasting,
        bloodSugarPostMeal: latestVisitWithVitals.bloodSugarPostMeal,
        temperature: latestVisitWithVitals.temperature,
        oxygenLevel: latestVisitWithVitals.oxygenLevel,
        weight: latestVisitWithVitals.weight
      }
    : (beneficiary.vitalHistory[0] || null);

  const vitalsData = [];

  const hasVisitsOrVitals = visitsWithVitals.length > 0 || beneficiary.vitalHistory.length > 0 || pastVisits.length > 0 || !!nextVisit;
  const isDefaultData = !hasVisitsOrVitals;

  // ── Mapping tables for known system vital codes ──────────────────────────────
  // icon, color, and the function to get the current reading value string
  const VITAL_META: Record<string, { icon: string; color: string; getValue: (r: any) => string | null; trend: string }> = {
    'PULSE':         { icon: 'heart-pulse',      color: '#EF4444', trend: 'Normal', getValue: r => r?.heartRate        ? `${r.heartRate} bpm`            : null },
    'BP':            { icon: 'blood-bag',         color: '#8B5CF6', trend: 'Normal', getValue: r => r?.bpSystolic       ? `${r.bpSystolic}/${r.bpDiastolic}` : null },
    'BLOOD_GLUCOSE': { icon: 'water',             color: '#F59E0B', trend: 'Normal', getValue: r => r?.bloodSugarFasting ? `${r.bloodSugarFasting} mg/dL`   : null },
    'TEMP':          { icon: 'thermometer',       color: '#06B6D4', trend: 'Normal', getValue: r => r?.temperature      ? `${r.temperature} °F`             : null },
    'SPO2':          { icon: 'air-humidifier',    color: '#10B981', trend: 'Good',   getValue: r => r?.oxygenLevel      ? `${r.oxygenLevel}%`               : null },
    'WEIGHT':        { icon: 'scale-bathroom',    color: '#3B82F6', trend: 'Stable', getValue: r => r?.weight           ? `${r.weight} kg`                  : null },
    'PAIN':          { icon: 'emoticon-sad',      color: '#F97316', trend: 'Normal', getValue: _r => null },
    'RESP':          { icon: 'lungs',             color: '#14B8A6', trend: 'Normal', getValue: _r => null },
    // Legacy sub-codes from dual BP — only shown if explicitly in vitalConfigs
    'BP_SYSTOLIC':   { icon: 'arrow-up-bold',     color: '#8B5CF6', trend: 'Normal', getValue: r => r?.bpSystolic   ? `${r.bpSystolic} mmHg`   : null },
    'BP_DIASTOLIC':  { icon: 'arrow-down-bold',   color: '#7C3AED', trend: 'Normal', getValue: r => r?.bpDiastolic  ? `${r.bpDiastolic} mmHg`  : null },
  };

  // Build vitalsData from the relational vitalConfigs (covers system vitals + custom admin vitals)
  const activeConfigs = (beneficiary as any).vitalConfigs || [];

  // Sort by vitalDefinition.displayOrder so the order matches admin configuration
  activeConfigs.sort((a: any, b: any) =>
    (a.vitalDefinition?.displayOrder ?? 99) - (b.vitalDefinition?.displayOrder ?? 99)
  );

  for (const config of activeConfigs) {
    const def = config.vitalDefinition;
    if (!def) continue;

    const meta = VITAL_META[def.code] ?? {
      icon: 'clipboard-pulse',   // generic fallback for custom vitals
      color: '#6B7280',
      trend: 'Normal',
      getValue: (_r: any) => null,
    };

    const rawValue = meta.getValue(latestReadings);
    const displayValue = rawValue ?? `-- ${def.unit || ''}`.trim();

    vitalsData.push({
      label:  def.name,
      value:  displayValue,
      icon:   meta.icon,
      color:  meta.color,
      trend:  meta.trend,
      code:   def.code,          // pass code to frontend for future filtering
    });
  }

  // ── Fallback: if no relational configs exist yet (legacy enrollments), use boolean flags ──
  if (activeConfigs.length === 0) {
    if (beneficiary.trackHeartRate || latestReadings?.heartRate) {
      vitalsData.push({ label: 'Heart Rate', value: latestReadings?.heartRate ? `${latestReadings.heartRate} bpm` : '-- bpm', icon: 'heart-pulse', color: '#EF4444', trend: 'Normal', code: 'PULSE' });
    }
    if (beneficiary.trackBloodPressure || latestReadings?.bpSystolic) {
      vitalsData.push({ label: 'Blood Pressure', value: latestReadings?.bpSystolic ? `${latestReadings.bpSystolic}/${latestReadings.bpDiastolic}` : '--', icon: 'blood-bag', color: '#8B5CF6', trend: 'Normal', code: 'BP' });
    }
    if (beneficiary.trackBloodSugar || latestReadings?.bloodSugarFasting) {
      vitalsData.push({ label: 'Blood Sugar', value: latestReadings?.bloodSugarFasting ? `${latestReadings.bloodSugarFasting} mg/dL` : '-- mg/dL', icon: 'water', color: '#F59E0B', trend: 'Normal', code: 'BLOOD_GLUCOSE' });
    }
    if (beneficiary.trackTemperature || latestReadings?.temperature) {
      vitalsData.push({ label: 'Temperature', value: latestReadings?.temperature ? `${latestReadings.temperature} °F` : '-- °F', icon: 'thermometer', color: '#06B6D4', trend: 'Normal', code: 'TEMP' });
    }
    if (beneficiary.trackOxygenSaturation || latestReadings?.oxygenLevel) {
      vitalsData.push({ label: 'Oxygen Saturation', value: latestReadings?.oxygenLevel ? `${latestReadings.oxygenLevel}%` : '--%', icon: 'air-humidifier', color: '#10B981', trend: 'Good', code: 'SPO2' });
    }
    if (beneficiary.trackWeight || latestReadings?.weight) {
      vitalsData.push({ label: 'Weight', value: latestReadings?.weight ? `${latestReadings.weight} kg` : '-- kg', icon: 'scale-bathroom', color: '#3B82F6', trend: 'Stable', code: 'WEIGHT' });
    }
  }


  // Populate trendData from the last 7 visits with vitals
  let trendData: { date: Date | null; bpSystolic: number | null; heartRate: number | null; bloodSugar: number | null }[] = [];
  
  if (visitsWithVitals.length > 0) {
    const lastVisits = visitsWithVitals.slice(-7);
    trendData = lastVisits.map(v => ({
      date: v.scheduledTime,
      bpSystolic: v.bpSystolic || 120,
      heartRate: v.heartRate || 72,
      bloodSugar: v.bloodSugarFasting || v.bloodSugarPostMeal || 110,
    }));
  } else if (beneficiary.vitalHistory.length > 0) {
    const lastHistory = beneficiary.vitalHistory
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
      .slice(-7);
    trendData = lastHistory.map(v => ({
      date: v.recordedAt,
      bpSystolic: v.bpSystolic || 120,
      heartRate: v.heartRate || 72,
      bloodSugar: v.bloodSugarFasting || v.bloodSugarPostMeal || 110,
    }));
  }

  // Pad the array to exactly 7 slots if there is at least one data point
  while (trendData.length > 0 && trendData.length < 7) {
    trendData.push({
      date: null,
      bpSystolic: null,
      heartRate: null,
      bloodSugar: null,
    });
  }

  const vitalsTrends = {
    labels: trendData.map(t => t.date ? t.date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''),
    bpSystolic: trendData.map(t => t.bpSystolic),
    heartRate: trendData.map(t => t.heartRate),
    bloodSugar: trendData.map(t => t.bloodSugar),
  };

  const computedEmotionalScore = isDefaultData ? 100 : (beneficiary.emotionalScore === 8.0 ? 85 : beneficiary.emotionalScore);

  return {
    ...beneficiary,
    emotionalScore: computedEmotionalScore,
    isDefaultData,
    hoursUsedPercent,
    vitalsData,
    vitalsTrends,
    // vitalConfigs is already included via the ...beneficiary spread above (from Prisma include)
    nextVisit: nextVisit ? {
      id: nextVisit.id,
      companionName: nextVisit.careCompanion?.name,
      companionPhoto: nextVisit.careCompanion?.photo,
      companionPhone: nextVisit.careCompanion?.user?.phone || null,
      dateStr: nextVisit.scheduledTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      timeStr: nextVisit.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    } : null,
    timeline: pastVisits.map(v => {
      const startTime = v.scheduledTime;
      const endTime = new Date(startTime.getTime() + (v.durationMinutes || 90) * 60000);
      const datePart = startTime.toISOString().split('T')[0];
      const startStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const durationHours = (v.durationMinutes || 90) / 60;

      return {
        id: v.id,
        companionName: v.careCompanion?.name,
        companionPhoto: v.careCompanion?.photo,
        companionPhone: v.careCompanion?.user?.phone || null,
        dateStr: `${datePart} • ${startStr} - ${endStr}`,
        duration: `Duration: ${durationHours} hours`,
        rated: v.rating !== null,
        rating: v.rating,
        activities: v.activitiesDone || [],
        bp: v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : null,
        heartRate: v.heartRate ? `${v.heartRate} bpm` : null,
        bloodSugar: v.bloodSugarFasting ? `${v.bloodSugarFasting} mg/dL` : null,
        notes: v.visitSummary || v.notes
      };
    })
  };
};

export const updateMedicalRecord = async (recordId: string, data: { title: string }) => {
  return prisma.medicalRecord.update({
    where: { id: recordId },
    data: { title: data.title }
  });
};

export const deleteMedicalRecord = async (recordId: string) => {
  return prisma.medicalRecord.update({
    where: { id: recordId },
    data: { isActive: false } // Soft delete
  });
};