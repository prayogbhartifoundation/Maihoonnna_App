const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

/**
 * GET /api/activity-logs
 * Fetch recent activity for all users
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search 
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { type: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        take: parseInt(limit),
        skip: skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Map to frontend-friendly structure
    const mappedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown User',
      userRole: log.user?.role || 'user',
      action: log.action.toLowerCase(), // Frontend expects lowercase
      entity: log.type,
      entityId: log.details?.entityId || log.details?.id || 'N/A', // Attempt to extract entity ID
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
      status: log.status || 'success',
      timestamp: log.createdAt.toISOString(),
      ipAddress: log.ipAddress,
    }));

    res.json({
      success: true,
      data: mappedLogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('GET /api/activity-logs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
