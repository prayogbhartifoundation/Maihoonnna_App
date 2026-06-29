import prisma from '../../core/database';
import { generateUUID, generateEncounterId, generateVisitCode } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

// â”€â”€â”€ Geo-fencing Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Calculates the straight-line distance between two GPS coordinates using
 * the Haversine formula. Returns distance in meters.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Configurable from .env â€” defaults to 50m (industry standard)
const GEOFENCE_RADIUS_METERS = parseFloat(process.env.GEOFENCE_RADIUS_METERS || '50');

export const createVisit = async (data: {
  beneficiaryId: string;
  careCompanionId: string;
  scheduledTime: Date;
}) => {
  return prisma.visit.create({
    data: { id: generateUUID(), encounterId: generateEncounterId(), visitCode: generateVisitCode(), ...data },
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

export const checkIn = async (data: {
  visitId: string;
  latitude: number;
  longitude: number;
  manualCheckInReason?: string | null;
}) => {
  // 1. Fetch the visit details
  const visit = await prisma.visit.findUnique({
    where: { id: data.visitId },
    select: { beneficiaryId: true, scheduledTime: true, status: true },
  });
  if (!visit) throw new Error('Visit not found');

  if (visit.status === 'completed') {
    throw new Error('Cannot check-in to an already completed visit.');
  }
  if (visit.status === 'cancelled') {
    throw new Error('Cannot check-in to a cancelled visit.');
  }
  if (visit.status === 'missed') {
    throw new Error('Cannot check-in to a missed visit.');
  }

  // Enforce passed date restriction
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const visitScheduledTime = new Date(visit.scheduledTime);
  const startOfScheduledDay = new Date(
    visitScheduledTime.getFullYear(),
    visitScheduledTime.getMonth(),
    visitScheduledTime.getDate()
  );

  if (startOfScheduledDay < startOfToday) {
    throw new Error('Cannot check-in to a visit scheduled for a past date.');
  }

  // 2. Fetch the beneficiary's stored GPS coordinates
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: visit.beneficiaryId },
    select: { latitude: true, longitude: true },
  });

  // 3. Compute geo-distance and determine verification status
  let isGeoVerified = false;
  let geoDistanceMeters: number | null = null;

  const isManualCheckIn = !!(data.manualCheckInReason && data.manualCheckInReason.trim());

  if (beneficiary?.latitude && beneficiary?.longitude) {
    geoDistanceMeters = haversineDistance(
      data.latitude, data.longitude,
      beneficiary.latitude, beneficiary.longitude
    );
    // Only auto-verify if NOT a manual override and within radius
    if (!isManualCheckIn && geoDistanceMeters <= GEOFENCE_RADIUS_METERS) {
      isGeoVerified = true;
    }
  }
  // If beneficiary has no GPS stored, isGeoVerified stays false

  // 4. Update the visit record with all geo fields
  return prisma.visit.update({
    where: { id: data.visitId },
    data: {
      checkInTime: new Date(),
      status: 'in_progress',
      locationLat: data.latitude,
      locationLng: data.longitude,
      checkInLat: data.latitude,
      checkInLng: data.longitude,
      isGeoVerified,
      geoDistanceMeters: geoDistanceMeters !== null ? Math.round(geoDistanceMeters) : null,
      manualCheckInReason: data.manualCheckInReason || null,
    },
  });
};


