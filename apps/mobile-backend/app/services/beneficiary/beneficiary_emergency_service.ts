import prisma from '../../core/database';
import { ApiError } from '../../utils/ApiError';

import { isEmergencyBenefit } from '../../constants/systemBenefits';

export const getBeneficiaryEmergencyEligibility = async (beneficiaryId: string) => {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      beneficiaryId,
      isActive: true
    },
    include: {
      packageVersion: {
        include: {
          versionBenefits: {
            include: {
              benefit: {
                include: { benefitType: true }
              }
            }
          }
        }
      },
      benefitBalances: {
        include: {
          benefit: {
            include: { benefitType: true }
          }
        }
      }
    }
  });

  let eligible = false;
  let benefitName = '';
  let balanceId: string | null = null;
  let remaining = 0;

  for (const sub of activeSubscriptions) {
    if (sub.benefitBalances) {
      for (const bal of sub.benefitBalances) {
        if (isEmergencyBenefit(bal.benefit)) {
          const rem = bal.totalUnits - bal.usedUnits;
          if (rem > 0) {
            eligible = true;
            benefitName = bal.benefit?.benefitType?.name || bal.benefit?.name || 'Emergency Support';
            balanceId = bal.id;
            remaining = rem;
            break;
          }
          // benefit exists but exhausted — keep eligible=false, continue scanning
        }
      }
    }
    if (eligible) break;
  }

  return { eligible, benefitName, balanceId, remaining };
};

export const triggerEmergencyRequest = async (
  beneficiaryId: string,
  requestedByUserId: string,
  locationDetails?: { lat?: number; lng?: number; address?: string; description?: string }
) => {
  // Check eligibility — also validates remaining balance > 0
  const { eligible, balanceId } = await getBeneficiaryEmergencyEligibility(beneficiaryId);
  if (!eligible) {
    throw new ApiError(403, 'Your Emergency Support uses are exhausted. Please renew or upgrade your plan to enable Emergency Support again.');
  }

  // Fetch full beneficiary details to assemble complete location and emergency contacts
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId },
    include: {
      user: true,
      subscriber: true,
      primaryCC: {
        include: { user: true }
      },
      secondaryCC: {
        include: { user: true }
      }
    }
  });

  if (!beneficiary) {
    throw new ApiError(404, 'Beneficiary record not found');
  }

  // Format location address from beneficiary record if not passed
  const fullAddress = locationDetails?.address || [
    beneficiary.user?.flatPlot,
    beneficiary.user?.streetArea,
    beneficiary.user?.landmark,
    beneficiary.user?.city,
    beneficiary.user?.state,
    beneficiary.user?.pincode
  ].filter(Boolean).join(', ') || beneficiary.user?.location || 'Address not registered';

  const ticketNumber = `EMG-${Math.floor(100000 + Math.random() * 900000)}`;

  // Wrap emergency request creation + balance deduction in a transaction
  const emergencyReq = await prisma.$transaction(async (tx) => {
    // 1. Deduct 1 unit from the benefit balance (if balance row exists)
    if (balanceId) {
      await tx.subscriptionBenefitBalance.update({
        where: { id: balanceId },
        data: { usedUnits: { increment: 1 } },
      });
    }

    // 2. Create the emergency request record
    return tx.emergencyRequest.create({
      data: {
        ticketNumber,
        beneficiaryId,
        requestedBy: beneficiary.userId,  // always use the beneficiary's actual user FK
        status: 'open',
        type: 'EMERGENCY_SUPPORT',
        description: locationDetails?.description || 'SOS Emergency Alert triggered from mobile app',
        locationLat: locationDetails?.lat || beneficiary.user?.latitude || null,
        locationLng: locationDetails?.lng || beneficiary.user?.longitude || null,
        locationAddress: fullAddress,
        notes: [
          {
            timestamp: new Date().toISOString(),
            note: `🚨 Emergency alert triggered by ${beneficiary.name}`
          }
        ]
      },
      include: {
        beneficiary: {
          include: {
            user: true,
            subscriber: true,
            primaryCC: { include: { user: true } },
            secondaryCC: { include: { user: true } }
          }
        }
      }
    });
  });

  // Dispatch notifications to Subscriber, Primary CC, and Secondary CC
  const notificationTargets = [
    { userId: beneficiary.subscriberId, title: `🚨 Emergency Alert: ${beneficiary.name}`, message: `Emergency triggered for ${beneficiary.name} at ${fullAddress}. Ticket: ${ticketNumber}` },
    ...(beneficiary.primaryCC?.userId ? [{ userId: beneficiary.primaryCC.userId, title: `🚨 Emergency Alert: ${beneficiary.name}`, message: `Assigned Beneficiary ${beneficiary.name} triggered SOS Emergency! Ticket: ${ticketNumber}` }] : []),
    ...(beneficiary.secondaryCC?.userId ? [{ userId: beneficiary.secondaryCC.userId, title: `🚨 Emergency Alert: ${beneficiary.name}`, message: `Assigned Beneficiary ${beneficiary.name} triggered SOS Emergency! Ticket: ${ticketNumber}` }] : [])
  ];

  for (const target of notificationTargets) {
    if (target.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: target.userId,
            title: target.title,
            body: target.message,
            type: 'emergency_alert'
          }
        });
      } catch (err) {
        console.error('Failed to create emergency notification:', err);
      }
    }
  }

  return emergencyReq;
};
