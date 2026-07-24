import bcrypt from 'bcryptjs';
import prisma from '../../core/database';
import { createToken } from '../../core/security';
import { ApiError } from '../../utils/ApiError';
import { OtpFactory } from '../../core/otp/OtpFactory';
import { getBeneficiarySathiEligibility } from '../beneficiary/beneficiary_sathi_service';

export const getSystemConfig = async (key: string, defaultValue: string): Promise<string> => {
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config ? config.value : defaultValue;
};

export const registerVolunteer = async (data: any) => {
  const { phone, name, password } = data;

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const existing = await prisma.volunteer.findFirst({
    where: { phone: cleanPhone }
  });

  if (existing) {
    throw new ApiError(400, 'A volunteer with this phone number is already registered.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const volunteer = await prisma.volunteer.create({
    data: {
      phone: cleanPhone,
      password: hashedPassword,
      name,
      applicationStatus: 'NOT_APPLIED',
    }
  });

  const token = createToken({ sub: volunteer.id, role: 'volunteer' });

  return {
    token,
    volunteer: {
      id: volunteer.id,
      name: volunteer.name,
      phone: volunteer.phone,
      applicationStatus: volunteer.applicationStatus,
    }
  };
};

export const loginVolunteer = async (phone: string, passwordRaw: string) => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const volunteer = await prisma.volunteer.findUnique({
    where: { phone: cleanPhone }
  });

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found.');
  }

  const isMatch = await bcrypt.compare(passwordRaw, volunteer.password || '');
  if (!isMatch) {
    throw new ApiError(401, 'Invalid password.');
  }

  await prisma.volunteer.update({
    where: { id: volunteer.id },
    data: { lastLoginAt: new Date() }
  });

  const token = createToken({ sub: volunteer.id, role: 'volunteer' });

  return {
    token,
    volunteer: {
      id: volunteer.id,
      name: volunteer.name,
      phone: volunteer.phone,
      applicationStatus: volunteer.applicationStatus,
    }
  };
};

export const sendVolunteerOtp = async (rawPhone: string) => {
  const phone = rawPhone.replace(/\D/g, '').slice(-10);

  const volunteer = await prisma.volunteer.findUnique({
    where: { phone }
  });

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found. Please register first.');
  }

  const provider = OtpFactory.getProvider();
  return await provider.send(phone);
};

export const verifyVolunteerOtp = async (rawPhone: string, otpCode: string) => {
  const phone = rawPhone.replace(/\D/g, '').slice(-10);
  const provider = OtpFactory.getProvider();

  const isValid = await provider.verify(phone, otpCode);
  if (!isValid) {
    throw new ApiError(400, 'Invalid or expired OTP code entered.');
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { phone }
  });

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found.');
  }

  const token = createToken({ sub: volunteer.id, role: 'volunteer' });

  return {
    token,
    volunteer: {
      id: volunteer.id,
      name: volunteer.name,
      phone: volunteer.phone,
      applicationStatus: volunteer.applicationStatus,
    }
  };
};

export const getVolunteerProfile = async (id: string) => {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id }
  });

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found.');
  }

  return volunteer;
};

export const updateVolunteerProfile = async (id: string, data: any) => {
  const updated = await prisma.volunteer.update({
    where: { id },
    data
  });
  return updated;
};

