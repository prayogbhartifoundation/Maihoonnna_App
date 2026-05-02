import prisma from '../../core/database';
import { createToken } from '../../core/security';
import { generateUUID } from '../../utils/helpers';

import { OtpFactory } from '../../core/otp/OtpFactory';

export const sendOtp = async (rawPhone: string) => {
  const phone = rawPhone.replace(/\D/g, '').slice(-10);
  const provider = OtpFactory.getProvider();
  return await provider.send(phone);
};

export const verifyOtp = async (rawPhone: string, otpCode: string) => {
  const phone = rawPhone.replace(/\D/g, '').slice(-10);
  const provider = OtpFactory.getProvider();
  
  const isValid = await provider.verify(phone, otpCode);
  if (!isValid) {
    throw new Error('Invalid or expired OTP code entered.');
  }

  // 3. Look up user — DO NOT auto-create. Return isNewUser flag instead.

  // 3. Look up user — DO NOT auto-create. Return isNewUser flag instead.
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      subscriberBeneficiaries: {
        include: {
          subscriptions: {
            where: { isActive: true },
            include: {
              package: {
                include: {
                  packageBenefits: {
                    include: { benefit: { include: { benefitType: true } } },
                  },
                },
              },
              benefitBalances: { include: { benefit: true } },
            },
            take: 1,
          },
        },
      },
      // Also check if the phone belongs to a beneficiary's own user account
      beneficiaryProfile: {
        include: {
          subscriptions: {
            where: { isActive: true },
            include: {
              package: true,
              benefitBalances: { include: { benefit: true } },
            },
            take: 1,
          },
        },
      },
    },
  });

  // Not in DB at all → signal mobile app to show sign-up screen
  if (!user) {
    return {
      success: true,
      isNewUser: true,
      message: 'Phone verified. Please complete registration.',
      phone,
    };
  }

  const token = createToken({ sub: user.id, role: user.role });

  // Gather active subscription — subscriber might have beneficiaries OR be a beneficiary themselves
  let activeSubscription: any = null;

  // Subscriber path: find active subscription across all their beneficiaries
  if (user.subscriberBeneficiaries && user.subscriberBeneficiaries.length > 0) {
    for (const ben of user.subscriberBeneficiaries) {
      if (ben.subscriptions && ben.subscriptions.length > 0) {
        const sub = ben.subscriptions[0];
        activeSubscription = {
          id: sub.id,
          packageType: sub.packageType,
          packageName: sub.package?.name,
          startDate: sub.startDate,
          endDate: sub.endDate,
          duration: sub.duration,
          isActive: sub.isActive,
          packageBenefits: (sub.package?.packageBenefits || []).map((pb: any) => ({
            name: pb.benefit?.name,
            type: pb.benefit?.benefitType?.name,
            unitsIncluded: pb.unitsIncluded,
          })),
          benefitBalances: (sub.benefitBalances || []).map((bb: any) => ({
            benefitName: bb.benefit?.name,
            totalUnits: bb.totalUnits,
            usedUnits: bb.usedUnits,
            remainingUnits: bb.totalUnits - bb.usedUnits,
          })),
          beneficiary: {
            id: ben.id,
            name: ben.name,
            age: ben.age,
          },
        };
        break; // return first active one
      }
    }
  }

  // Beneficiary path: user themselves have a subscription
  if (!activeSubscription && user.beneficiaryProfile?.subscriptions?.length) {
    const sub = user.beneficiaryProfile.subscriptions[0];
    activeSubscription = {
      id: sub.id,
      packageType: sub.packageType,
      packageName: sub.package?.name,
      startDate: sub.startDate,
      endDate: sub.endDate,
      duration: sub.duration,
      isActive: sub.isActive,
      benefitBalances: (sub.benefitBalances || []).map((bb: any) => ({
        benefitName: bb.benefit?.name,
        totalUnits: bb.totalUnits,
        usedUnits: bb.usedUnits,
        remainingUnits: bb.totalUnits - bb.usedUnits,
      })),
    };
  }

  return {
    success: true,
    isNewUser: false,
    message: 'Verification & Login successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
    activeSubscription,
    beneficiaryCount: user.subscriberBeneficiaries?.length ?? 0,
    token,
  };
};


import bcrypt from 'bcryptjs';

export const registerWithPassword = async (phone: string, name: string, age: number, passwordRaw: string) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error('A user with this phone number already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(passwordRaw, salt);

  // Create real row in DB
  const user = await prisma.user.create({
    data: {
      id: generateUUID(),
      phone,
      name,
      age,
      password: hashedPassword,
      role: 'subscriber',
    },
  });

  const token = createToken({ sub: user.id, role: user.role });

  return {
    success: true,
    message: 'Registration successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      role: user.role,
    },
    token,
  };
};

export const loginWithPassword = async (phone: string, passwordRaw: string) => {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.password) {
    throw new Error('Invalid phone number or password.');
  }

  // Compare hashes
  const isMatch = await bcrypt.compare(passwordRaw, user.password);

  if (!isMatch) {
    throw new Error('Invalid phone number or password.');
  }

  const token = createToken({ sub: user.id, role: user.role });

  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      role: user.role,
    },
    token,
  };
};

export const checkLocation = async (location: string) => {
  return {
    available: true,
    message: 'Great news! We serve your area. You can now enjoy our full range of services.',
    coverage: 'Service Coverage Active in 1000+ locations',
    zones: ['North Zone', 'South Zone', 'East Zone', 'West Zone'],
  };
};

export const changePassword = async (userId: string, payload: { 
  verificationType: 'otp' | 'password',
  otp?: string,
  currentPassword?: string,
  newPassword: string 
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
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
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // 3. Log Activity
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type: 'SECURITY',
        action: 'PASSWORD_CHANGED',
        details: { method: payload.verificationType }
      }
    });
  } catch (error) {
    console.error('Failed to log password change activity:', error);
  }

  return { success: true, message: 'Password changed successfully' };
};