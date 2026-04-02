const express = require('express');
const router = express.Router();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

// ── GET /api/teams ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                fieldManager: true,
                careCompanions: true
            }
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
        const team = await prisma.team.create({
            data: {
                name,
                fieldManagerId,
                zone,
                careCompanions: {
                    connect: careCompanionIds.map(id => ({ id }))
                }
            },
            include: {
                fieldManager: true,
                careCompanions: true
            }
        });
        res.json({ success: true, data: team });
    } catch (err) {
        console.error('POST /api/teams error:', err);
        res.status(500).json({ success: false, message: 'Failed to create team' });
    }
});

// ── GET /api/teams/available-companions ──────────────────────────────────────
router.get('/available-companions', async (req, res) => {
    try {
        const companions = await prisma.careCompanion.findMany({
            where: {
                teamId: null,
                isAvailable: true
            }
        });
        res.json({ success: true, data: companions });
    } catch (err) {
        console.error('GET /available-companions error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch available companions' });
    }
});

// ── GET /api/teams/available-managers ────────────────────────────────────────
router.get('/available-managers', async (req, res) => {
    try {
        const managers = await prisma.fieldManager.findMany({
            where: {
                isAvailable: true
            },
            include: {
                user: true
            }
        });
        res.json({ success: true, data: managers });
    } catch (err) {
        console.error('GET /available-managers error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch available managers' });
    }
});

// ── POST /api/teams/onboard-cc ───────────────────────────────────────────────
router.post('/onboard-cc', async (req, res) => {
    try {
        const { userId, bio, specialization, zone } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const profile = await prisma.careCompanion.create({
            data: {
                userId,
                name: user.name || 'Unknown',
                bio: bio || '',
                specialization: specialization || [],
                zone: zone || '',
            }
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
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const profile = await prisma.fieldManager.create({
            data: {
                userId,
                name: user.name || 'Unknown',
                zone: zone || '',
            }
        });
        res.json({ success: true, data: profile });
    } catch (err) {
        console.error('POST /onboard-fm error:', err);
        res.status(500).json({ success: false, message: 'Failed to onboard FM' });
    }
});

module.exports = router;
