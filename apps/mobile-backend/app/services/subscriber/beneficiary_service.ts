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
}) => {
  // Check if user with this phone already exists
  const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingUser) {
    throw new Error("A user with this phone number already exists.");
  }

  const user = await prisma.user.create({
    data: {
      id: generateUUID(),
      phone: data.phone, // Use provided phone instead of generated
      name: data.name,
      role: 'beneficiary',
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
      visits: {
        include: {
          careCompanion: true
        },
        orderBy: { scheduledTime: 'desc' }
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

  // Separate Past and Next Visits
  // Next visit: Earliest scheduled visit in the future
  const upcomingVisits = beneficiary.visits
    .filter(v => v.status === 'scheduled' && v.scheduledTime > now)
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  
  const nextVisit = upcomingVisits[0] || null;

  // Past visits: Completed, Cancelled, or scheduled in the past
  const pastVisits = beneficiary.visits
    .filter(v => (v.status === 'completed' || v.status === 'cancelled' || v.scheduledTime <= now) && v.id !== nextVisit?.id)
    .slice(0, 10);

  // Filter vitals based on tracking flags (Latest Reading)
  const latestReadings = beneficiary.vitalHistory[0] || null;
  const vitalsData = [];
  if (latestReadings) {
    if (beneficiary.trackHeartRate) vitalsData.push({ label: 'Heart Rate', value: `${latestReadings.heartRate || '--'} bpm`, icon: 'heart-pulse', color: '#EF4444', trend: 'Normal' });
    if (beneficiary.trackBloodPressure) vitalsData.push({ label: 'Blood Pressure', value: latestReadings.bpSystolic ? `${latestReadings.bpSystolic}/${latestReadings.bpDiastolic}` : '--', icon: 'blood-bag', color: '#8B5CF6', trend: 'Normal' });
    if (beneficiary.trackBloodSugar) vitalsData.push({ label: 'Blood Sugar', value: `${latestReadings.bloodSugarFasting || latestReadings.bloodSugarPostMeal || '--'} mg/dL`, icon: 'water', color: '#F59E0B', trend: 'Normal' });
    if (beneficiary.trackTemperature) vitalsData.push({ label: 'Temperature', value: `${latestReadings.temperature || '--'} °F`, icon: 'thermometer', color: '#06B6D4', trend: 'Normal' });
    if (beneficiary.trackOxygenSaturation) vitalsData.push({ label: 'Oxygen Saturation', value: `${latestReadings.oxygenLevel || '--'}%`, icon: 'air-humidifier', color: '#10B981', trend: 'Good' });
    if (beneficiary.trackWeight) vitalsData.push({ label: 'Weight', value: `${latestReadings.weight || '--'} kg`, icon: 'scale-bathroom', color: '#3B82F6', trend: 'Stable' });
  }

  // Group vitals by date for Trends (Last 7 Days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const trendHistory = beneficiary.vitalHistory.filter(v => v.recordedAt >= last7Days);
  
  const vitalsTrends = {
    labels: trendHistory.map(v => v.recordedAt.toLocaleDateString([], { month: 'short', day: 'numeric' })).reverse(),
    bpSystolic: trendHistory.map(v => v.bpSystolic || 0).reverse(),
    heartRate: trendHistory.map(v => v.heartRate || 0).reverse(),
    bloodSugar: trendHistory.map(v => (v.bloodSugarFasting || v.bloodSugarPostMeal || 0)).reverse(),
  };

  return {
    ...beneficiary,
    hoursUsedPercent,
    vitalsData,
    vitalsTrends,
    nextVisit: nextVisit ? {
      id: nextVisit.id,
      companionName: nextVisit.careCompanion?.name,
      companionPhoto: nextVisit.careCompanion?.photo,
      dateStr: nextVisit.scheduledTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      timeStr: nextVisit.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    } : null,
    timeline: pastVisits.map(v => ({
      id: v.id,
      companionName: v.careCompanion?.name,
      companionPhoto: v.careCompanion?.photo,
      dateStr: v.scheduledTime.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + v.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: `Duration: ${v.durationMinutes || 0} mins`,
      rated: v.rating !== null,
      rating: v.rating,
      activities: v.activitiesDone,
      bp: v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : null,
      heartRate: v.heartRate ? `${v.heartRate} bpm` : null,
      bloodSugar: v.bloodSugarFasting ? `${v.bloodSugarFasting} mg/dL` : null,
      notes: v.visitSummary || v.notes
    }))
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