export const getVolunteerDashboard = async (id: string) => {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id },
    include: {
      assignments: {
        where: { isActive: true },
        include: {
          beneficiary: true
        }
      },
      visitLogs: {
        where: { status: 'in_progress' }
      }
    }
  });

  if (!volunteer) {
    throw new ApiError(404, 'Volunteer profile not found.');
  }

  const beneficiaryIds = volunteer.assignments.map(a => a.beneficiaryId);

  // Fetch pending visit requests (where not rejected by this volunteer)
  const pendingRequests = await prisma.sathiVisitRequest.findMany({
    where: {
      beneficiaryId: { in: beneficiaryIds },
      status: 'PENDING',
      NOT: {
        rejectedBy: { has: id }
      }
    },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          photo: true,
          age: true,
          address: true,
          hobbiesInterests: true
        }
      }
    },
    orderBy: { dateTime: 'asc' }
  });

  // Fetch upcoming accepted and in-progress visits for this volunteer
  const upcomingVisits = await prisma.sathiVisitRequest.findMany({
    where: {
      volunteerId: id,
      status: { in: ['ACCEPTED', 'IN_PROGRESS'] }
    },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          photo: true,
          age: true,
          address: true
        }
      }
    },
    orderBy: { dateTime: 'asc' }
  });

  const cooldownDays = parseInt(await getSystemConfig('sathi_reapply_cooldown_days', '30'), 10);
  let reapplyAllowedAfter: string | null = null;
  if (volunteer.applicationStatus === 'REJECTED' && volunteer.rejectedAt) {
    const allowedDate = new Date(volunteer.rejectedAt);
    allowedDate.setDate(allowedDate.getDate() + cooldownDays);
    reapplyAllowedAfter = allowedDate.toISOString();
  }

  return {
    applicationStatus: volunteer.applicationStatus,
    rejectionReason: volunteer.rejectionReason,
    rejectedAt: volunteer.rejectedAt ? volunteer.rejectedAt.toISOString() : null,
    reapplyAllowedAfter,
    cooldownDays,
    name: volunteer.name,
    city: volunteer.city,
    state: volunteer.state,
    profilePhoto: volunteer.profilePhoto,
    totalCreditHours: volunteer.totalCreditHours,
    totalCreditPoints: volunteer.totalCreditPoints,
    monthlyGoalHours: volunteer.monthlyGoalHours,
    beneficiariesCount: volunteer.assignments.length,
    activeVisit: volunteer.visitLogs[0] || null,
    assignedBeneficiaries: volunteer.assignments.map(a => ({
      id: a.beneficiary.id,
      name: a.beneficiary.name,
      photo: a.beneficiary.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      age: a.beneficiary.age,
      location: a.beneficiary.address,
      hobbies: a.beneficiary.hobbiesInterests || [],
      assignedAt: a.createdAt.toISOString()
    })),
    visitRequests: pendingRequests.map(r => ({
      id: r.id,
      beneficiaryId: r.beneficiaryId,
      name: r.beneficiary.name,
      photo: r.beneficiary.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
      age: r.beneficiary.age,
      location: r.beneficiary.address,
      dateTime: r.dateTime.toISOString(),
      reason: r.reason,
      bio: '', // Beneficiary has no bio field in Prisma schema
      hobbies: r.beneficiary.hobbiesInterests || []
    })),
    upcomingVisits: upcomingVisits.map(v => {
      const assignment = volunteer.assignments.find(a => a.beneficiaryId === v.beneficiaryId);
      return {
        id: v.id,
        beneficiaryId: v.beneficiaryId,
        assignmentId: assignment ? assignment.id : undefined,
        name: v.beneficiary.name,
        photo: v.beneficiary.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        age: v.beneficiary.age,
        location: v.beneficiary.address,
        dateTime: v.dateTime.toISOString(),
        reason: v.reason,
        status: v.status
      };
    })
  };
};

export const getVolunteerMatches = async (id: string) => {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id }
  });

  if (!volunteer || volunteer.applicationStatus !== 'APPROVED') {
    return [];
  }

  const assignments = await prisma.volunteerAssignment.findMany({
    where: { volunteerId: id, isActive: true },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          photo: true,
          age: true,
          gender: true,
          address: true,
          hobbiesInterests: true,
        }
      },
      visitLogs: {
        where: { status: 'completed' },
        orderBy: { checkInTime: 'desc' },
        select: { checkInTime: true }
      }
    }
  });

  return assignments.map(a => {
    const totalVisits = a.visitLogs.length;
    const lastVisitDate = a.visitLogs.length > 0 ? a.visitLogs[0].checkInTime : null;
    
    return {
      assignmentId: a.id,
      beneficiary: a.beneficiary,
      assignedAt: a.createdAt,
      totalVisits: totalVisits,
      lastVisit: lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('en-US') : null,
    };
  });
};

export const getVolunteerMatchDetail = async (volunteerId: string, beneficiaryId: string) => {
  const assignment = await prisma.volunteerAssignment.findFirst({
    where: {
      volunteerId,
      beneficiaryId,
      isActive: true
    },
    include: {
      beneficiary: true
    }
  });

  if (!assignment) {
    throw new ApiError(404, 'No active companion assignment found for this beneficiary.');
  }

  return assignment.beneficiary;
};

