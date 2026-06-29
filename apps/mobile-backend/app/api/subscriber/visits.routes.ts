import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from '../shared/deps';

const router = Router();

// Subscriber rates a completed CC visit for their beneficiary
router.post('/:visitId/rate', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const { visitId } = req.params;
        const { rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Verify the visit belongs to one of this subscriber's beneficiaries
        const beneficiaries = await prisma.beneficiary.findMany({
            where: { subscriberId: userId },
            select: { id: true }
        });
        const beneficiaryIds = beneficiaries.map((b: any) => b.id);

        if (beneficiaryIds.length === 0) {
            return res.status(404).json({ success: false, message: 'No beneficiaries found for this subscriber' });
        }

        const visit = await prisma.visit.findFirst({
            where: { id: visitId as string, beneficiaryId: { in: beneficiaryIds } }
        });

        if (!visit) {
            return res.status(404).json({ success: false, message: 'Visit not found or not authorized' });
        }

        const updated = await (prisma.visit as any).update({
            where: { id: visitId as string },
            data: { subscriberRating: rating }
        });

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            subscriberRating: updated.subscriberRating
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
