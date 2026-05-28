const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');
const { notifyUser } = require('../services/notifications');

// ─── Helper: Deduct from a benefit balance inside a transaction ───────────────
/**
 * Deducts units from a SubscriptionBenefitBalance and creates a PackageHoursLog.
 * @param {object} tx - Prisma transaction client
 * @param {object} opts
 * @param {string}  opts.subscriptionId
 * @param {string}  opts.beneficiaryId
 * @param {string}  opts.benefitId
 * @param {string}  opts.visitId
 * @param {number}  opts.unitsToDeduct - Integer units (1 for visit, Math.ceil(hours) for hours)
 * @param {number}  opts.hoursConsumed - Exact hours as float (for log display)
 * @param {string}  opts.description
 */
async function deductBenefitBalance(tx, opts) {
  const { subscriptionId, beneficiaryId, benefitId, visitId, unitsToDeduct, hoursConsumed, description } = opts;

  const balance = await tx.subscriptionBenefitBalance.findUnique({
    where: { subscriptionId_benefitId: { subscriptionId, benefitId } },
  });

  if (!balance) throw new Error('Benefit not found in this subscription');

  if (balance.totalUnits !== -1 && (balance.usedUnits + unitsToDeduct) > balance.totalUnits) {
    throw new Error('Insufficient benefit balance');
  }

  const balanceBefore = balance.usedUnits;
  const balanceAfter = balance.usedUnits + unitsToDeduct;

  await tx.subscriptionBenefitBalance.update({
    where: { id: balance.id },
    data: { usedUnits: { increment: unitsToDeduct } },
  });

  await tx.packageHoursLog.create({
    data: {
      subscriptionId,
      beneficiaryId,
      visitId,
      hoursConsumed,
      balanceBefore,
      balanceAfter,
      description,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /api/visits
 * Schedule a new visit and optionally deduct a visit-count benefit.
 * Body: { beneficiaryId, careCompanionId, scheduledTime, durationMinutes, benefitId? }
 *
 * Deduction logic:
 *  - If benefitId is provided, find the benefit's unitLabel:
 *      "visits" → deduct 1 unit immediately at scheduling
 *      "hours"  → defer deduction to checkout (PATCH /:id/complete)
 */
router.post('/', async (req, res) => {
  const {
    beneficiaryId,
    careCompanionId,
    scheduledTime,
    durationMinutes,
    benefitId,
  } = req.body;

  if (!beneficiaryId || !careCompanionId || !scheduledTime || !durationMinutes) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const startTime = new Date(scheduledTime);

    // 1. Check CC Availability
    const availability = await checkCCAvailability(careCompanionId, startTime, durationMinutes);
    if (!availability.isAvailable) {
      return res.status(409).json({ success: false, message: availability.reason });
    }

    const result = await prisma.$transaction(async (tx) => {
      // A. Create the Visit
      const visit = await tx.visit.create({
        data: {
          encounterId: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          beneficiaryId,
          careCompanionId,
          scheduledTime: startTime,
          durationMinutes,
          status: 'scheduled',
        },
        include: {
          beneficiary: { select: { name: true, userId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      // B. Deduct Benefit (only if benefitId provided + unitLabel = "visits")
      if (benefitId) {
        const benefit = await tx.benefit.findUnique({
          where: { id: benefitId },
          select: { id: true, name: true, unitLabel: true },
        });

        if (!benefit) throw new Error('Benefit not found');

        const isVisitBased = !benefit.unitLabel || benefit.unitLabel.toLowerCase() === 'visit' || benefit.unitLabel.toLowerCase() === 'visits';
        const isHourBased = benefit.unitLabel?.toLowerCase() === 'hours' || benefit.unitLabel?.toLowerCase() === 'hour';

        if (isVisitBased) {
          // Find active subscription
          const subscription = await tx.subscription.findFirst({
            where: { beneficiaryId, isActive: true, endDate: { gte: new Date() } },
          });
          if (!subscription) throw new Error('No active subscription found for this beneficiary');

          await deductBenefitBalance(tx, {
            subscriptionId: subscription.id,
            beneficiaryId,
            benefitId,
            visitId: visit.id,
            unitsToDeduct: 1,
            hoursConsumed: 0, // not hour-based
            description: `Visit scheduled: ${visit.encounterId}`,
          });
        }
        // If hour-based, deduction happens at checkout (PATCH /:id/complete)
        // Store the benefitId on the visit so we know what to charge at checkout
        // (We use visit notes for now — or you can add a benefitId field to Visit schema)
        if (isHourBased) {
          // Tag the visit with the benefit to charge on checkout via notes field
          await tx.visit.update({
            where: { id: visit.id },
            data: { notes: `__benefitId:${benefitId}` },
          });
        }
      }

      // C. Send Notifications
      const formattedTime = startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      if (visit.careCompanion?.userId) {
        await notifyUser(tx, {
          userId: visit.careCompanion.userId,
          type: 'visit_reminder',
          title: 'New Visit Scheduled',
          body: `A new visit has been scheduled with ${visit.beneficiary?.name || 'a beneficiary'} for ${formattedTime}.`,
          data: { visitId: visit.id },
        });
      }

      if (visit.beneficiary?.userId) {
        await notifyUser(tx, {
          userId: visit.beneficiary.userId,
          type: 'visit_reminder',
          title: 'Care Companion Visit Scheduled',
          body: `${visit.careCompanion?.name || 'Your Care Companion'} will visit you on ${formattedTime}.`,
          data: { visitId: visit.id },
        });
      }

      // D. Activity Log
      await tx.activityLog.create({
        data: {
          userId: visit.beneficiary.userId,
          type: 'VISIT',
          action: 'VISIT_SCHEDULED',
          details: {
            visitId: visit.id,
            encounterId: visit.encounterId,
            beneficiaryId,
            beneficiaryName: visit.beneficiary?.name,
            careCompanionId,
            careCompanionName: visit.careCompanion?.name,
            scheduledTime,
            durationMinutes,
            actorName: req.user?.name || 'System Admin',
            actorPhone: req.user?.phone || 'Static Login',
          },
        },
      });

      return visit;
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('POST /visits error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * PATCH /api/visits/:id/complete
 * Marks a visit as completed, records checkIn/checkOut times,
 * and deducts hours from the subscription benefit balance.
 *
 * Hours billing rule:
 *   - If actual duration < 60 mins → charge 1 full hour (minimum billing unit)
 *   - If actual duration >= 60 mins → charge actual minutes (as decimal hours)
 *   Formula: Math.max(60, actualMinutes) / 60
 *
 * Body: { checkInTime, checkOutTime, benefitId? (override), notes?, visitSummary? }
 */
router.patch('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { checkInTime, checkOutTime, benefitId: overrideBenefitId, notes, visitSummary } = req.body;

  if (!checkInTime || !checkOutTime) {
    return res.status(400).json({ success: false, message: 'checkInTime and checkOutTime are required' });
  }

  try {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);

    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'checkOutTime must be after checkInTime' });
    }

    const actualMinutes = Math.round((checkOut - checkIn) / 60000);

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        beneficiary: { select: { id: true, name: true, userId: true } },
        careCompanion: { select: { id: true, name: true, userId: true } },
      },
    });

    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.status === 'completed') return res.status(400).json({ success: false, message: 'Visit is already completed' });
    if (visit.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot complete a cancelled visit' });

    // Determine which benefitId to charge for hours (from override or notes tag)
    let hoursBenefitId = overrideBenefitId;
    if (!hoursBenefitId && visit.notes?.startsWith('__benefitId:')) {
      hoursBenefitId = visit.notes.replace('__benefitId:', '');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update visit status
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: {
          status: 'completed',
          checkInTime: checkIn,
          checkOutTime: checkOut,
          durationMinutes: actualMinutes,
          // Clear the benefit tag from notes if it was there, keep user notes
          notes: visit.notes?.startsWith('__benefitId:') ? (notes || null) : (notes || visit.notes),
          visitSummary: visitSummary || visit.visitSummary,
        },
        include: {
          beneficiary: { select: { name: true, userId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      // Deduct hours benefit if applicable
      if (hoursBenefitId) {
        const benefit = await tx.benefit.findUnique({
          where: { id: hoursBenefitId },
          select: { id: true, name: true, unitLabel: true },
        });

        if (benefit) {
          const isHourBased = benefit.unitLabel?.toLowerCase() === 'hours' || benefit.unitLabel?.toLowerCase() === 'hour';
          if (isHourBased) {
            // Hours billing: min 1 hour, then actual
            const billableMinutes = Math.max(60, actualMinutes);
            const hoursConsumed = billableMinutes / 60; // e.g. 39min → 1.0hr, 65min → 1.083hr
            const unitsToDeduct = Math.ceil(hoursConsumed); // integer deduction for balance tracking

            const subscription = await tx.subscription.findFirst({
              where: { beneficiaryId: visit.beneficiaryId, isActive: true, endDate: { gte: new Date() } },
            });

            if (subscription) {
              await deductBenefitBalance(tx, {
                subscriptionId: subscription.id,
                beneficiaryId: visit.beneficiaryId,
                benefitId: hoursBenefitId,
                visitId: id,
                unitsToDeduct,
                hoursConsumed: parseFloat(hoursConsumed.toFixed(4)),
                description: `Visit completed: ${visit.encounterId} — ${actualMinutes} mins billed as ${billableMinutes} mins`,
              });

              // Also update subscription.hoursUsed for quick access
              await tx.subscription.update({
                where: { id: subscription.id },
                data: { hoursUsed: { increment: hoursConsumed } },
              });
            }
          }
        }
      }

      // Activity log
      await tx.activityLog.create({
        data: {
          userId: updatedVisit.beneficiary.userId,
          type: 'VISIT',
          action: 'VISIT_COMPLETED',
          details: {
            visitId: id,
            encounterId: visit.encounterId,
            beneficiaryId: visit.beneficiaryId,
            careCompanionId: visit.careCompanionId,
            actualMinutes,
            actorName: req.user?.name || 'System',
          },
        },
      });

      return updatedVisit;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('PATCH /visits/:id/complete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/visits - Get all visits (optionally filtered)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { beneficiaryId, careCompanionId, date, fmUserId } = req.query;
  try {
    const where = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (careCompanionId) where.careCompanionId = careCompanionId;
    if (date) {
      if (date === 'next_7') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);
        where.scheduledTime = { gte: start, lte: end };
      } else {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        where.scheduledTime = { gte: start, lte: end };
      }
    }
    if (fmUserId) {
      where.careCompanion = {
        team: { fieldManager: { userId: fmUserId } },
      };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        beneficiary: { select: { id: true, name: true, latitude: true, longitude: true } },
        careCompanion: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                fieldManager: { select: { id: true, userId: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    // Attach geo-fencing fields to each visit for the admin UI
    const visitsWithGeo = visits.map((v) => ({
      ...v,
      isGeoVerified: v.isGeoVerified,
      geoDistanceMeters: v.geoDistanceMeters,
      manualCheckInReason: v.manualCheckInReason,
      checkInLat: v.checkInLat,
      checkInLng: v.checkInLng,
    }));

    res.json({ success: true, data: visitsWithGeo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/visits/check-availability
// ─────────────────────────────────────────────────────────────────────────────
router.get('/check-availability', async (req, res) => {
  const { careCompanionId, scheduledTime, durationMinutes } = req.query;
  try {
    if (!careCompanionId || !scheduledTime || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }
    const availability = await checkCCAvailability(
      careCompanionId,
      new Date(scheduledTime),
      parseInt(durationMinutes)
    );
    res.json({ success: true, data: availability });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/visits/:id - Cancel a scheduled visit
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed visit' });
    }
    await prisma.visit.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ success: true, message: 'Visit cancelled successfully' });
  } catch (err) {
    console.error('DELETE /visits/:id error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/visits/:id - Update an upcoming scheduled visit
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { careCompanionId, scheduledTime, durationMinutes } = req.body;

  if (!careCompanionId || !scheduledTime || !durationMinutes) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const existingVisit = await prisma.visit.findUnique({
      where: { id },
      include: {
        beneficiary: { select: { name: true, userId: true } },
        careCompanion: { select: { name: true, userId: true } },
      },
    });

    if (!existingVisit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (existingVisit.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled visits can be modified' });
    }

    const startTime = new Date(scheduledTime);

    if (
      careCompanionId !== existingVisit.careCompanionId ||
      startTime.getTime() !== new Date(existingVisit.scheduledTime).getTime() ||
      durationMinutes !== existingVisit.durationMinutes
    ) {
      const availability = await checkCCAvailability(careCompanionId, startTime, durationMinutes, id);
      if (!availability.isAvailable) {
        return res.status(409).json({ success: false, message: availability.reason });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: { careCompanionId, scheduledTime: startTime, durationMinutes },
        include: {
          beneficiary: { select: { name: true, userId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      const formattedTime = startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      if (updatedVisit.careCompanion?.userId) {
        await notifyUser(tx, {
          userId: updatedVisit.careCompanion.userId,
          type: 'visit_reminder',
          title: 'Scheduled Visit Updated',
          body: `Your visit with ${updatedVisit.beneficiary?.name || 'Unknown'} has been updated to ${formattedTime}.`,
          data: { visitId: updatedVisit.id },
        });
      }

      if (updatedVisit.beneficiary?.userId) {
        await notifyUser(tx, {
          userId: updatedVisit.beneficiary.userId,
          type: 'visit_reminder',
          title: 'Scheduled Visit Updated',
          body: `Your visit with ${updatedVisit.careCompanion?.name || 'Unknown'} has been rescheduled to ${formattedTime}.`,
          data: { visitId: updatedVisit.id },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: updatedVisit.beneficiary.userId,
          type: 'VISIT',
          action: 'VISIT_UPDATED',
          details: {
            visitId: updatedVisit.id,
            encounterId: updatedVisit.encounterId,
            beneficiaryId: updatedVisit.beneficiaryId,
            beneficiaryName: updatedVisit.beneficiary?.name,
            careCompanionId: updatedVisit.careCompanionId,
            careCompanionName: updatedVisit.careCompanion?.name,
            oldScheduledTime: existingVisit.scheduledTime,
            newScheduledTime: startTime,
            actorName: req.user?.name || 'System Admin',
          },
        },
      });

      return updatedVisit;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('PUT /visits/:id error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