export const checkinVolunteerVisit = async (volunteerId: string, data: any) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } });
  if (!volunteer || volunteer.applicationStatus !== 'APPROVED') {
    throw new ApiError(403, 'Your profile is not verified. Check-in is disabled.');
  }

  const { beneficiaryId, assignmentId, notes } = data;

  const activeCheckin = await prisma.volunteerVisitLog.findFirst({
    where: { volunteerId, status: 'in_progress' }
  });

  if (activeCheckin) {
    throw new ApiError(400, 'You already have an active check-in session. Please check-out first.');
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { id: assignmentId, volunteerId, beneficiaryId, isActive: true }
  });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found or inactive.');
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      beneficiaryId,
      isActive: true,
      benefitBalances: {
        some: {
          benefit: {
            benefitType: { name: 'Sathi Companion' }
          }
        }
      }
    },
    include: {
      benefitBalances: {
        include: { benefit: { include: { benefitType: true } } }
      }
    }
  });

  if (!subscription) {
    throw new ApiError(400, 'Beneficiary does not have an active subscription with Sathi Companion benefits.');
  }

  const sathiBalance = subscription.benefitBalances.find(
    b => b.benefit.benefitType.code === 'SATHI_COMPANION' || b.benefit.benefitType.name.toLowerCase().includes('sathi')
  );

  if (!sathiBalance || (sathiBalance.totalUnits - sathiBalance.usedUnits) <= 0) {
    throw new ApiError(400, 'Beneficiary has exhausted their Sathi Companion benefit hours.');
  }

  const visitLog = await prisma.volunteerVisitLog.create({
    data: {
      volunteerId,
      beneficiaryId,
      assignmentId,
      subscriptionId: subscription.id,
      subscriptionBenefitBalanceId: sathiBalance.id,
      checkInTime: new Date(),
      status: 'in_progress',
      notes: notes || null,
    }
  });

  return visitLog;
};

export const checkoutVolunteerVisit = async (volunteerId: string, visitLogId: string, notes?: string) => {
  const visitLog = await prisma.volunteerVisitLog.findFirst({
    where: { id: visitLogId, volunteerId, status: 'in_progress' }
  });

  if (!visitLog) {
    throw new ApiError(404, 'Active visit log session not found.');
  }

  const checkOutTime = new Date();
  const rawMinutes = (checkOutTime.getTime() - visitLog.checkInTime.getTime()) / 60000;

  const billableMinutes = rawMinutes;
  const hoursEarned = billableMinutes / 60;

  if (!visitLog.subscriptionBenefitBalanceId) {
    throw new ApiError(400, 'No linked benefit balance found for this session.');
  }

  const sathiBalance = await prisma.subscriptionBenefitBalance.findUnique({
    where: { id: visitLog.subscriptionBenefitBalanceId }
  });

  if (!sathiBalance) {
    throw new ApiError(404, 'Beneficiary benefit balance not found.');
  }

  const currentRemaining = sathiBalance.totalUnits - sathiBalance.usedUnits;
  if (currentRemaining < hoursEarned) {
    throw new ApiError(400, `Insufficient Sathi benefits remaining. Beneficiary has only ${currentRemaining.toFixed(2)} hours left, visit clocked ${hoursEarned.toFixed(2)} hours.`);
  }

  const creditRateStr = await getSystemConfig('SATHI_CREDIT_RATE', '10');
  const creditRate = parseFloat(creditRateStr);
  const pointsEarned = hoursEarned * creditRate;

  const result = await prisma.$transaction(async (tx) => {
    await tx.subscriptionBenefitBalance.update({
      where: { id: visitLog.subscriptionBenefitBalanceId! },
      data: { usedUnits: { increment: hoursEarned } }
    });

    const volunteer = await tx.volunteer.findUnique({
      where: { id: volunteerId }
    });

    if (!volunteer) {
      throw new Error('Volunteer record not found inside transaction.');
    }

    const newHoursTotal = volunteer.totalCreditHours + hoursEarned;
    const newPointsTotal = volunteer.totalCreditPoints + pointsEarned;

    await tx.volunteer.update({
      where: { id: volunteerId },
      data: {
        totalCreditHours: newHoursTotal,
        totalCreditPoints: newPointsTotal
      }
    });

    await tx.volunteerCreditTransaction.create({
      data: {
        volunteerId,
        visitLogId: visitLog.id,
        type: 'earned',
        minutesDelta: rawMinutes,
        pointsDelta: pointsEarned,
        balanceAfter: newPointsTotal,
        description: `Completed volunteering session with Beneficiary.`
      }
    });

    const completedLog = await tx.volunteerVisitLog.update({
      where: { id: visitLog.id },
      data: {
        checkOutTime,
        minutesLogged: rawMinutes,
        hoursEarned,
        creditPointsEarned: pointsEarned,
        beneficiaryBalanceBefore: currentRemaining,
        beneficiaryBalanceAfter: currentRemaining - hoursEarned,
        status: 'completed',
        notes: notes ? `${visitLog.notes || ''}\n\nCheckout Notes: ${notes}`.trim() : visitLog.notes
      }
    });

    return completedLog;
  });

  return {
    result,
    message: `Checked out successfully. Earned ${hoursEarned.toFixed(1)} credit hours / ${pointsEarned.toFixed(0)} points.`
  };
};

