import prisma from '../../core/database';
import { generateUUID, generateEncounterId } from '../../utils/helpers';
import { Prisma } from '@prisma/client';
import { Vitals } from '../../models/visit';

export const createVisit = async (data: {
  beneficiaryId: string;
  careCompanionId: string;
  scheduledTime: Date;
}) => {
  return prisma.visit.create({
    data: { id: generateUUID(), encounterId: generateEncounterId(), ...data },
  });
};

export const getVisit = async (visitId: string) => {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new Error('Visit not found');
  return visit;
};

export const getBeneficiaryVisits = async (beneficiaryId: string, limit = 50) => {
  return prisma.visit.findMany({
    where: { beneficiaryId },
    orderBy: { scheduledTime: 'desc' },
    take: limit,
  });
};

export const getCareCompanionVisits = async (ccId: string, date?: string) => {
  const where: Prisma.VisitWhereInput = { careCompanionId: ccId };
  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    where.scheduledTime = { gte: start, lte: end };
  }
  return prisma.visit.findMany({ where, orderBy: { scheduledTime: 'asc' } });
};

export const checkIn = async (data: { visitId: string; latitude: number; longitude: number }) => {
  return prisma.visit.update({
    where: { id: data.visitId },
    data: {
      checkInTime: new Date(),
      status: 'in_progress',
      locationLat: data.latitude,
      locationLng: data.longitude,
    },
  });
};

export const checkOut = async (data: {
  visitId: string;
  vitals?: Vitals;
  vitalsList?: {
    vitalDefinitionId: string;
    valueNumeric?: number;
    valueNumeric2?: number;
    valueText?: string;
  }[];
  mood?: string;
  medicationAdherence: boolean;
  notes?: string;
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Get the visit to know checkInTime
    const existingVisit = await tx.visit.findUnique({ where: { id: data.visitId } });
    if (!existingVisit) throw new Error('Visit not found');

    const checkOutTime = new Date();
    let durationMinutes = 0;
    if (existingVisit.checkInTime) {
      durationMinutes = Math.round((checkOutTime.getTime() - existingVisit.checkInTime.getTime()) / 60000);
    }

    // 2. Map dynamic vitals to standard fields on the Visit record for backward compatibility
    const visitUpdateData: any = {
      checkOutTime,
      durationMinutes,
      status: 'completed',
      medicationAdherence: data.medicationAdherence,
      extraVitals: data.vitals ? (data.vitals as Prisma.InputJsonValue) : undefined,
      mood: data.mood as any,
      notes: data.notes,
    };

    if (data.vitalsList && Array.isArray(data.vitalsList)) {
      for (const reading of data.vitalsList) {
        const def = await tx.vitalDefinition.findUnique({ where: { id: reading.vitalDefinitionId } });
        if (def) {
          const code = def.code.toUpperCase();
          if ((code === 'BP' || code === 'BLOOD_PRESSURE') && reading.valueNumeric !== undefined && reading.valueNumeric2 !== undefined) {
            visitUpdateData.bpSystolic = Math.round(reading.valueNumeric);
            visitUpdateData.bpDiastolic = Math.round(reading.valueNumeric2);
          } else if (code === 'BP_SYSTOLIC' && reading.valueNumeric !== undefined) {
            visitUpdateData.bpSystolic = Math.round(reading.valueNumeric);
          } else if (code === 'BP_DIASTOLIC' && reading.valueNumeric !== undefined) {
            visitUpdateData.bpDiastolic = Math.round(reading.valueNumeric);
          } else if ((code === 'SPO2' || code === 'OXYGEN_LEVEL') && reading.valueNumeric !== undefined) {
            visitUpdateData.oxygenLevel = reading.valueNumeric;
          } else if ((code === 'TEMP' || code === 'TEMPERATURE') && reading.valueNumeric !== undefined) {
            visitUpdateData.temperature = reading.valueNumeric;
          } else if ((code === 'PULSE' || code === 'HEART_RATE') && reading.valueNumeric !== undefined) {
            visitUpdateData.heartRate = Math.round(reading.valueNumeric);
          } else if ((code === 'WEIGHT' || code === 'BODY_WEIGHT') && reading.valueNumeric !== undefined) {
            visitUpdateData.weight = reading.valueNumeric;
          }
        }
      }
    }

    // 3. Update the Visit
    const visit = await tx.visit.update({
      where: { id: data.visitId },
      data: visitUpdateData,
    });

    // 4. Create Vital Readings if present
    if (data.vitalsList && Array.isArray(data.vitalsList)) {
      const careCompanion = await tx.careCompanion.findUnique({
        where: { id: existingVisit.careCompanionId },
        select: { userId: true }
      });
      const capturedById = careCompanion?.userId || existingVisit.careCompanionId;

      for (const reading of data.vitalsList) {
        const def = await tx.vitalDefinition.findUnique({ where: { id: reading.vitalDefinitionId } });
        let isAbnormal = false;
        
        if (def) {
          if (def.dataType === 'numeric' && reading.valueNumeric !== null && reading.valueNumeric !== undefined) {
            const val = reading.valueNumeric;
            if ((def.normalMin !== null && val < def.normalMin) || (def.normalMax !== null && val > def.normalMax)) {
              isAbnormal = true;
            }
          } else if (def.dataType === 'dual_numeric' && reading.valueNumeric !== null && reading.valueNumeric !== undefined && reading.valueNumeric2 !== null && reading.valueNumeric2 !== undefined) {
            const val1 = reading.valueNumeric;
            const val2 = reading.valueNumeric2;
            if (
              (def.normalMin !== null && val1 < def.normalMin) || 
              (def.normalMax !== null && val1 > def.normalMax) ||
              (def.normalMin2 !== null && val2 < def.normalMin2) ||
              (def.normalMax2 !== null && val2 > def.normalMax2)
            ) {
              isAbnormal = true;
            }
          } else if (def.dataType === 'boolean' && reading.valueText !== undefined && reading.valueText !== null) {
            const isTrue = reading.valueText.toLowerCase() === 'true' || reading.valueText.toLowerCase() === 'yes';
            if (def.booleanAlertValue !== null && isTrue === def.booleanAlertValue) {
              isAbnormal = true;
            }
          } else if (def.dataType === 'text' && reading.valueText !== undefined && reading.valueText !== null) {
            if (def.alertOptions.includes(reading.valueText)) {
              isAbnormal = true;
            }
          }
        }

        await tx.vitalReading.create({
          data: {
            id: generateUUID(),
            beneficiaryId: visit.beneficiaryId,
            vitalDefinitionId: reading.vitalDefinitionId,
            encounterId: visit.id,
            valueNumeric: reading.valueNumeric !== undefined ? reading.valueNumeric : null,
            valueNumeric2: reading.valueNumeric2 !== undefined ? reading.valueNumeric2 : null,
            valueText: reading.valueText || null,
            isAbnormal,
            capturedById,
            captureMethod: 'manual',
          }
        });
      }
    }

    // 3. Deduct from Subscription
    if (durationMinutes > 0) {
      const hoursConsumed = durationMinutes / 60;
      const activeSubscription = await tx.subscription.findFirst({
        where: { beneficiaryId: visit.beneficiaryId, isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (activeSubscription && activeSubscription.hoursTotal !== null) {
        const balanceBefore = activeSubscription.hoursTotal - activeSubscription.hoursUsed;
        const balanceAfter = Math.max(0, balanceBefore - hoursConsumed);

        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            hoursUsed: activeSubscription.hoursUsed + hoursConsumed
          }
        });

        const existingLog = await tx.packageHoursLog.findUnique({
          where: { visitId: visit.id }
        });

        if (!existingLog) {
          await tx.packageHoursLog.create({
            data: {
              subscriptionId: activeSubscription.id,
              beneficiaryId: visit.beneficiaryId,
              visitId: visit.id,
              hoursConsumed,
              balanceBefore,
              balanceAfter,
              description: `Visit completed by Care Companion. Duration: ${durationMinutes} mins.`
            }
          });
        } else {
          await tx.packageHoursLog.update({
            where: { id: existingLog.id },
            data: {
              hoursConsumed,
              balanceBefore,
              balanceAfter,
              description: `Visit completed by Care Companion. Duration: ${durationMinutes} mins. (Re-run)`
            }
          });
        }
      }
    }

    // 4. Update emotional score if mood is sad/depressed
    if (data.mood === 'sad' || data.mood === 'depressed') {
      await tx.beneficiary.update({
        where: { id: visit.beneficiaryId },
        data: { emotionalScore: data.mood === 'sad' ? 5.0 : 3.0 },
      });
    }

    // 5. Create Medication Adherence records if present
    if ((data as any).medicationsList && Array.isArray((data as any).medicationsList)) {
      const careCompanion = await tx.careCompanion.findUnique({
        where: { id: existingVisit.careCompanionId },
        select: { userId: true }
      });
      const recordedBy = careCompanion?.userId || existingVisit.careCompanionId;

      for (const item of (data as any).medicationsList) {
        await tx.medicationAdherence.deleteMany({
          where: {
            visitId: visit.id,
            medicationId: item.medicationId
          }
        });

        await tx.medicationAdherence.create({
          data: {
            beneficiaryId: visit.beneficiaryId,
            medicationId: item.medicationId,
            visitId: visit.id,
            scheduledTime: new Date(),
            taken: item.taken,
            takenTime: item.taken ? new Date() : null,
            recordedBy
          }
        });
      }
    }

    return visit;
  });
};

