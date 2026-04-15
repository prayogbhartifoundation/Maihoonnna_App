const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');

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
  const { beneficiaryId, careCompanionId, date } = req.query;
  try {
    const where = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (careCompanionId) where.careCompanionId = careCompanionId;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.scheduledTime = { gte: start, lte: end };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        beneficiary: { select: { name: true } },
        careCompanion: { select: { name: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json({ success: true, data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
