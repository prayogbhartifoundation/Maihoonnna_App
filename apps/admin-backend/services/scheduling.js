const { prisma } = require('../lib/prisma');

/**
 * Checks if a Care Companion is available for a specific time range.
 * Considers:
 * 1. Global Lunch Lock (from SystemConfig)
 * 2. Existing Visits with 30-min buffer (up and down)
 * 3. Manual Blockers (StaffAvailabilityBlocker)
 * 4. General isAvailable flag
 *
 * @param {string} careCompanionId
 * @param {Date} startTime
 * @param {number} durationMinutes
 * @returns {Promise<{ isAvailable: boolean, reason: string|null }>}
 */
async function checkCCAvailability(
  careCompanionId,
  startTime,
  durationMinutes,
  excludeVisitId = null
) {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  const BUFFER_MS = 0; // Buffer removed as per user request

  // 1. Check Global Lunch Lock
  const lunchStartConfig = await prisma.systemConfig.findUnique({ where: { key: 'globalLunchStart' } });
  const lunchEndConfig = await prisma.systemConfig.findUnique({ where: { key: 'globalLunchEnd' } });
  
  const globalLunchStart = lunchStartConfig?.value || '13:00';
  const globalLunchEnd = lunchEndConfig?.value || '14:00';

  const [lStartH, lStartM] = globalLunchStart.split(':').map(Number);
  const [lEndH, lEndM] = globalLunchEnd.split(':').map(Number);

  const lunchStartToday = new Date(startTime);
  lunchStartToday.setHours(lStartH, lStartM, 0, 0);
  const lunchEndToday = new Date(startTime);
  lunchEndToday.setHours(lEndH, lEndM, 0, 0);

  // Conflict if [startTime, endTime] overlaps [lunchStart, lunchEnd]
  if (startTime < lunchEndToday && endTime > lunchStartToday) {
    return {
      isAvailable: false,
      reason: 'Conflict with global lunch break (1 PM - 2 PM)',
    };
  }

  // 2. Check Static Availability
  const cc = await prisma.careCompanion.findUnique({
    where: { id: careCompanionId },
    select: { isAvailable: true },
  });
  if (!cc?.isAvailable) {
    return {
      isAvailable: false,
      reason: 'Care Companion is marked as unavailable',
    };
  }

  // 3. Check Manual Blockers
  const blockers = await prisma.staffAvailabilityBlocker.findMany({
    where: {
      careCompanionId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });
  if (blockers.length > 0) {
    return {
      isAvailable: false,
      reason: 'Conflict with manual blocker: ' + blockers[0].reason,
    };
  }

  // 4. Check Existing Visits with 30-min Buffer
  // A visit at [vStart, vEnd] creates a blocked window of [vStart - 30m, vEnd + 30m]
  const searchStart = new Date(
    startTime.getTime() - BUFFER_MS - durationMinutes * 60000
  );
  const searchEnd = new Date(
    endTime.getTime() + BUFFER_MS + durationMinutes * 60000
  );

  const existingVisits = await prisma.visit.findMany({
    where: {
      careCompanionId,
      id: excludeVisitId ? { not: excludeVisitId } : undefined,
      scheduledTime: {
        gte: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // Optimization: check within 24h
        lte: new Date(startTime.getTime() + 24 * 60 * 60 * 1000),
      },
      status: { notIn: ['cancelled', 'completed'] },
    },
  });

  for (const visit of existingVisits) {
    const vStart = new Date(visit.scheduledTime);
    const vDuration = visit.durationMinutes || 60; // default 1h
    const vEnd = new Date(vStart.getTime() + vDuration * 60000);

    const blockedStart = new Date(vStart.getTime() - BUFFER_MS);
    const blockedEnd = new Date(vEnd.getTime() + BUFFER_MS);

    // Check overlap: [startTime, endTime] overlaps [blockedStart, blockedEnd]
    if (startTime < blockedEnd && endTime > blockedStart) {
      return {
        isAvailable: false,
        reason: `Visit conflict (includes 30m travel buffer)`,
      };
    }
  }

  return { isAvailable: true, reason: null };
}

module.exports = {
  checkCCAvailability,
};