export const rateVisit = async (data: { visitId: string; rating: number; feedback?: string }) => {
  if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be between 1 and 5');
  return prisma.visit.update({
    where: { id: data.visitId },
    data: { rating: data.rating, feedback: data.feedback },
  });
};

export const getCareCompanionSchedule = async (userId: string) => {
  const cc = await prisma.user.findUnique({
    where: { id: userId },
    include: { careCompanionProfile: true },
  });

  if (!cc || !cc.careCompanionProfile) {
    throw new Error('Care Companion profile not found');
  }

  const ccId = cc.careCompanionProfile.id;

  const visits = await prisma.visit.findMany({
    where: {
      careCompanionId: ccId,
      status: { in: ['scheduled', 'in_progress'] },
    },
    include: {
      beneficiary: true,
    },
    orderBy: {
      scheduledTime: 'asc',
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfTomorrow = new Date(endOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

  return visits.map((v) => {
    const scheduledTime = new Date(v.scheduledTime);
    let tabType = 'Upcoming';

    if (scheduledTime >= startOfToday && scheduledTime <= endOfToday) {
      tabType = 'Today';
    } else if (scheduledTime >= startOfTomorrow && scheduledTime <= endOfTomorrow) {
      tabType = 'Tomorrow';
    }

    const ben = v.beneficiary;
    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const fullAddress = [ben?.flatPlot, ben?.streetArea, ben?.city]
      .filter(Boolean)
      .join(', ') || 'Address not specified';

    return {
      id: v.id,
      patientName: ben?.name || 'Unknown Beneficiary',
      address: fullAddress,
      time: formattedTime,
      distance: '2.1 km',
      type: v.notes ? 'Special Care' : 'Home Visit',
      tabType,
    };
  });
};