export const getVolunteerVisitLogs = async (volunteerId: string) => {
  const logs = await prisma.volunteerVisitLog.findMany({
    where: { volunteerId, status: 'completed' },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          photo: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return logs;
};

export const getVolunteerCreditTransactions = async (volunteerId: string) => {
  const txs = await prisma.volunteerCreditTransaction.findMany({
    where: { volunteerId },
    orderBy: { createdAt: 'desc' }
  });
  return txs;
};



export const proposeRescheduleForSathiRequest = async (
  volunteerId: string,
  requestId: string,
  proposedDateTime: string,
  message?: string
) => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId },
    include: { beneficiary: true }
  });

  if (!request) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { volunteerId, beneficiaryId: request.beneficiaryId, isActive: true }
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned as a companion to this beneficiary.');
  }

  if (!['PENDING', 'RESCHEDULE_PROPOSED'].includes(request.status)) {
    throw new ApiError(400, `Cannot propose reschedule for a request with status: ${request.status}.`);
  }

  const proposed = new Date(proposedDateTime);
  if (isNaN(proposed.getTime())) {
    throw new ApiError(400, 'Invalid proposed date/time.');
  }

  const updatedRequest = await prisma.sathiVisitRequest.update({
    where: { id: requestId },
    data: {
      status: 'RESCHEDULE_PROPOSED',
      proposedDateTime: proposed,
      proposedBy: volunteerId,
      rejectionReason: message || null
    },
    include: { beneficiary: true }
  });

  return { request: updatedRequest, message: 'Reschedule proposal sent to beneficiary.' };
};

export const getVolunteerSathiRequests = async (volunteerId: string) => {
  const assignments = await prisma.volunteerAssignment.findMany({
    where: { volunteerId, isActive: true },
    select: { beneficiaryId: true }
  });

  const beneficiaryIds = assignments.map(a => a.beneficiaryId);

  const requests = await prisma.sathiVisitRequest.findMany({
    where: {
      beneficiaryId: { in: beneficiaryIds },
      status: 'PENDING',
      OR: [
        { volunteerId: null },
        { volunteerId: volunteerId }
      ],
      NOT: {
        rejectedBy: { has: volunteerId }
      }
    },
    include: {
      beneficiary: {
        select: {
          id: true,
          name: true,
          photo: true,
          age: true,
          address: true
        }
      }
    },
    orderBy: { dateTime: 'asc' }
  });

  return requests;
};



