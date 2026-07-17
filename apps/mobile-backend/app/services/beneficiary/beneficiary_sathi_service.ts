import prisma from '../../core/database';
import { ApiError } from '../../utils/ApiError';

export const getBeneficiarySathiEligibility = async (beneficiaryId: string) => {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      beneficiaryId,
      isActive: true
    },
    include: {
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
  let remainingUnits = 0;
  let sathiBalanceId = null;

  for (const sub of activeSubscriptions) {
    for (const bal of sub.benefitBalances) {
      if (bal.benefit.benefitType && (bal.benefit.benefitType.code === 'SATHI_COMPANION' || bal.benefit.benefitType.name.toLowerCase().includes('sathi'))) {
        const remaining = bal.totalUnits - bal.usedUnits;
        if (remaining > 0) {
          eligible = true;
          remainingUnits += remaining;
          sathiBalanceId = bal.id;
        }
      }
    }
  }

  return { eligible, remainingUnits, sathiBalanceId };
};

export const createSathiVisitRequest = async (beneficiaryId: string, dateTime: string, reason: string, targetVolunteerId?: string) => {
  const { eligible } = await getBeneficiarySathiEligibility(beneficiaryId);
  if (!eligible) {
    throw new ApiError(400, 'Your active subscription does not include Sathi Companion hours/benefits, or you have run out of units.');
  }

  const request = await prisma.sathiVisitRequest.create({
    data: {
      beneficiaryId,
      dateTime: new Date(dateTime),
      reason,
      status: 'PENDING',
      volunteerId: targetVolunteerId || null
    },
    include: {
      beneficiary: true
    }
  });

  return request;
};

export const getLinkedVolunteers = async (beneficiaryId: string) => {
  const assignments = await prisma.volunteerAssignment.findMany({
    where: { beneficiaryId, isActive: true },
    include: {
      volunteer: true
    }
  });

  return assignments.map(a => {
    const v = a.volunteer;
    const rating = Math.min(5, Math.max(3, 3 + (v.totalCreditPoints / 100)));
    return {
      id: v.id,
      name: v.name,
      photo: v.profilePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      rating: rating.toFixed(1),
      distance: '2.0 km', 
      location: v.address || 'Nearby',
      hours: v.totalCreditHours.toFixed(1),
      bio: v.previousExperience || 'Volunteer passionate about community support.'
    };
  });
};

export const getBeneficiarySathiRequests = async (beneficiaryId: string) => {
  const requests = await prisma.sathiVisitRequest.findMany({
    where: { beneficiaryId },
    include: {
      volunteer: {
        select: {
          name: true,
          profilePhoto: true
        }
      }
    },
    orderBy: { dateTime: 'desc' }
  });
  return requests;
};
