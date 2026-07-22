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

  for (const sub of activeSubscriptions) {
    if (sub.benefitBalances) {
      for (const bal of sub.benefitBalances) {
        if (isEmergencyBenefit(bal.benefit)) {
          eligible = true;
          benefitName = bal.benefit?.benefitType?.name || bal.benefit?.name || 'Emergency Support';
          break;
        }
      }
    }

    if (!eligible && sub.packageVersion?.versionBenefits) {
      for (const pvb of sub.packageVersion.versionBenefits) {
        if (isEmergencyBenefit(pvb.benefit)) {
          eligible = true;
          benefitName = pvb.benefit?.benefitType?.name || pvb.benefit?.name || 'Emergency Support';
          break;
        }
      }
    }
  }

  return { eligible, benefitName };
};

export const triggerEmergencyRequest = async (
  beneficiaryId: string,
  requestedByUserId: string,
  locationDetails?: { lat?: number; lng?: number; address?: string; description?: string }
) => {
  // Check eligibility first
  const { eligible } = await getBeneficiaryEmergencyEligibility(beneficiaryId);
  if (!eligible) {
    throw new ApiError(403, 'Your active package subscription does not include Emergency Support benefits. Please upgrade your plan.');
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

  const emergencyReq = await prisma.emergencyRequest.create({
    data: {
      ticketNumber,
      beneficiaryId,
      requestedBy: requestedByUserId,
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