export const respondToSathiVisitRequest = async (
  volunteerId: string,
  requestId: string,
  action: 'ACCEPT' | 'REJECT',
  rejectionReason?: string
) => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId },
    include: { beneficiary: true }
  });

  if (!request) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { volunteerId, beneficiaryId: request.beneficiaryId, isActive: true }
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned as a companion to this beneficiary.');
  }

  if (request.status !== 'PENDING') {
    throw new ApiError(400, `This request has already been ${request.status.toLowerCase()}.`);
  }

  if (action === 'ACCEPT') {
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const updatedRequest = await prisma.sathiVisitRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        volunteerId,
        otpCode
      },
      include: { beneficiary: true }
    });

    return { request: updatedRequest, message: 'Visit request accepted successfully.' };
  } else {
    const updatedRejectedBy = [...request.rejectedBy, volunteerId];

    const allAssignments = await prisma.volunteerAssignment.findMany({
      where: { beneficiaryId: request.beneficiaryId, isActive: true },
      select: { volunteerId: true }
    });
    const allVolunteerIds = allAssignments.map(a => a.volunteerId);

    const allRejected = allVolunteerIds.every(vid => updatedRejectedBy.includes(vid));

    const updatedRequest = await prisma.sathiVisitRequest.update({
      where: { id: requestId },
      data: {
        rejectedBy: updatedRejectedBy,
        status: allRejected ? 'REJECTED' : 'PENDING',
        rejectionReason: allRejected ? (rejectionReason || 'Rejected by all assigned companions') : undefined
      },
      include: { beneficiary: true }
    });

    return { request: updatedRequest, message: 'Visit request rejected.' };
  }
};

export const verifySathiVisitOtp = async (volunteerId: string, requestId: string, otpCode: string) => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  if (request.volunteerId !== volunteerId) {
    throw new ApiError(403, 'You are not the assigned Sathi for this visit.');
  }

  if (request.status !== 'ACCEPTED') {
    throw new ApiError(400, 'This visit is not in an accepted state.');
  }

  if (request.otpCode !== otpCode) {
    throw new ApiError(400, 'Invalid OTP. Please check the code with the beneficiary and try again.');
  }

  const assignment = await prisma.volunteerAssignment.findFirst({
    where: { volunteerId, beneficiaryId: request.beneficiaryId, isActive: true }
  });

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found or inactive.');
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      beneficiaryId: request.beneficiaryId,
      isActive: true,
      benefitBalances: {
        some: {
          benefit: {
            benefitType: { name: 'Sathi Companion' }
          }
        }
      }
    },
    include: {
      benefitBalances: {
        include: { benefit: { include: { benefitType: true } } }
      }
    }
  });

  if (!subscription) {
    throw new ApiError(400, 'Beneficiary does not have an active subscription with Sathi Companion benefits.');
  }

  const sathiBalance = subscription.benefitBalances.find(
    b => b.benefit.benefitType.code === 'SATHI_COMPANION' || b.benefit.benefitType.name.toLowerCase().includes('sathi')
  );

  if (!sathiBalance || (sathiBalance.totalUnits - sathiBalance.usedUnits) <= 0) {
    throw new ApiError(400, 'Beneficiary has exhausted their Sathi Companion benefit hours.');
  }

  const updatedRequest = await prisma.sathiVisitRequest.update({
    where: { id: requestId },
    data: {
      status: 'IN_PROGRESS'
    }
  });

  // Start the timer session
  await prisma.volunteerVisitLog.create({
    data: {
      volunteerId,
      beneficiaryId: request.beneficiaryId,
      assignmentId: assignment.id,
      subscriptionId: subscription.id,
      subscriptionBenefitBalanceId: sathiBalance.id,
      checkInTime: new Date(),
      status: 'in_progress',
    }
  });

  return { request: updatedRequest, message: 'OTP verified. Visit timer started.' };
};

export const submitSathiVisitFeedback = async (
  volunteerId: string, 
  requestId: string, 
  feedbackNotes: string, 
  feedbackRating: number
) => {
  const request = await prisma.sathiVisitRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    throw new ApiError(404, 'Sathi visit request not found.');
  }

  if (request.volunteerId !== volunteerId) {
    throw new ApiError(403, 'You are not the assigned Sathi for this visit.');
  }

  if (request.status !== 'COMPLETED') {
    throw new ApiError(400, 'You can only submit feedback for completed visits.');
  }

  if (request.feedbackRating) {
    throw new ApiError(400, 'Feedback has already been submitted for this visit.');
  }

  const updatedRequest = await prisma.sathiVisitRequest.update({
    where: { id: requestId },
    data: {
      feedbackNotes,
      feedbackRating
    }
  });

  return { request: updatedRequest, message: 'Feedback submitted successfully.' };
};