export const updateVisitDetails = async (data: {
  visitId: string;
  vitals?: any;
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
    const existingVisit = await tx.visit.findUnique({ where: { id: data.visitId } });
    if (!existingVisit) throw new Error('Visit not found');

    const visitUpdateData: any = {
      medicationAdherence: data.medicationAdherence,
      mood: data.mood as any,
      notes: existingVisit.notes?.startsWith('__benefitId:') ? data.notes : (data.notes || existingVisit.notes),
    };


    const visit = await tx.visit.update({
      where: { id: data.visitId },
      data: visitUpdateData,
    });

    if (data.vitalsList && Array.isArray(data.vitalsList)) {
      await tx.vitalReading.deleteMany({ where: { visitId: visit.id } });

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
            visitId: visit.id,
            valueNumeric: reading.valueNumeric !== undefined ? reading.valueNumeric : null,
            valueNumeric2: reading.valueNumeric2 !== undefined ? reading.valueNumeric2 : null,
            valueText: reading.valueText || null,
            valueBoolean: reading.valueText !== undefined && reading.valueText !== null ? (reading.valueText.toLowerCase() === 'true' || reading.valueText.toLowerCase() === 'yes') : null,
            isAbnormal,
            capturedById,
            captureMethod: 'manual',
          }
        });
      }
    }

    if (data.mood) {
      const moodValueMap: Record<string, number> = {
        happy: 100,
        neutral: 80,
        sad: 50,
        anxious: 20,
        depressed: 0
      };

      const moodKey = data.mood.toLowerCase();
      if (moodValueMap[moodKey] !== undefined) {
        const currentMoodScore = moodValueMap[moodKey];
        const beneficiary = await tx.beneficiary.findUnique({
          where: { id: visit.beneficiaryId },
          select: { emotionalScore: true }
        });

        if (beneficiary) {
          const alpha = 0.4;
          let newScore = currentMoodScore;
          // Since the schema default is 8.0 (old 1-10 scale), we treat 8.0 as "no score" on the new 0-100 scale.
          if (beneficiary.emotionalScore !== null && beneficiary.emotionalScore !== 8.0) {
             newScore = alpha * currentMoodScore + (1 - alpha) * beneficiary.emotionalScore;
          }

          await tx.beneficiary.update({
            where: { id: visit.beneficiaryId },
            data: { emotionalScore: newScore },
          });
        }
      }
    }

    if ((data as any).medicationsList && Array.isArray((data as any).medicationsList)) {
      const careCompanion = await tx.careCompanion.findUnique({
        where: { id: existingVisit.careCompanionId },
        select: { userId: true }
      });
      const recordedBy = careCompanion?.userId || existingVisit.careCompanionId;

      for (const item of (data as any).medicationsList) {
        const validUUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!validUUIDRegex.test(item.medicationId)) continue;
        const existingRecord = await tx.medicationAdherence.findFirst({
          where: { visitId: visit.id, medicationId: item.medicationId }
        });
        if (existingRecord) {
          await tx.medicationAdherence.update({
            where: { id: existingRecord.id },
            data: { taken: item.taken, recordedBy }
          });
        } else {
          await tx.medicationAdherence.create({
            data: {
              id: generateUUID(),
              medicationId: item.medicationId,
              beneficiaryId: visit.beneficiaryId,
              visitId: visit.id,
              scheduledTime: new Date(),
              taken: item.taken,
              takenTime: item.taken ? new Date() : null,
              recordedBy
            }
          });
        }
      }
    }

    return visit;
  });
};

