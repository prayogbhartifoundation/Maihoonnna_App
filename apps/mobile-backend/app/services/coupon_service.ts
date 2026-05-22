import prisma from '../core/database';
import { generateUUID } from '../utils/helpers';

export interface CouponValidationResult {
  isValid: boolean;
  message?: string;
  discountApplied: number;
  finalAmount: number;
  couponId?: string;
}

export const logCouponAttempt = async (
  couponCode: string,
  userId: string | null,
  status: 'SUCCESS' | 'FAIL',
  errorReason?: string,
  ipAddress?: string,
  deviceInfo?: string
) => {
  try {
    await prisma.couponAttemptLog.create({
      data: {
        id: generateUUID(),
        couponCode,
        userId,
        status,
        errorReason,
        ipAddress,
        deviceInfo
      }
    });
  } catch (error) {
    console.error('Failed to log coupon attempt:', error);
  }
};

export const validateCoupon = async (
  code: string,
  userId: string,
  packageType: string,
  orderAmount: number,
  isFirstTimeSubscriber: boolean = false
): Promise<CouponValidationResult> => {
  try {
    // 1. Check if exists
    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon) {
      await logCouponAttempt(code, userId, 'FAIL', 'Coupon does not exist');
      return { isValid: false, message: 'Invalid coupon code', discountApplied: 0, finalAmount: orderAmount };
    }

    // 2. Check Status
    if (!coupon.isActive) {
      await logCouponAttempt(code, userId, 'FAIL', 'Coupon is inactive');
      return { isValid: false, message: 'This coupon is no longer active', discountApplied: 0, finalAmount: orderAmount };
    }

    // 3. Check Timeline
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      await logCouponAttempt(code, userId, 'FAIL', 'Outside validity window');
      return { isValid: false, message: 'This coupon is expired or not yet valid', discountApplied: 0, finalAmount: orderAmount };
    }

    // 4. Global Usage Limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      await logCouponAttempt(code, userId, 'FAIL', 'Global usage limit reached');
      return { isValid: false, message: 'This coupon has reached its usage limit', discountApplied: 0, finalAmount: orderAmount };
    }

    // 5. Per-User Limit
    if (coupon.perUserLimit !== null) {
      const userUsages = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId }
      });
      if (userUsages >= coupon.perUserLimit) {
        await logCouponAttempt(code, userId, 'FAIL', 'Per-user limit reached');
        return { isValid: false, message: 'You have reached the maximum usage for this coupon', discountApplied: 0, finalAmount: orderAmount };
      }
    }

    // 6. Package Eligibility
    if (coupon.allowedPackages && coupon.allowedPackages.length > 0) {
      if (!coupon.allowedPackages.includes(packageType)) {
        await logCouponAttempt(code, userId, 'FAIL', 'Not applicable to package type');
        return { isValid: false, message: 'This coupon is not applicable to the selected package', discountApplied: 0, finalAmount: orderAmount };
      }
    }

    // 7. Minimum Order Value
    if (coupon.minOrderAmount !== null && orderAmount < coupon.minOrderAmount) {
      await logCouponAttempt(code, userId, 'FAIL', 'Minimum order amount not met');
      return { isValid: false, message: `Minimum order of ₹${coupon.minOrderAmount} required`, discountApplied: 0, finalAmount: orderAmount };
    }

    // 8. Segmentation Check
    if (coupon.firstTimeOnly && !isFirstTimeSubscriber) {
      await logCouponAttempt(code, userId, 'FAIL', 'Not a first-time subscriber');
      return { isValid: false, message: 'This coupon is valid for new subscribers only', discountApplied: 0, finalAmount: orderAmount };
    }

    // 9. Calculate Discount
    let discountApplied = 0;
    
    if (coupon.type === 'percentage') {
      discountApplied = orderAmount * (coupon.discountValue / 100);
      
      // Apply maximum discount cap if set
      if (coupon.maxDiscountAmount !== null && discountApplied > coupon.maxDiscountAmount) {
        discountApplied = coupon.maxDiscountAmount;
      }
    } else if (coupon.type === 'fixed') {
      discountApplied = coupon.discountValue;
    }

    // Ensure we don't discount more than the order amount
    if (discountApplied > orderAmount) {
      discountApplied = orderAmount;
    }

    const finalAmount = orderAmount - discountApplied;

    await logCouponAttempt(code, userId, 'SUCCESS');
    
    return {
      isValid: true,
      couponId: coupon.id,
      discountApplied,
      finalAmount
    };

  } catch (error) {
    console.error('Coupon validation error:', error);
    return { isValid: false, message: 'An error occurred while validating the coupon', discountApplied: 0, finalAmount: orderAmount };
  }
};

export const applyCoupon = async (
  couponId: string,
  userId: string,
  subscriptionId: string | null,
  orderAmount: number,
  discountApplied: number
) => {
  // 1. Record Usage
  await prisma.couponUsage.create({
    data: {
      id: generateUUID(),
      couponId,
      userId,
      subscriptionId,
      orderAmount,
      discountApplied
    }
  });

  // 2. Increment Global Usage Count
  await prisma.coupon.update({
    where: { id: couponId },
    data: {
      usedCount: {
        increment: 1
      }
    }
  });
};
