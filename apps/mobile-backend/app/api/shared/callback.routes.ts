import { Router } from 'express';
import prisma from '../../core/database';

const router = Router();

// ── POST /api/shared/callbacks ─────────────────────────────────────────────
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

export default router;