export const checkOut = async (data: {
  visitId: string;
  latitude?: number;
  longitude?: number;
  manualCheckOutReason?: string | null;
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

    const isEdit = existingVisit.status === 'completed';

    const checkOutTime = isEdit ? existingVisit.checkOutTime : new Date();
    let durationMinutes = existingVisit.durationMinutes || 0;

    if (!isEdit && existingVisit.checkInTime) {
      durationMinutes = Math.round((checkOutTime!.getTime() - existingVisit.checkInTime.getTime()) / 60000);
    }

    // 2. Map dynamic vitals to standard fields on the Visit record for backward compatibility
    const visitUpdateData: any = {
      checkOutTime,
      durationMinutes,
      status: 'completed',
      medicationAdherence: data.medicationAdherence,
      mood: data.mood as any,
      notes: existingVisit.notes?.startsWith('__benefitId:') ? data.notes : (data.notes || existingVisit.notes),
    };


    // 3. Update the Visit record
    const visit = await tx.visit.update({
      where: { id: data.visitId },
      data: visitUpdateData,
    });

    // 4. Create Vital Readings if present
    if (data.vitalsList && Array.isArray(data.vitalsList)) {
      if (isEdit) {
        await tx.vitalReading.deleteMany({ where: { visitId: visit.id } });
      }

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
            visitId: visit.id,
            valueNumeric: reading.valueNumeric !== undefined ? reading.valueNumeric : null,
            valueNumeric2: reading.valueNumeric2 !== undefined ? reading.valueNumeric2 : null,
            valueText: reading.valueText || null,
            valueBoolean: reading.valueText !== undefined && reading.valueText !== null ? (reading.valueText.toLowerCase() === 'true' || reading.valueText.toLowerCase() === 'yes') : null,
            isAbnormal,
            capturedById,
            captureMethod: 'manual',
          }
        });
      }
    }

    // 5. Deduct from Subscription — minimum 1h billing rule
    if (!isEdit && durationMinutes >= 0) {
      // Billing rule:
      //   < 60 min  → charge exactly 1h  (e.g. 50 min → 1.0h)
      //   >= 60 min → charge actual time  (e.g. 65 min → 1.0833h = "1h 5min")
      const actualMinutes   = durationMinutes;
      const billableMinutes = Math.max(60, actualMinutes);   // floor at 60 min
      const hoursConsumed   = billableMinutes / 60;          // exact float, min 1.0

      const activeSubscription = await tx.subscription.findFirst({
        where: { beneficiaryId: visit.beneficiaryId, isActive: true },
        orderBy: { createdAt: 'desc' },
        include: { benefitBalances: { include: { benefit: true } } }
      });

      if (activeSubscription) {
        // Update quick-access hour counter (exact float: min 1.0h, then actual)
        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            hoursUsed: activeSubscription.hoursUsed + hoursConsumed,
            visitsCompleted: activeSubscription.visitsCompleted + 1
          }
        });

        // Determine which specific benefit (morning/evening/noon nurse) to deduct from
        let targetBenefitId: string | null = null;
        if (existingVisit.notes?.startsWith('__benefitId:')) {
          targetBenefitId = existingVisit.notes.replace('__benefitId:', '').trim();
        }

        let benefitToDeduct = null;
        if (targetBenefitId) {
          benefitToDeduct = activeSubscription.benefitBalances.find(b => b.benefitId === targetBenefitId);
        }

        if (!benefitToDeduct) {
          // Fallback: find any visit-type benefit with remaining balance
          benefitToDeduct = activeSubscription.benefitBalances.find(b =>
            b.benefit.unitLabel && b.benefit.unitLabel.toLowerCase().includes('visit') &&
            (b.totalUnits === -1 || b.usedUnits < b.totalUnits)
          );
        }

        // Idempotency guard â€” don't double-deduct if already logged
        const existingLog = await tx.packageHoursLog.findUnique({
          where: { visitId: visit.id }
        });

        if (benefitToDeduct) {
          // Detect if this benefit is hour-based or visit-count-based
          const isHourBenefit = benefitToDeduct.benefit.unitLabel
            ? benefitToDeduct.benefit.unitLabel.toLowerCase().includes('hour') ||
              benefitToDeduct.benefit.unitLabel.toLowerCase().includes('hr')
            : false;
          // For hour-type benefits, deduct exact float hours; for visit-count, deduct 1
          const unitsToDeduct = isHourBenefit ? hoursConsumed : 1;

          if (!existingLog) {
            await tx.subscriptionBenefitBalance.update({
              where: { id: benefitToDeduct.id },
              data: { usedUnits: benefitToDeduct.usedUnits + unitsToDeduct }
            });
            await tx.packageHoursLog.create({
              data: {
                subscriptionId: activeSubscription.id,
                beneficiaryId: visit.beneficiaryId,
                visitId: visit.id,
                hoursConsumed,
                balanceBefore: benefitToDeduct.usedUnits,
                balanceAfter: benefitToDeduct.usedUnits + unitsToDeduct,
                description: `Visit completed. Actual: ${actualMinutes} min â€” billed as ${hoursConsumed}h (min 1h rule).`
              }
            });
          } else {
            await tx.packageHoursLog.update({
              where: { id: existingLog.id },
              data: {
                hoursConsumed,
                description: `Visit completed. Actual: ${actualMinutes} min â€” billed as ${hoursConsumed}h (Re-run).`
              }
            });
          }
        } else {
          // No specific benefit found â€” log against overall subscription hours
          if (!existingLog) {
            await tx.packageHoursLog.create({
              data: {
                subscriptionId: activeSubscription.id,
                beneficiaryId: visit.beneficiaryId,
                visitId: visit.id,
                hoursConsumed,
                balanceBefore: activeSubscription.hoursTotal !== null ? (activeSubscription.hoursTotal - activeSubscription.hoursUsed) : 0,
                balanceAfter: activeSubscription.hoursTotal !== null ? Math.max(0, (activeSubscription.hoursTotal - activeSubscription.hoursUsed) - hoursConsumed) : 0,
                description: `Visit completed. Actual: ${actualMinutes} min â€” billed as ${hoursConsumed}h (min 1h rule).`
              }
            });
          } else {
            await tx.packageHoursLog.update({
              where: { id: existingLog.id },
              data: {
                hoursConsumed,
                description: `Visit completed. Actual: ${actualMinutes} min â€” billed as ${hoursConsumed}h (Re-run).`
              }
            });
          }
        }
      }
    }

    // 6. Update emotional score based on mood using EWMA
    if (data.mood) {
      const moodValueMap: Record<string, number> = {
        happy: 100,
        neutral: 80,
        sad: 50,
        anxious: 20,
        depressed: 0
      };

      const moodKey = data.mood.toLowerCase();
      if (moodValueMap[moodKey] !== undefined) {
        const currentMoodScore = moodValueMap[moodKey];
        const beneficiary = await tx.beneficiary.findUnique({
          where: { id: visit.beneficiaryId },
          select: { emotionalScore: true }
        });

        if (beneficiary) {
          const alpha = 0.4;
          let newScore = currentMoodScore;
          // Since the schema default is 8.0 (old 1-10 scale), we treat 8.0 as "no score" on the new 0-100 scale.
          if (beneficiary.emotionalScore !== null && beneficiary.emotionalScore !== 8.0) {
             newScore = alpha * currentMoodScore + (1 - alpha) * beneficiary.emotionalScore;
          }

          await tx.beneficiary.update({
            where: { id: visit.beneficiaryId },
            data: { emotionalScore: newScore },
          });
        }
      }
    }

    // 7. Create Medication Adherence records if present
    if ((data as any).medicationsList && Array.isArray((data as any).medicationsList)) {
      const careCompanion = await tx.careCompanion.findUnique({
        where: { id: existingVisit.careCompanionId },
        select: { userId: true }
      });
      const recordedBy = careCompanion?.userId || existingVisit.careCompanionId;

      for (const item of (data as any).medicationsList) {
        // Skip fake medication IDs sent by frontend fallbacks
        const validUUIDRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!validUUIDRegex.test(item.medicationId)) continue;

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

export const autoUpdateMissedVisits = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  try {
    await prisma.visit.updateMany({
      where: {
        status: 'scheduled',
        scheduledTime: {
          lt: startOfToday,
        },
      },
      data: {
        status: 'missed',
      },
    });
  } catch (err) {
    console.error('Error auto-updating missed visits:', err);
  }
};

