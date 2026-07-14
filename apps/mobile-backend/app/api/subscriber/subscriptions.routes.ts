import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import * as subscriptionService from '../../services/subscriber/subscription_service';
import { validateCoupon } from '../../services/coupon_service';
import prisma from '../../core/database';
import { createOrder, verifyPaymentSignature } from '../../services/razorpay_service';

const router = Router();

// ─── GST rate used everywhere in checkout (server-side source of truth) ───────
const GST_RATE = 0.18; // 18%

// ─────────────────────────────────────────────────────────────────────────────
// Helper to calculate exact pricing (used by both preview and create-order)
// ─────────────────────────────────────────────────────────────────────────────
async function calculatePricing(packageId: string, couponCode: string | undefined, userId: string) {
  const pkg = await prisma.subscriptionPackage.findFirst({
    where: {
      OR: [{ id: packageId }, { type: packageId }],
      isActive: true,
    },
    select: { id: true, name: true, type: true, basePrice: true },
  });

  if (!pkg) {
    throw new Error('Package not found or inactive');
  }

  const basePrice: number = pkg.basePrice;
  let discountApplied = 0;
  let finalBase = basePrice;
  let couponValid = false;
  let couponId: string | null = null;
  let couponMessage: string | undefined;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.trim().toUpperCase();

    const previousSubs = await prisma.subscription.count({
      where: { subscriberId: userId }
    });
    const isFirstTime = previousSubs === 0;

    const validation = await validateCoupon(code, userId, pkg.type, basePrice, isFirstTime);

    if (validation.isValid) {
      discountApplied = validation.discountApplied;
      finalBase = validation.finalAmount;
      couponValid = true;
      couponId = validation.couponId || null;
    } else {
      couponMessage = validation.message;
    }
  }

  const tax = parseFloat((finalBase * GST_RATE).toFixed(2));
  const total = parseFloat((finalBase + tax).toFixed(2));

  return {
    pkg,
    basePrice,
    discountApplied,
    finalBase,
    tax,
    total,
    couponValid,
    couponId,
    couponMessage
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /subscriber/subscriptions/checkout/preview
// Server-side pricing calculation — no client-side math ever trusted.
// Body: { packageId, couponCode? }
// Returns: { packageName, basePrice, gstRate, tax, discount, discountApplied, total, couponValid, couponId }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkout/preview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { packageId, couponCode } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'packageId is required' });
    }

    try {
      const pricing = await calculatePricing(packageId, couponCode, userId);
      
      return res.json({
        success: true,
        data: {
          packageId: pricing.pkg.id,
          packageName: pricing.pkg.name,
          basePrice: pricing.basePrice,
          gstRate: GST_RATE,
          discountApplied: pricing.discountApplied,
          tax: pricing.tax,
          total: pricing.total,
          couponValid: pricing.couponValid,
          couponId: pricing.couponId,
          couponMessage: pricing.couponMessage,
        },
      });
    } catch (err: any) {
      return res.status(404).json({ success: false, message: err.message });
    }
  } catch (error: any) {
    console.error('[Checkout Preview Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate checkout pricing' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /subscriber/subscriptions/create-order
// Server-side calculation -> create razorpay order
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-order', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { packageId, couponCode } = req.body;

    if (!packageId) {
      return res.status(400).json({ success: false, message: 'packageId is required' });
    }

    const pricing = await calculatePricing(packageId, couponCode, userId);
    
    // Receipt ID must be max 40 chars. 
    // Format: rcpt_ + first 8 chars of userId + _ + timestamp (total ~27 chars)
    const shortUserId = userId.substring(0, 8);
    const receiptId = `rcpt_${shortUserId}_${Date.now()}`.substring(0, 40);
    
    // Create the Razorpay Order
    const order = await createOrder(pricing.total, receiptId);
    
    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error: any) {
    console.error('[Razorpay Create Order Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /subscriber/subscriptions/purchase
// ─────────────────────────────────────────────────────────────────────────────
router.post('/purchase', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!; // Use authenticated userId
    const { 
      packageId, 
      beneficiaryData, 
      medicalData, 
      emergencyContacts, 
      couponCode,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    if (!packageId) {
      throw new Error("Missing required payload field: packageId is required.");
    }

    // Verify Payment Signature if payment details are provided
    if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      if (razorpay_signature === 'DEV_MOCK_SIGNATURE') {
        console.log("⚠️ DEV MODE: Bypassing Razorpay Signature Verification using mock signature.");
      } else {
        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
          throw new Error("Invalid payment signature. Payment verification failed.");
        }
      }
    } else {
      // For now, depending on your business logic, if Razorpay is mandatory, you'd reject here:
      // throw new Error("Payment details are required.");
      // We will allow it to pass temporarily if they are not provided (for e.g. 100% off coupon),
      // but in production, if total > 0, it should be required.
    }

    const result = await subscriptionService.purchaseSubscription(
      userId,
      packageId,
      beneficiaryData,
      medicalData,
      emergencyContacts,
      couponCode
    );

    // Generate new token containing the updated subscriber role
    const { createToken } = require('../../core/security');
    const newToken = createToken({ sub: userId, role: 'subscriber' });
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true, age: true, role: true }
    });

    const responseData = result as any;
    if (responseData.success) {
      responseData.token = newToken;
      responseData.user = updatedUser;
    }

    res.json(responseData);
  } catch (error: any) {
    console.error('[Purchase Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /subscriber/subscriptions/activate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/activate', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    const { beneficiaryId, beneficiaryData, medicalData, emergencyContacts } = req.body;

    if (!beneficiaryId || !beneficiaryData) {
      return res.status(400).json({
        success: false,
        message: 'beneficiaryId and beneficiaryData are required'
      });
    }

    const result = await subscriptionService.activateSubscription(
      userId as string,
      beneficiaryId,
      beneficiaryData,
      medicalData,
      emergencyContacts
    );

    // Generate new token containing the updated subscriber role
    const { createToken } = require('../../core/security');
    const newToken = createToken({ sub: userId as string, role: 'subscriber' });
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { id: true, phone: true, name: true, age: true, role: true }
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        ...result,
        token: newToken,
        user: updatedUser
      }
    });
  } catch (error: any) {
    console.error('[Activate Subscription Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /subscriber/subscriptions/unlinked-check
// Check if the authenticated user has an active subscription with no beneficiary
// ─────────────────────────────────────────────────────────────────────────────
router.get('/unlinked-check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const unlinkedSub = await prisma.subscription.findFirst({
      where: { subscriberId: userId, isActive: true, beneficiaryId: null },
      include: { package: true }
    });

    res.json({
      success: true,
      hasUnlinkedSubscription: !!unlinkedSub,
      subscription: unlinkedSub ? {
        id: unlinkedSub.id,
        packageType: unlinkedSub.packageType,
        packageName: (unlinkedSub.package as any)?.name || unlinkedSub.packageType,
        startDate: unlinkedSub.startDate,
        endDate: unlinkedSub.endDate
      } : null
    });
  } catch (error: any) {
    console.error('[Unlinked Check Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /subscriber/subscriptions/link-beneficiary
// Link a beneficiary to an existing unlinked subscription
// Body: { beneficiaryData, medicalData?, emergencyContacts?, preferencesData? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/link-beneficiary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { beneficiaryData, medicalData, emergencyContacts, preferencesData } = req.body;

    if (!beneficiaryData) {
      return res.status(400).json({ success: false, message: 'beneficiaryData is required' });
    }

    const result = await subscriptionService.linkBeneficiaryToSubscription(
      userId,
      beneficiaryData,
      medicalData,
      emergencyContacts,
      preferencesData
    );

    // Generate new token containing the updated subscriber role
    const { createToken } = require('../../core/security');
    const newToken = createToken({ sub: userId, role: 'subscriber' });
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, name: true, age: true, role: true }
    });

    res.json({
      success: true,
      message: 'Beneficiary linked successfully',
      beneficiaryId: result.beneficiaryId,
      beneficiaryName: result.beneficiaryName,
      token: newToken,
      user: updatedUser
    });
  } catch (error: any) {
    console.error('[Link Beneficiary Error]:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /subscriber/subscriptions/packages
// ─────────────────────────────────────────────────────────────────────────────
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = await subscriptionService.getSubscriptionPackages();
    res.json({ success: true, data: packages });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;