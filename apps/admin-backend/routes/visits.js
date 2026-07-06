const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { checkCCAvailability } = require('../services/scheduling');
const { notifyUser } = require('../services/notifications');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const storage = require('../services/storage');

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// ─── Human-readable Visit Code Generator ─────────────────────────────────────
// Safe charset: avoids O/0, I/1, S/5, B/8 — easy to read aloud over the phone.
const VISIT_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateVisitCode() {
  let code = 'V';
  for (let i = 0; i < 8; i++) {
    code += VISIT_CODE_CHARSET[Math.floor(Math.random() * VISIT_CODE_CHARSET.length)];
  }
  return code;
}

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

  if (!beneficiaryId || !careCompanionId || !scheduledTime || !durationMinutes || !benefitId) {
    return res.status(400).json({ success: false, message: 'Missing required fields (benefit type is mandatory)' });
  }

  const startTime = new Date(scheduledTime);
  if (startTime.getTime() < Date.now() - 60000) {
    return res.status(400).json({ success: false, message: 'Cannot schedule a visit in the past' });
  }

  try {
    // 1. Check CC Availability
    const availability = await checkCCAvailability(careCompanionId, startTime, durationMinutes);
    if (!availability.isAvailable) {
      return res.status(409).json({ success: false, message: availability.reason });
    }

    const result = await prisma.$transaction(async (tx) => {
      // A. Create the Visit — store benefitId as a proper FK column
      const visit = await tx.visit.create({
        data: {
          encounterId: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          visitCode: generateVisitCode(),
          beneficiaryId,
          careCompanionId,
          scheduledTime: startTime,
          durationMinutes,
          status: 'scheduled',
          benefitId: benefitId || null,   // ← stored as proper FK, not in notes
        },
        include: {
          beneficiary: { select: { name: true, userId: true, subscriberId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      // B. Benefit is stored on the visit (above) but NOT deducted here.
      //    Deduction happens at CHECKOUT (PATCH /:id/complete) ONLY after the CC actually
      //    completed the visit. This means:
      //      • Missed visits (CC no-show) → benefit is never touched → no refund needed
      //      • Cancelled visits           → benefit is never touched → no refund needed
      //      • Completed visits           → deducted at checkout exactly
      if (benefitId) {
        console.log(`[VISIT SCHEDULE] benefitId=${benefitId} stored on visit. Deduction deferred to checkout.`);
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

      if (visit.beneficiary?.subscriberId && visit.beneficiary.subscriberId !== visit.beneficiary.userId) {
        await notifyUser(tx, {
          userId: visit.beneficiary.subscriberId,
          type: 'visit_reminder',
          title: 'Care Companion Visit Scheduled',
          body: `A visit for ${visit.beneficiary?.name || 'your beneficiary'} with ${visit.careCompanion?.name || 'the Care Companion'} has been scheduled for ${formattedTime}.`,
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
    if (visit.status === 'missed') return res.status(400).json({ success: false, message: 'Cannot complete a missed visit' });

    // Determine which benefitId to charge at checkout.
    // Now stored as a proper FK on the visit record — no notes parsing needed.
    let hoursBenefitId = overrideBenefitId || visit.benefitId || null;

    const result = await prisma.$transaction(async (tx) => {
      // Update visit status — never touch notes to extract benefitId anymore
      const updatedVisit = await tx.visit.update({
        where: { id },
        data: {
          status: 'completed',
          checkInTime: checkIn,
          checkOutTime: checkOut,
          durationMinutes: actualMinutes,
          notes: notes || visit.notes,
          visitSummary: visitSummary || visit.visitSummary,
        },
        include: {
          beneficiary: { select: { name: true, userId: true } },
          careCompanion: { select: { name: true, userId: true } },
        },
      });

      // ── Deduct benefit at CHECKOUT (the only place deduction happens) ──────────
      // Deduction was intentionally NOT done at scheduling.
      // This ensures missed visits (CC no-show) never consume the user's benefit.
      if (hoursBenefitId) {
        const benefit = await tx.benefit.findUnique({
          where: { id: hoursBenefitId },
          select: { id: true, name: true, unitLabel: true },
        });

        if (benefit) {
          const unitLabelLower = (benefit.unitLabel || '').toLowerCase();
          const isHourBased = unitLabelLower.includes('hour') || unitLabelLower.includes('hr');
          // Session/visit-count: anything not hour-based (includes 'visit', 'session', or no label)
          const isSessionBased = !isHourBased;

          console.log(`[COMPLETE] benefitId=${hoursBenefitId} name="${benefit.name}" unitLabel="${benefit.unitLabel}" → isHourBased=${isHourBased} isSessionBased=${isSessionBased}`);

          const subscription = await tx.subscription.findFirst({
            where: { beneficiaryId: visit.beneficiaryId, isActive: true, endDate: { gte: new Date() } },
          });

          if (!subscription) {
            console.warn(`[COMPLETE] No active subscription found for beneficiary ${visit.beneficiaryId} — skipping deduction.`);
          } else if (isHourBased) {
            // HOUR-BASED: charge actual duration (min 1h billing rule)
            //   < 60 min  → charge exactly 1h
            //   >= 60 min → charge actual time
            const billableMinutes = Math.max(60, actualMinutes);
            const hoursConsumed = billableMinutes / 60;

            console.log(`[COMPLETE] Hour-based — deducting ${hoursConsumed}h from "${benefit.name}" (sub=${subscription.id})`);
            await deductBenefitBalance(tx, {
              subscriptionId: subscription.id,
              beneficiaryId: visit.beneficiaryId,
              benefitId: hoursBenefitId,
              visitId: id,
              unitsToDeduct: hoursConsumed,
              hoursConsumed,
              description: `Visit completed: ${visit.encounterId} — ${actualMinutes} min, billed as ${hoursConsumed.toFixed(2)}h`,
            });

            await tx.subscription.update({
              where: { id: subscription.id },
              data: { hoursUsed: { increment: hoursConsumed } },
            });
          } else {
            // SESSION/VISIT-COUNT: charge 1 unit for completing this visit
            console.log(`[COMPLETE] Session-based — deducting 1 unit from "${benefit.name}" (sub=${subscription.id})`);
            await deductBenefitBalance(tx, {
              subscriptionId: subscription.id,
              beneficiaryId: visit.beneficiaryId,
              benefitId: hoursBenefitId,
              visitId: id,
              unitsToDeduct: 1,
              hoursConsumed: actualMinutes / 60,
              description: `Visit completed: ${visit.encounterId} — session benefit "${benefit.name}" consumed`,
            });

            await tx.subscription.update({
              where: { id: subscription.id },
              data: { visitsCompleted: { increment: 1 } },
            });
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
// GET /api/visits/:id - Get a single visit by ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        beneficiary: { select: { id: true, name: true, user: { select: { phone: true } }, latitude: true, longitude: true, primaryCcId: true, secondaryCcId: true } },
        careCompanion: { select: { id: true, name: true, user: { select: { phone: true } } } },
        medicationAdherenceRecords: true,
        vitalReadings: true
      },
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Flatten the phone number to make it easier for the frontend
    const formattedVisit = {
      ...visit,
      beneficiary: visit.beneficiary ? {
        ...visit.beneficiary,
        phone: visit.beneficiary.user?.phone
      } : null,
      careCompanion: visit.careCompanion ? {
        ...visit.careCompanion,
        phone: visit.careCompanion.user?.phone
      } : null
    };

    res.json({ success: true, data: formattedVisit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/visits/:id/edit - Admin edits visit notes/summary/follow-up
// Logs every field that changed to activity_logs
// Body: { notes?, visitSummary?, followUpRequired?, followUpNotes?, followUpDate?,
//         escalateToManager?, escalationReason?, actorName? }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/resolve-change', async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    
    let updateData = {
      changeRequestStatus: status,
      changeResolutionReason: reason || null,
    };

    if (status === 'accepted') {
      try {
        if (visit.changePreferredDate && visit.changePreferredTime) {
          const newDateStr = `${visit.changePreferredDate} ${visit.changePreferredTime}`;
          const newScheduledTime = new Date(newDateStr);
          if (!isNaN(newScheduledTime.getTime())) {
            updateData.scheduledTime = newScheduledTime;
          }
        }
      } catch (e) {
        console.error("Error parsing new scheduled time", e);
      }
    }

    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, visit: updatedVisit });
  } catch (error) {
    console.error('Error resolving visit change:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const {
    notes,
    visitSummary,
    followUpRequired,
    followUpNotes,
    followUpDate,
    escalateToManager,
    escalationReason,
    actorName,
    imageUrls, // Array<string> — the FULL updated list after admin deletions
  } = req.body;

  try {
    const existing = await prisma.visit.findUnique({
      where: { id },
      select: {
        notes: true, visitSummary: true, followUpRequired: true,
        followUpNotes: true, followUpDate: true, escalateToManager: true,
        escalationReason: true, imageUrls: true, beneficiaryId: true,
        beneficiary: { select: { userId: true } }
      }
    });

    if (!existing) return res.status(404).json({ success: false, message: 'Visit not found' });

    // Build diff for audit log
    const changes = {};
    const updateData = {};

    const track = (field, newVal) => {
      if (newVal !== undefined && newVal !== existing[field]) {
        changes[field] = { from: existing[field], to: newVal };
        updateData[field] = newVal;
      }
    };

    track('notes', notes);
    track('visitSummary', visitSummary);
    track('followUpRequired', followUpRequired);
    track('followUpNotes', followUpNotes);
    track('escalateToManager', escalateToManager);
    track('escalationReason', escalationReason);
    if (followUpDate !== undefined) {
      const d = followUpDate ? new Date(followUpDate) : null;
      const oldD = existing.followUpDate ? new Date(existing.followUpDate).toISOString() : null;
      const newD = d ? d.toISOString() : null;
      if (oldD !== newD) {
        changes.followUpDate = { from: oldD, to: newD };
        updateData.followUpDate = d;
      }
    }
    // imageUrls: admin sent the new full array (after deletions)
    if (imageUrls !== undefined) {
      const newJson = JSON.stringify(imageUrls);
      if (newJson !== existing.imageUrls) {
        changes.imageUrls = { from: existing.imageUrls, to: newJson };
        updateData.imageUrls = newJson;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.json({ success: true, data: existing, message: 'No changes detected' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedVisit = await tx.visit.update({ where: { id }, data: updateData });

      // Activity log
      await tx.activityLog.create({
        data: {
          userId: existing.beneficiary?.userId || existing.beneficiaryId,
          type: 'VISIT',
          action: 'VISIT_EDITED',
          details: {
            visitId: id,
            editedBy: actorName || req.user?.name || 'Admin',
            changes,
            editedAt: new Date().toISOString(),
          },
        },
      });

      return updatedVisit;
    });

    res.json({ success: true, data: updated, changesLogged: changes });
  } catch (err) {
    console.error('PATCH /visits/:id/edit error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/visits/:id/upload-image - Upload a new image for a visit
// Accepts multipart/form-data with field "image"
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/upload-image', uploadMemory.single('image'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filePath = `visit-images/${id}/${uuidv4()}${ext}`;

    const { url } = await storage.upload(req.file.buffer, filePath, req.file.mimetype);

    // Append URL to the visit's imageUrls JSON array
    const visit = await prisma.visit.findUnique({ where: { id }, select: { imageUrls: true } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    let existing = [];
    try { existing = visit.imageUrls ? JSON.parse(visit.imageUrls) : []; } catch (_) {}
    existing.push(url);

    await prisma.visit.update({ where: { id }, data: { imageUrls: JSON.stringify(existing) } });

    res.json({ success: true, url, imageUrls: existing });
  } catch (err) {
    console.error('POST /visits/:id/upload-image error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/visits - Get all visits (optionally filtered)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { beneficiaryId, careCompanionId, date, fmUserId, visitCode, hasChangeRequest } = req.query;
  try {
    // Auto-update missed visits
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
    const where = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (careCompanionId) where.careCompanionId = careCompanionId;
    // Filter by human-readable visitCode (case-insensitive partial match)
    if (visitCode) {
      where.visitCode = { contains: String(visitCode).toUpperCase(), mode: 'insensitive' };
    }
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
    if (hasChangeRequest === 'true') {
      where.changeRequestedAt = { not: null };
    }
    if (fmUserId) {
      where.careCompanion = {
        team: { fieldManager: { userId: fmUserId } },
      };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        beneficiary: { select: { id: true, name: true, latitude: true, longitude: true, primaryCcId: true, secondaryCcId: true } },
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

    // Attach geo-fencing fields + visitCode to each visit for the admin UI
    const visitsWithGeo = visits.map((v) => ({
      ...v,
      visitCode: v.visitCode,
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
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        beneficiary: { select: { name: true, userId: true, subscriberId: true } },
        careCompanion: { select: { name: true, userId: true } },
      },
    });

    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    if (visit.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed visit' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.visit.update({ where: { id }, data: { status: 'cancelled' } });

      // No benefit refund needed on cancel:
      // Deduction only happens at checkout (visit completion), NOT at scheduling.
      // If the visit never completed (being cancelled now), no balance was ever touched.
      // Idempotency safety: if somehow a log exists (e.g. completed then re-cancelled), remove it.
      const log = await tx.packageHoursLog.findUnique({ where: { visitId: id } });
      if (log) {
        console.warn(`[CANCEL VISIT] Found unexpected log for visit ${id} — removing orphan log (no balance change).`);
        await tx.packageHoursLog.delete({ where: { id: log.id } });
      }

      console.log(`[CANCEL VISIT] Visit ${id} cancelled. No benefit deduction had occurred — no refund needed.`);

      const formattedTime = visit.scheduledTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

      // Notify Care Companion
      if (visit.careCompanion?.userId) {
        await notifyUser(tx, {
          userId: visit.careCompanion.userId,
          type: 'visit_cancelled',
          title: 'Visit Cancelled',
          body: `Your scheduled visit with ${visit.beneficiary?.name || 'a beneficiary'} on ${formattedTime} has been cancelled.`,
          data: { visitId: visit.id },
        });
      }

      // Notify Beneficiary
      if (visit.beneficiary?.userId) {
        await notifyUser(tx, {
          userId: visit.beneficiary.userId,
          type: 'visit_cancelled',
          title: 'Visit Cancelled',
          body: `Your scheduled visit with ${visit.careCompanion?.name || 'the Care Companion'} on ${formattedTime} has been cancelled.`,
          data: { visitId: visit.id },
        });
      }

      // Notify Subscriber
      if (visit.beneficiary?.subscriberId && visit.beneficiary.subscriberId !== visit.beneficiary.userId) {
        await notifyUser(tx, {
          userId: visit.beneficiary.subscriberId,
          type: 'visit_cancelled',
          title: 'Visit Cancelled',
          body: `The scheduled visit for ${visit.beneficiary?.name || 'your beneficiary'} with ${visit.careCompanion?.name || 'the Care Companion'} on ${formattedTime} has been cancelled.`,
          data: { visitId: visit.id },
        });
      }
    });

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

    if (startTime.getTime() < Date.now() - 60000) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a visit to a past date/time' });
    }

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
          beneficiary: { select: { name: true, userId: true, subscriberId: true } },
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

      if (updatedVisit.beneficiary?.subscriberId && updatedVisit.beneficiary.subscriberId !== updatedVisit.beneficiary.userId) {
        await notifyUser(tx, {
          userId: updatedVisit.beneficiary.subscriberId,
          type: 'visit_reminder',
          title: 'Scheduled Visit Updated',
          body: `The visit for ${updatedVisit.beneficiary?.name || 'Unknown'} with ${updatedVisit.careCompanion?.name || 'Unknown'} has been rescheduled to ${formattedTime}.`,
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
