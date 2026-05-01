import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import * as subscriptionService from '../../services/subscriber/subscription_service';

const router = Router();

// Endpoint for buying a subscription and linking a beneficiary
router.post('/purchase', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!; // Use authenticated userId
    const { packageId, beneficiaryData, medicalData, emergencyContacts, couponCode } = req.body;

    if (!packageId || !beneficiaryData) {
      throw new Error("Missing required payload fields: packageId and beneficiaryData are required.");
    }

    const result = await subscriptionService.purchaseSubscription(
      userId,
      packageId,
      beneficiaryData,
      medicalData,
      emergencyContacts,
      couponCode
    );
    res.json(result);
  } catch (error: any) {
    console.error('[Purchase Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Endpoint for getting all available subscription packages
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = await subscriptionService.getSubscriptionPackages();
    res.json({ success: true, data: packages });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;