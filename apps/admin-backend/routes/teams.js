const express = require('express');
const router = express.Router();
const path = require('path');

const { prisma } = require('../lib/prisma');

// ── GET /api/teams ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        fieldManager: true,
        careCompanions: true,
      },
    });
    res.json({ success: true, data: teams });
  } catch (err) {
    console.error('GET /api/teams error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
});

// ── POST /api/teams ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, fieldManagerId, zone, careCompanionIds } = req.body;

    // Handle optional field manager
    const finalFMId =
      fieldManagerId === 'none' || !fieldManagerId ? null : fieldManagerId;

    const team = await prisma.team.create({
      data: {
        name,
        fieldManagerId: finalFMId,
        zone,
        careCompanions: {
          connect: (careCompanionIds || []).map((id) => ({ id })),
        },
      },
      include: {
        fieldManager: true,
        careCompanions: true,
      },
    });
    res.json({ success: true, data: team });
  } catch (err) {
    console.error('POST /api/teams error:', err);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
});

// ── PUT /api/teams/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fieldManagerId, zone, careCompanionIds } = req.body;

    // Handle optional field manager
    const finalFMId =
      fieldManagerId === 'none' || !fieldManagerId ? null : fieldManagerId;

    // Use transaction to ensure consistency
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // 1. Clear all existing associations first
      await tx.careCompanion.updateMany({
        where: { teamId: id },
        data: { teamId: null },
      });

      // 2. Update team info and connect new selection
      return await tx.team.update({
        where: { id },
        data: {
          name,
          fieldManagerId: finalFMId,
          zone,
          careCompanions: {
            connect: (careCompanionIds || []).map((ccId) => ({ id: ccId })),
          },
        },
        include: {
          fieldManager: true,
          careCompanions: true,
        },
      });
    });

    res.json({ success: true, data: updatedTeam });
  } catch (err) {
    console.error('PUT /api/teams/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update team' });
  }
});

// ── GET /api/teams/available-companions ──────────────────────────────────────
router.get('/available-companions', async (req, res) => {
  try {
    const { includeTeamId } = req.query;

    const companions = await prisma.careCompanion.findMany({
      where: {
        OR: [
          { teamId: null },
          ...(includeTeamId ? [{ teamId: includeTeamId }] : []),
        ],
        isAvailable: true,
        user: { isActive: true },
      },
    });
    res.json({ success: true, data: companions });
  } catch (err) {
    console.error('GET /available-companions error:', err);
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to fetch available companions',
      });
  }
});

// ── GET /api/teams/available-managers ────────────────────────────────────────
router.get('/available-managers', async (req, res) => {
  try {
    const managers = await prisma.fieldManager.findMany({
      where: {
        isAvailable: true,
        user: { isActive: true },
      },
      include: {
        user: true,
      },
    });
    res.json({ success: true, data: managers });
  } catch (err) {
    console.error('GET /available-managers error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch available managers' });
  }
});

// ── GET /api/teams/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        fieldManager: true,
        careCompanions: true,
      },
    });

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: 'Team not found' });
    }

    res.json({ success: true, data: team });
  } catch (err) {
    console.error('GET /api/teams/:id error:', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch team details' });
  }
});

// ── POST /api/teams/onboard-cc ───────────────────────────────────────────────
router.post('/onboard-cc', async (req, res) => {
  try {
    const { userId, bio, specialization, zone } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const profile = await prisma.careCompanion.create({
      data: {
        userId,
        name: user.name || 'Unknown',
        bio: bio || '',
        specialization: specialization || [],
        zone: zone || '',
      },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('POST /onboard-cc error:', err);
    res.status(500).json({ success: false, message: 'Failed to onboard CC' });
  }
});

// ── POST /api/teams/onboard-fm ───────────────────────────────────────────────
router.post('/onboard-fm', async (req, res) => {
  try {
    const { userId, zone } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });

    const profile = await prisma.fieldManager.create({
      data: {
        userId,
        name: user.name || 'Unknown',
        zone: zone || '',
      },
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('POST /onboard-fm error:', err);
    res.status(500).json({ success: false, message: 'Failed to onboard FM' });
  }
});

module.exports = router;
