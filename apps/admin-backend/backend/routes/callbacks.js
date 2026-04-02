const express = require('express');
const router = express.Router();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

// ── GET /api/callbacks ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const callbacks = await prisma.callbackRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: callbacks });
    } catch (err) {
        console.error('GET /callbacks error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch callback requests' });
    }
});

// ── POST /api/callbacks ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { name, phone, subscriberId, beneficiaryId, notes } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }

        const callback = await prisma.callbackRequest.create({
            data: {
                name,
                phone,
                subscriberId: subscriberId || null,
                beneficiaryId: beneficiaryId || null,
                notes: notes || null,
                status: 'pending'
            }
        });

        res.status(201).json({ success: true, data: callback });
    } catch (err) {
        console.error('POST /callbacks error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit callback request' });
    }
});

// ── PATCH /api/callbacks/:id ──────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const callback = await prisma.callbackRequest.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status }),
                ...(notes !== undefined && { notes })
            }
        });
        res.json({ success: true, data: callback });
    } catch (err) {
        console.error('PATCH /callbacks/:id error:', err);
        res.status(500).json({ success: false, message: 'Failed to update callback request' });
    }
});

module.exports = router;
