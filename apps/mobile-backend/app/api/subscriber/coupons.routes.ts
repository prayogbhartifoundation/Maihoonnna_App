import { Router, Request, Response } from 'express';
import { validateCoupon } from '../../services/coupon_service';
import prisma from '../../core/database';

const router = Router();

// Endpoint for checking a coupon logic before purchase
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, userId, packageType, orderAmount } = req.body;

    if (!code || !userId || !packageType || orderAmount === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required payload fields: code, userId, packageType, orderAmount' });
    }

    // Check if user is first-time subscriber
    const previousSubscriptions = await prisma.subscription.count({
      where: { subscriberId: userId }
    });
    const isFirstTimeSubscriber = previousSubscriptions === 0;

    const result = await validateCoupon(
      code,
      userId,
      packageType,
      parseFloat(orderAmount),
      isFirstTimeSubscriber
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error during validation' });
  }
});

export default router;
