const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');
const { notifyUser } = require('../services/notifications');

/**
 * POST /api/visits
 * Body: { beneficiaryId, careCompanionId, scheduledTime, durationMinutes, benefitId }
 */
router.post('/', async (req, res) => {
  const {
    beneficiaryId,
    careCompanionId,
    scheduledTime,
    durationMinutes,
    benefitId,
  } = req.body;

  if (
    !beneficiaryId ||
    !careCompanionId ||
    !scheduledTime ||
    !durationMinutes
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  try {
    const startTime = new Date(scheduledTime);

    // 1. Check Availability (Buffer, Lunch, Conflict)
    const availability = await checkCCAvailability(
      careCompanionId,
      startTime,
      durationMinutes
    );
    if (!availability.isAvailable) {
      return res
        .status(409)
        .json({ success: false, message: availability.reason });
    }

    // 2. Start Transaction
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

      // B. Deduct Benefit if provided
      if (benefitId) {
        // Find active subscription for this beneficiary
        const subscription = await tx.subscription.findFirst({
          where: {
            beneficiaryId,
            status: 'active',
            endDate: { gte: new Date() },
          },
          include: { balances: true },
        });

        if (!subscription) {
          throw new Error('No active subscription found for this beneficiary');
        }

        const balance = subscription.balances.find(
          (b) => b.benefitId === benefitId
        );
        if (!balance) {
          throw new Error('Benefit not included in current subscription');
        }

        const unitsNeeded = 1; // Assuming 1 visit = 1 unit for now, or could be duration based
        if (
          balance.totalUnits !== -1 &&
          balance.totalUnits - balance.usedUnits < unitsNeeded
        ) {
          throw new Error('Insufficient benefit balance');
        }

        await tx.subscriptionBenefitBalance.update({
          where: { id: balance.id },
          data: { usedUnits: { increment: unitsNeeded } },
        });

        // C. Log the consumption
        await tx.packageHoursLog.create({
          data: {
            beneficiaryId,
            subscriptionId: subscription.id,
            hoursUsed: unitsNeeded,
            activityType: 'visit',
            description: `Visit scheduled: ${visit.encounterId}`,
          },
        });
      }

      // D. Send Notifications to Care Companion and Beneficiary
      const formattedTime = startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      
      if (visit.careCompanion?.userId) {
        await notifyUser(tx, {
          userId: visit.careCompanion.userId,
          type: 'visit_reminder',
          title: 'New Visit Scheduled',
          body: `A new visit has been scheduled with beneficiary ${visit.beneficiary?.name || 'Unknown'} for ${formattedTime}.`,
          data: { visitId: visit.id }
        });
      }

      if (visit.beneficiary?.userId) {
        await notifyUser(tx, {
          userId: visit.beneficiary.userId,
          type: 'visit_reminder',
          title: 'Care Companion Visit Scheduled',
          body: `Care Companion ${visit.careCompanion?.name || 'Unknown'} has been scheduled to visit you on ${formattedTime}.`,
          data: { visitId: visit.id }
        });
      }

      // E. Log Activity (logged against beneficiary's userId for schema constraint safety)
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

// GET /api/visits - Get all visits (optionally filtered)
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
        team: {
          fieldManager: {
            userId: fmUserId
          }
        }
      };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        beneficiary: { select: { id: true, name: true } },
        careCompanion: {
          select: {
            id: true,
            name: true,
            team: {
              select: {
                id: true,
                fieldManager: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json({ success: true, data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visits/check-availability
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

// DELETE /api/visits/:id - Cancel/delete a scheduled visit
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }
    if (visit.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed visit' });
    }
    await prisma.visit.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    res.json({ success: true, message: 'Visit cancelled successfully' });
  } catch (err) {
    console.error('DELETE /visits/:id error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/visits/:id - Update an upcoming scheduled visit
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

    if (!existingVisit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (existingVisit.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled visits can be modified' });
    }

    const startTime = new Date(scheduledTime);

    // Check availability (exclude this visit itself from checks)
    if (
      careCompanionId !== existingVisit.careCompanionId ||
      startTime.getTime() !== new Date(existingVisit.scheduledTime).getTime() ||
      durationMinutes !== existingVisit.durationMinutes
    ) {
      const availability = await checkCCAvailability(
        careCompanionId,
        startTime,
        durationMinutes,
        id
      );
      if (!availability.isAvailable) {
        return res.status(409).json({ success: false, message: availability.reason });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: {
          careCompanionId,
          scheduledTime: startTime,
          durationMinutes,
        },
        include: {
          beneficiary: { select: { name: true, userId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      // Send notifications
      const formattedTime = startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

      if (updatedVisit.careCompanion?.userId) {
        await notifyUser(tx, {
          userId: updatedVisit.careCompanion.userId,
          type: 'visit_reminder',
          title: 'Scheduled Visit Updated',
          body: `Your scheduled visit with ${updatedVisit.beneficiary?.name || 'Unknown'} has been updated to ${formattedTime}.`,
          data: { visitId: updatedVisit.id }
        });
      }

      if (updatedVisit.beneficiary?.userId) {
        await notifyUser(tx, {
          userId: updatedVisit.beneficiary.userId,
          type: 'visit_reminder',
          title: 'Scheduled Visit Updated',
          body: `Your scheduled visit with Care Companion ${updatedVisit.careCompanion?.name || 'Unknown'} has been rescheduled to ${formattedTime}.`,
          data: { visitId: updatedVisit.id }
        });
      }

      // Log activity
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
            oldDurationMinutes: existingVisit.durationMinutes,
            newDurationMinutes: durationMinutes,
            actorName: req.user?.name || 'System Admin',
            actorPhone: req.user?.phone || 'Static Login',
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