export const getCareCompanionSchedule = async (userId: string) => {
  await autoUpdateMissedVisits();
  const cc = await prisma.user.findUnique({
    where: { id: userId },
    include: { careCompanionProfile: true },
  });

  if (!cc || !cc.careCompanionProfile) {
    throw new Error('Care Companion profile not found');
  }

  const ccId = cc.careCompanionProfile.id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfTomorrow = new Date(endOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

  const visits = await prisma.visit.findMany({
    where: {
      careCompanionId: ccId,
      OR: [
        {
          status: { in: ['scheduled', 'in_progress'] }
        },
        {
          status: 'completed',
          scheduledTime: { gte: startOfToday }
        }
      ]
    },
    include: {
      beneficiary: true,
    },
    orderBy: {
      scheduledTime: 'asc',
    },
  });

  return visits.map((v) => {
    const scheduledTime = new Date(v.scheduledTime);
    let tabType = 'Upcoming';

    if (scheduledTime < startOfToday) {
      // Past incomplete visits should show on 'Today'
      tabType = 'Today';
    } else if (scheduledTime >= startOfToday && scheduledTime <= endOfToday) {
      tabType = 'Today';
    } else if (scheduledTime >= startOfTomorrow && scheduledTime <= endOfTomorrow) {
      tabType = 'Tomorrow';
    } else if (scheduledTime > endOfTomorrow) {
      tabType = 'Upcoming';
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
      visitCode: v.visitCode,
      patientName: ben?.name || 'Unknown Beneficiary',
      address: fullAddress,
      time: formattedTime,
      distance: '2.1 km',
      type: v.notes ? 'Special Care' : 'Home Visit',
      status: v.status,
      tabType,
    };
  });
};
