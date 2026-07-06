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
            beneficiaryId_vitalDefinitionId: {
              beneficiaryId,
              vitalDefinitionId: vitalDefId,
            }
          },
          update: { isActive },
          create: {
            beneficiaryId,
            vitalDefinitionId: vitalDefId,
            isActive,
            frequency: 'every_visit',
          }
        });
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
      vitalConfigs: {
        where: { isActive: true },
        include: {
          vitalDefinition: true
        }
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
      }
    }
  });

  if (!beneficiary) throw new Error('Beneficiary not found');

  // Calculate Hours Used ONLY for benefits labeled as 'hours'
  let hoursUsedPercent = 0;
  const activeSub = beneficiary.subscriptions[0];
  if (activeSub && activeSub.benefitBalances.length > 0) {
    const hourBalances = activeSub.benefitBalances.filter(
      b => b.benefit.unitLabel?.toLowerCase().includes('hour')
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

  // Get latest vital readings from VitalReading table efficiently using Postgres DISTINCT ON
  // Get latest vital readings from VitalReading table efficiently using Postgres DISTINCT ON, filtering out empty entries
  const latestReadingRows = await prisma.vitalReading.findMany({
    where: {
      beneficiaryId: beneficiary.id,
      OR: [
        { valueNumeric: { not: null } },
        { valueNumeric2: { not: null } },
        { valueBoolean: { not: null } },
        {
          AND: [
            { valueText: { not: null } },
            { valueText: { not: '' } },
            { valueText: { not: 'N/A' } }
          ]
        }
      ]
    },
    include: { vitalDefinition: true },
    orderBy: { capturedAt: 'desc' },
    distinct: ['vitalDefinitionId'],
  });

  // Build a lookup: code -> latest VitalReading value
  const latestByCode: Record<string, { v1: number | null; v2: number | null; text: string | null }> = {};
  for (const r of latestReadingRows) {
    const code = r.vitalDefinition?.code?.toUpperCase();
    if (code && !latestByCode[code]) {
      latestByCode[code] = { v1: r.valueNumeric, v2: r.valueNumeric2, text: r.valueText };
    }
  }

  const vitalsData = [];

  const hasVisitsOrVitals = latestReadingRows.length > 0 || pastVisits.length > 0 || !!nextVisit;
  const isDefaultData = !hasVisitsOrVitals;

  // ── Mapping tables for known system vital codes ──────────────────────────────
  // icon, color, and the function to get the current reading value string
  const VITAL_META: Record<string, { icon: string; color: string; getValue: (r: typeof latestByCode) => string | null; trend: string }> = {
    'PULSE':         { icon: 'heart-pulse',      color: '#EF4444', trend: 'Normal', getValue: r => r['PULSE']?.v1        != null ? `${r['PULSE'].v1} bpm`                            : null },
    'HEART_RATE':    { icon: 'heart-pulse',      color: '#EF4444', trend: 'Normal', getValue: r => r['HEART_RATE']?.v1   != null ? `${r['HEART_RATE'].v1} bpm`                       : null },
    'BP':            { icon: 'blood-bag',         color: '#8B5CF6', trend: 'Normal', getValue: r => r['BP']?.v1           != null ? `${r['BP'].v1}/${r['BP'].v2 ?? '?'}`              : null },
    'BLOOD_GLUCOSE': { icon: 'water',             color: '#F59E0B', trend: 'Normal', getValue: r => r['BLOOD_GLUCOSE']?.v1 != null ? `${r['BLOOD_GLUCOSE'].v1} mg/dL`               : null },
    'TEMP':          { icon: 'thermometer',       color: '#06B6D4', trend: 'Normal', getValue: r => r['TEMP']?.v1         != null ? `${r['TEMP'].v1} °C`                             : null },
    'TEMPERATURE':   { icon: 'thermometer',       color: '#06B6D4', trend: 'Normal', getValue: r => r['TEMPERATURE']?.v1  != null ? `${r['TEMPERATURE'].v1} °C`                    : null },
    'SPO2':          { icon: 'air-humidifier',    color: '#10B981', trend: 'Good',   getValue: r => r['SPO2']?.v1         != null ? `${r['SPO2'].v1}%`                              : null },
    'OXYGEN_LEVEL':  { icon: 'air-humidifier',    color: '#10B981', trend: 'Good',   getValue: r => r['OXYGEN_LEVEL']?.v1 != null ? `${r['OXYGEN_LEVEL'].v1}%`                     : null },
    'WEIGHT':        { icon: 'scale-bathroom',    color: '#3B82F6', trend: 'Stable', getValue: r => r['WEIGHT']?.v1       != null ? `${r['WEIGHT'].v1} kg`                          : null },
    'PAIN':          { icon: 'emoticon-sad',      color: '#F97316', trend: 'Normal', getValue: _r => null },
    'RESP':          { icon: 'lungs',             color: '#14B8A6', trend: 'Normal', getValue: _r => null },
    'BP_SYSTOLIC':   { icon: 'arrow-up-bold',     color: '#8B5CF6', trend: 'Normal', getValue: r => r['BP']?.v1           != null ? `${r['BP'].v1} mmHg`                            : null },
    'BP_DIASTOLIC':  { icon: 'arrow-down-bold',   color: '#7C3AED', trend: 'Normal', getValue: r => r['BP']?.v2           != null ? `${r['BP'].v2} mmHg`                            : null },
  };

  // Build vitalsData from the relational vitalConfigs (covers system vitals + custom admin vitals)
  const activeConfigs = (beneficiary as any).vitalConfigs || [];

  // Sort by vitalDefinition.displayOrder so the order matches admin configuration
  activeConfigs.sort((a: any, b: any) =>
    (a.vitalDefinition?.displayOrder ?? 99) - (b.vitalDefinition?.displayOrder ?? 99)
  );

  const uniqueCodes = new Set<string>();
  const uniqueNames = new Set<string>();
  const deduplicatedConfigs = activeConfigs.filter((config: any) => {
    const code = config.vitalDefinition?.code;
    const name = config.vitalDefinition?.name;
    if (!code || !name) return false;
    
    // If we already saw this exact code or this exact visual name, it's a duplicate
    if (uniqueCodes.has(code) || uniqueNames.has(name.toLowerCase())) return false;
    
    uniqueCodes.add(code);
    uniqueNames.add(name.toLowerCase());
    return true;
  });

  for (const config of deduplicatedConfigs) {
    const def = config.vitalDefinition;
    if (!def) continue;

    const meta = VITAL_META[def.code] ?? {
      icon: 'clipboard-pulse',   // generic fallback for custom vitals
      color: '#6B7280',
      trend: 'Normal',
      getValue: (r: any) => {
        const reading = r[def.code?.toUpperCase()];
        if (!reading) return null;
        if (reading.v1 != null && reading.v2 != null) return `${reading.v1}/${reading.v2} ${def.unit || ''}`.trim();
        if (reading.v1 != null) return `${reading.v1} ${def.unit || ''}`.trim();
        if (reading.text) return reading.text;
        return null;
      },
    };

    const rawValue = meta.getValue(latestByCode);
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

  // ── Fallback: if no relational configs exist yet, show any vitals we have readings for ──
  if (activeConfigs.length === 0) {
    for (const code of Object.keys(latestByCode)) {
      const meta = VITAL_META[code] ?? {
        icon: 'clipboard-pulse', color: '#6B7280', trend: 'Normal', getValue: (_r: any) => null
      };
      const reading = latestByCode[code];
      let displayValue = `-- `;
      if (reading.v1 != null && reading.v2 != null) displayValue = `${reading.v1}/${reading.v2}`;
      else if (reading.v1 != null) displayValue = `${reading.v1}`;
      else if (reading.text) displayValue = reading.text;
      vitalsData.push({ label: code, value: displayValue, icon: meta.icon, color: meta.color, trend: meta.trend, code });
    }
  }


  // trendData is now empty — chart trends are served by GET /subscriber/vitals/trends/:beneficiaryId
  const vitalsTrends: any[] = [];

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
    timeline: pastVisits.map((v: any) => {
      // Use check-in time for start time if completed, otherwise fallback to scheduledTime
      const startTime = (v.status === 'completed' && v.checkInTime) ? new Date(v.checkInTime) : new Date(v.scheduledTime);
      
      // Use check-out time for end time if completed, otherwise calculate from scheduledTime + durationMinutes
      const endTime = (v.status === 'completed' && v.checkOutTime) 
        ? new Date(v.checkOutTime) 
        : new Date(startTime.getTime() + (v.durationMinutes || 90) * 60000);

      const datePart = startTime.toISOString().split('T')[0];
      const startStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      // Calculate actual duration strictly from check-in and check-out times
      let durationText = '';
      if (v.status === 'completed' && v.checkInTime && v.checkOutTime) {
        const diffMs = new Date(v.checkOutTime).getTime() - new Date(v.checkInTime).getTime();
        let diffMins = Math.round(diffMs / 60000);
        if (diffMins <= 0 && diffMs > 0) {
          diffMins = 1; // minimum 1 min if check-in/out are not identical
        }
        if (diffMins < 60) {
          durationText = `Duration: ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
        } else {
          const durationHours = parseFloat((diffMins / 60).toFixed(1));
          durationText = `Duration: ${durationHours} hour${durationHours !== 1 ? 's' : ''}`;
        }
      } else {
        const defaultMins = v.durationMinutes || 90;
        const durationHours = parseFloat((defaultMins / 60).toFixed(1));
        durationText = `Duration: ${durationHours} hour${durationHours !== 1 ? 's' : ''}`;
      }

      return {
        id: v.id,
        companionName: v.careCompanion?.name,
        companionPhoto: v.careCompanion?.photo,
        companionPhone: v.careCompanion?.user?.phone || null,
        dateStr: `${datePart} • ${startStr} - ${endStr}`,
        duration: durationText,
        rated: v.subscriberRating !== null && v.subscriberRating !== undefined,
        rating: v.subscriberRating ?? null,          // subscriber's rating of the CC
        beneficiaryRating: v.beneficiaryRating ?? null, // beneficiary's rating of the CC
        activities: v.activitiesDone || [],
        bp: null,
        heartRate: null,
        bloodSugar: null,
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

export const createMedicalRecord = async (
  subscriberId: string,
  beneficiaryId: string,
  data: {
    title: string;
    fileUrl: string;
    mimeType: string;
    fileSizeBytes: number;
  }
) => {
  return prisma.medicalRecord.create({
    data: {
      id: generateUUID(),
      beneficiaryId,
      uploadedBy: subscriberId,
      title: data.title,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      recordType: 'prescription', // default to prescription as in schema
    }
  });
};