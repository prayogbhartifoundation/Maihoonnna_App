import prisma from '../../core/database';
import { ApiError } from '../../utils/ApiError';

import { isSathiBenefit } from '../../constants/systemBenefits';

export const getBeneficiarySathiEligibility = async (beneficiaryId: string) => {
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
  let remainingUnits = 0;
  let sathiBalanceId = null;

  for (const sub of activeSubscriptions) {
    if (sub.benefitBalances && sub.benefitBalances.length > 0) {
      for (const bal of sub.benefitBalances) {
        if (isSathiBenefit(bal.benefit)) {
          const remaining = bal.totalUnits - bal.usedUnits;
          if (remaining > 0) {
            eligible = true;
            remainingUnits += remaining;
            sathiBalanceId = bal.id;
          }
        }
      }
    }

    if (!eligible && sub.packageVersion?.versionBenefits) {
      for (const pvb of sub.packageVersion.versionBenefits) {
        if (isSathiBenefit(pvb.benefit)) {
          const remaining = pvb.unitsIncluded;
          if (remaining > 0 || pvb.isUnlimited) {
            eligible = true;
            remainingUnits += pvb.isUnlimited ? 999 : remaining;
          }
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

export const respondToSathiReschedule = async (beneficiaryId: string, requestId: string, action: 'ACCEPT' | 'REJECT') => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId }
  });

  if (!request || request.beneficiaryId !== beneficiaryId) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  if (request.status !== 'RESCHEDULE_PROPOSED') {
    throw new ApiError(400, 'Request is not in a rescheduled state.');
  }

  if (action === 'ACCEPT') {
    if (!request.proposedDateTime) {
      throw new ApiError(400, 'No proposed date time available to accept.');
    }
    const updatedRequest = await prisma.sathiVisitRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        dateTime: request.proposedDateTime,
        rejectionReason: null
      }
    });
    return updatedRequest;
  } else {
    const updatedRequest = await prisma.sathiVisitRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Beneficiary declined the reschedule proposal.'
      }
    });
    return updatedRequest;
  }
};

export const completeSathiVisit = async (beneficiaryId: string, requestId: string) => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  if (request.beneficiaryId !== beneficiaryId) {
    throw new ApiError(403, 'You do not have permission to modify this visit request.');
  }

  if (request.status !== 'IN_PROGRESS') {
    throw new ApiError(400, 'This visit is not in progress and cannot be completed.');
  }

  // First update SathiVisitRequest to COMPLETED (without actualDurationMinutes yet)
  const updatedRequest = await prisma.sathiVisitRequest.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED'
    }
  });

  // Automatically check out the Saathi's active visit log with exact time
  if (request.volunteerId) {
    const activeLog = await prisma.volunteerVisitLog.findFirst({
      where: {
        beneficiaryId,
        volunteerId: request.volunteerId,
        status: 'in_progress'
      }
    });

    if (activeLog) {
      const checkOutTime = new Date();
      const rawMinutes = (checkOutTime.getTime() - activeLog.checkInTime.getTime()) / 60000;
      const hoursEarned = rawMinutes / 60;
      const pointsEarned = hoursEarned * 10; // Default rate

      await prisma.$transaction(async (tx) => {
        // Update the actualDurationMinutes
        await tx.sathiVisitRequest.update({
          where: { id: requestId },
          data: { actualDurationMinutes: rawMinutes }
        });

        if (activeLog.subscriptionBenefitBalanceId) {
          await tx.subscriptionBenefitBalance.update({
            where: { id: activeLog.subscriptionBenefitBalanceId },
            data: { usedUnits: { increment: hoursEarned } }
          });
        }

        const volunteer = await tx.volunteer.findUnique({
          where: { id: activeLog.volunteerId }
        });

        if (volunteer) {
          await tx.volunteer.update({
            where: { id: volunteer.id },
            data: {
              totalCreditHours: volunteer.totalCreditHours + hoursEarned,
              totalCreditPoints: volunteer.totalCreditPoints + pointsEarned
            }
          });

          await tx.volunteerCreditTransaction.create({
            data: {
              volunteerId: volunteer.id,
              visitLogId: activeLog.id,
              type: 'earned',
              minutesDelta: rawMinutes,
              pointsDelta: pointsEarned,
              balanceAfter: volunteer.totalCreditPoints + pointsEarned,
              description: `Beneficiary confirmed completion.`
            }
          });
        }

        await tx.volunteerVisitLog.update({
          where: { id: activeLog.id },
          data: {
            checkOutTime,
            minutesLogged: rawMinutes,
            hoursEarned,
            creditPointsEarned: pointsEarned,
            status: 'completed'
          }
        });
      });
    }
  }

  return { request: updatedRequest, message: 'Visit marked as completed successfully and Sathi hours logged.' };
};
