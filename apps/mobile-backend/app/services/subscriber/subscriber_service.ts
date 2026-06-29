import prisma from '../../core/database';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { OtpFactory } from '../../core/otp/OtpFactory';

export const getSubscriberProfile = async (subscriberId: string, beneficiaryId?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePhoto: true,
      location: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      isVerified: true,
      isActive: true,
    }
  });

  if (!user) throw new Error('User not found');

  // Inject fallback defaults for address fields not present on User model
  // to prevent mobile app from crashing.
  const userWithFallbackAddress = {
    ...user,
    flatPlot: '',
    streetArea: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  };

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

  let scopedSubscriptions = activeSubscriptions;
  if (beneficiaryId) {
    scopedSubscriptions = activeSubscriptions.filter(sub => sub.beneficiaryId === beneficiaryId);
  }

  let totalHours = 0;
  let usedHours = 0;
  let currentPlan = null;

  if (scopedSubscriptions.length > 0) {
    // For "Quick Stats", we sum across scoped plans
    scopedSubscriptions.forEach(sub => {
      totalHours += sub.hoursTotal || 0;
      usedHours += sub.hoursUsed || 0;
    });

    // For the "Subscription Tab" details, we pick the most recent/primary one
    const latest = scopedSubscriptions[0];
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
    user: userWithFallbackAddress,
    stats: {
      beneficiaryCount,
      usedHours,
      availableHours: Math.max(0, totalHours - usedHours)
    },
    currentPlan,
    beneficiaries
  };
};

export const updateProfile = async (subscriberId: string, data: { 
  name?: string, 
  email?: string, 
  location?: string,
  latitude?: number,
  longitude?: number,
  flatPlot?: string,
  streetArea?: string,
  landmark?: string,
  city?: string,
  state?: string,
  pincode?: string
}) => {
  console.log(`[Backend] Updating profile for ${subscriberId}:`, data);
  const updatedUser = await prisma.user.update({
    where: { id: subscriberId },
    data: {
      name: data.name,
      email: data.email,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
    }
  });
  console.log(`[Backend] Update successful for ${subscriberId}`);

  // Log Activity
  await logActivity(subscriberId, 'PROFILE', 'PROFILE_UPDATED', { fieldsChanged: Object.keys(data) });

  // Return updated user with address fallbacks to match expected schema
  return {
    ...updatedUser,
    flatPlot: data.flatPlot || '',
    streetArea: data.streetArea || '',
    landmark: data.landmark || '',
    city: data.city || '',
    state: data.state || '',
    pincode: data.pincode || '',
  };
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
