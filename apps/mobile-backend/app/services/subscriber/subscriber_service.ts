import prisma from '../../core/database';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OtpFactory } from '../../core/otp/OtpFactory';

export const getSubscriberProfile = async (subscriberId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      location: true,
      createdAt: true,
      isVerified: true,
      isActive: true,
    }
  });

  if (!user) throw new Error('User not found');

  // 1. Get Beneficiary Count
  const beneficiaryCount = await prisma.beneficiary.count({
    where: { subscriberId }
  });

  // 2. Get Active Subscriptions & Aggregate Hours
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      subscriberId,
      isActive: true
    },
    include: {
      package: true,
      benefitBalances: {
        include: {
          benefit: true
        }
      }
    }
  });

  let totalHours = 0;
  let usedHours = 0;
  let currentPlan = null;

  if (activeSubscriptions.length > 0) {
    // For "Quick Stats", we sum across all active plans
    activeSubscriptions.forEach(sub => {
      totalHours += sub.hoursTotal || 0;
      usedHours += sub.hoursUsed || 0;
    });

    // For the "Subscription Tab" details, we pick the most recent/primary one
    const latest = activeSubscriptions[0];
    currentPlan = {
        name: latest.package.name,
        hoursTotal: latest.hoursTotal,
        hoursUsed: latest.hoursUsed,
        nextBillingDate: latest. renewalDate || latest.endDate,
        isActive: latest.isActive
    };
  }

  // 3. Get Beneficiaries List for management
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { subscriberId },
    select: {
        id: true,
        name: true,
        age: true,
        relationship: true,
        photo: true
    }
  });

  return {
    user,
    stats: {
      beneficiaryCount,
      usedHours,
      availableHours: Math.max(0, totalHours - usedHours)
    },
    currentPlan,
    beneficiaries
  };
};

export const updateProfile = async (subscriberId: string, data: { name?: string, email?: string, location?: string }) => {
  console.log(`[Backend] Updating profile for ${subscriberId}:`, data);
  const updatedUser = await prisma.user.update({
    where: { id: subscriberId },
    data: {
      name: data.name,
      email: data.email,
      location: data.location
    }
  });
  console.log(`[Backend] Update successful for ${subscriberId}`);

  // Log Activity
  await logActivity(subscriberId, 'PROFILE', 'PROFILE_UPDATED', { fieldsChanged: Object.keys(data) });

  return updatedUser;
};

export const changePassword = async (subscriberId: string, payload: { 
  verificationType: 'otp' | 'password',
  otp?: string,
  currentPassword?: string,
  newPassword: string 
}) => {
  const user = await prisma.user.findUnique({ where: { id: subscriberId } });
  if (!user) throw new Error('User not found');

  // 1. Verify Identity
  if (payload.verificationType === 'otp') {
    if (!payload.otp) throw new Error('OTP is required for verification');
    const provider = OtpFactory.getProvider();
    const isValid = await provider.verify(user.phone, payload.otp);
    if (!isValid) throw new Error('Invalid or expired OTP code');
  } else {
    if (!payload.currentPassword) throw new Error('Current password is required');
    if (!user.password) throw new Error('Account does not have a password set. Please use OTP verification.');
    const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
    if (!isMatch) throw new Error('Incorrect current password');
  }

  // 2. Hash and Update Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.newPassword, salt);

  await prisma.user.update({
    where: { id: subscriberId },
    data: { password: hashedPassword }
  });

  // 3. Log Activity
  await logActivity(subscriberId, 'SECURITY', 'PASSWORD_CHANGED', { method: payload.verificationType });

  return { success: true, message: 'Password changed successfully' };
};

export const getActivityLog = async (subscriberId: string) => {
  return await prisma.activityLog.findMany({
    where: { userId: subscriberId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

export const logActivity = async (userId: string, type: 'SECURITY' | 'PROFILE' | 'SUBSCRIPTION', action: string, details?: any) => {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        type,
        action,
        details: details || {}
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
