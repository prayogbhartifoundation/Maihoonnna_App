import { Router, Request, Response } from 'express';
import prisma from '../../core/database';

const router = Router();

/**
 * GET /api/public/check-enrollment?phone=+91XXXXXXXXXX
 * Pre-OTP check — tells the mobile app if a phone is in the DB and enrolled
 * Used to show "Welcome back!" vs "Register" hint before OTP is even sent
 */
router.get('/check-enrollment', async (req: Request, res: Response) => {
  const { phone } = req.query;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ success: false, message: 'phone is required' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

  try {
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        subscriberBeneficiaries: {
          where: { isActive: true },
          select: {
            id: true,
            subscriptions: {
              where: { isActive: true },
              select: { id: true, packageType: true },
              take: 1,
            },
          },
        },
        beneficiaryProfile: {
          select: {
            subscriptions: {
              where: { isActive: true },
              select: { id: true, packageType: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return res.json({
        success: true,
        data: {
          exists: false,
          enrolled: false,
          message: 'Phone not found. Please register.',
        },
      });
    }

    // Check if user has any active subscription (subscriber or beneficiary path)
    const hasSubscriberSub = user.subscriberBeneficiaries.some(b => b.subscriptions.length > 0);
    const hasBeneficiarySub = (user.beneficiaryProfile?.subscriptions?.length ?? 0) > 0;
    const enrolled = hasSubscriberSub || hasBeneficiarySub;

    res.json({
      success: true,
      data: {
        exists: true,
        enrolled,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        message: enrolled
          ? `Welcome back, ${user.name}! Enter OTP to view your package.`
          : `Welcome back, ${user.name}! Enter OTP to log in.`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
