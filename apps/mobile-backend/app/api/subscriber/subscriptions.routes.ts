import { Router, Request, Response } from 'express';
import * as subscriptionService from '../../services/subscriber/subscription_service';

const router = Router();

// Endpoint for buying a subscription and linking a beneficiary
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { userId, packageId, beneficiaryData, medicalData, emergencyContacts } = req.body;

    if (!userId || !packageId || !beneficiaryData) {
      throw new Error("Missing required payload fields");
    }

    const result = await subscriptionService.purchaseSubscription(
      userId,
      packageId,
      beneficiaryData,
      medicalData,
      emergencyContacts
    );
    res.json(result);
  } catch (error: any) {
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