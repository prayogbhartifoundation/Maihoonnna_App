import { Router, Response } from 'express';
import prisma from '../../core/database';
import { authenticate, AuthRequest } from './deps';

const router = Router();

// GET /api/shared/utilization
// Subscriber: Returns summary of all beneficiaries
// Beneficiary: Returns detailed utilization for self
// Subscriber (with ?beneficiaryId=xxx): Returns detailed utilization for that beneficiary (if owned)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, userRole } = req;
    const { beneficiaryId } = req.query;

    if (!userId || !userRole) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 1: Beneficiary requesting their own detailed utilization
    // ─────────────────────────────────────────────────────────────────
    if (userRole === 'beneficiary') {
      const beneficiary = await prisma.beneficiary.findFirst({
        where: {
          OR: [{ id: userId }, { userId: userId }]
        },
        select: {
          id: true,
          subscriptions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              package: { select: { id: true, name: true, type: true } },
              benefitBalances: {
                include: {
                  benefit: { select: { id: true, name: true, unitLabel: true, benefitType: { select: { name: true } } } }
                }
              }
            }
          }
        }
      });

      if (!beneficiary) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found' });
      }

      return res.json({ success: true, data: await buildDetailedUtilization(beneficiary) });
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 2: Subscriber requesting a specific beneficiary's details
    // ─────────────────────────────────────────────────────────────────
    if (userRole === 'subscriber' && beneficiaryId) {
      if (String(beneficiaryId).startsWith('unlinked-')) {
        const subId = String(beneficiaryId).replace('unlinked-', '');
        const unlinkedSubscription = await prisma.subscription.findFirst({
          where: { id: subId, subscriberId: userId, isActive: true },
          include: {
            package: { select: { id: true, name: true, type: true } },
            benefitBalances: {
              include: {
                benefit: { select: { id: true, name: true, unitLabel: true, benefitType: { select: { name: true } } } }
              }
            }
          }
        });

        if (!unlinkedSubscription) {
          return res.status(404).json({ success: false, message: 'Unlinked subscription not found' });
        }

        const formattedBenefits = (unlinkedSubscription.benefitBalances || []).map((bal: any) => {
          const remaining = Math.max(0, bal.totalUnits - bal.usedUnits);
          const usagePercent = bal.totalUnits > 0 ? Math.round((bal.usedUnits / bal.totalUnits) * 100) : 0;
          return {
            benefitId: bal.benefitId,
            benefitName: bal.benefit?.name,
            unitLabel: bal.benefit?.unitLabel || 'units',
            benefitTypeName: bal.benefit?.benefitType?.name || null,
            totalUnits: bal.totalUnits,
            usedUnits: bal.usedUnits,
            remainingUnits: remaining,
            usagePercent,
            isLowBalance: bal.totalUnits > 0 && (remaining / bal.totalUnits) < 0.2,
            isExhausted: bal.totalUnits > 0 && remaining === 0,
          };
        });

        return res.json({
          success: true,
          data: {
            type: 'detail',
            subscription: {
              id: unlinkedSubscription.id,
              packageName: unlinkedSubscription.package?.name || unlinkedSubscription.packageType,
              packageType: unlinkedSubscription.packageType,
              startDate: unlinkedSubscription.startDate,
              endDate: unlinkedSubscription.endDate,
              isActive: unlinkedSubscription.isActive,
            },
            benefits: formattedBenefits,
            recentLogs: []
          }
        });
      }

      // Ensure the requested beneficiary belongs to this subscriber
      const beneficiary = await prisma.beneficiary.findFirst({
        where: {
          id: String(beneficiaryId),
          subscriberId: userId,
          isActive: true
        },
        select: {
          id: true,
          subscriptions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              package: { select: { id: true, name: true, type: true } },
              benefitBalances: {
                include: {
                  benefit: { select: { id: true, name: true, unitLabel: true, benefitType: { select: { name: true } } } }
                }
              }
            }
          }
        }
      });

      if (!beneficiary) {
        return res.status(404).json({ success: false, message: 'Beneficiary not found or unauthorized' });
      }

      return res.json({ success: true, data: await buildDetailedUtilization(beneficiary) });
    }

    // ─────────────────────────────────────────────────────────────────
    // SCENARIO 3: Subscriber requesting summary of all beneficiaries
    // ─────────────────────────────────────────────────────────────────
    if (userRole === 'subscriber' && !beneficiaryId) {
      // 1. Fetch normal beneficiaries
      const beneficiaries = await prisma.beneficiary.findMany({
        where: { subscriberId: userId, isActive: true },
        select: {
          id: true,
          name: true,
          age: true,
          subscriptions: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              package: { select: { id: true, name: true, type: true } },
              benefitBalances: {
                include: {
                  benefit: { select: { id: true, name: true, unitLabel: true } }
                }
              }
            }
          }
        }
      });

      // 2. Fetch unlinked active subscriptions
      const unlinkedSubscriptions = await prisma.subscription.findMany({
        where: { subscriberId: userId, isActive: true, beneficiaryId: null },
        include: { package: { select: { name: true } } }
      });

      // If they have no beneficiaries at all, AND have an unlinked sub, return unlinked detailed view
      if (beneficiaries.length === 0 && unlinkedSubscriptions.length > 0) {
        const unlinkedSubscription = unlinkedSubscriptions[0];
        const detailedSubscription = await prisma.subscription.findUnique({
          where: { id: unlinkedSubscription.id },
          include: {
            package: { select: { id: true, name: true, type: true } },
            benefitBalances: {
              include: {
                benefit: { select: { id: true, name: true, unitLabel: true, benefitType: { select: { name: true } } } }
              }
            }
          }
        });

        if (detailedSubscription) {
          const formattedBenefits = (detailedSubscription.benefitBalances || []).map((bal: any) => {
            const remaining = Math.max(0, bal.totalUnits - bal.usedUnits);
            const usagePercent = bal.totalUnits > 0 ? Math.round((bal.usedUnits / bal.totalUnits) * 100) : 0;
            return {
              benefitId: bal.benefitId,
              benefitName: bal.benefit?.name,
              unitLabel: bal.benefit?.unitLabel || 'units',
              benefitTypeName: bal.benefit?.benefitType?.name || null,
              totalUnits: bal.totalUnits,
              usedUnits: bal.usedUnits,
              remainingUnits: remaining,
              usagePercent,
              isLowBalance: bal.totalUnits > 0 && (remaining / bal.totalUnits) < 0.2,
              isExhausted: bal.totalUnits > 0 && remaining === 0,
            };
          });

          return res.json({
            success: true,
            data: {
              type: 'detail',
              subscription: {
                id: detailedSubscription.id,
                packageName: detailedSubscription.package?.name || detailedSubscription.packageType,
                packageType: detailedSubscription.packageType,
                startDate: detailedSubscription.startDate,
                endDate: detailedSubscription.endDate,
                isActive: detailedSubscription.isActive,
              },
              benefits: formattedBenefits,
              recentLogs: []
            }
          });
        }
      }

      // 3. Map unlinked subscriptions to summary objects
      const unlinkedSummaries = unlinkedSubscriptions.map(sub => ({
        beneficiaryId: `unlinked-${sub.id}`,
        beneficiaryName: 'Unassigned Care Plan',
        age: 0,
        activePackage: sub.package?.name || sub.packageType,
        hasLowBalance: false,
        hasExhausted: false,
        isUnlinked: true
      }));

      // 4. Map normal beneficiaries to summary objects
      const normalSummaries = beneficiaries.map(b => {
        const activeSub = b.subscriptions?.[0] || null;
        const benefits = (activeSub?.benefitBalances || []).map(bal => {
          const remaining = Math.max(0, bal.totalUnits - bal.usedUnits);
          const usagePercent = bal.totalUnits > 0 ? Math.round((bal.usedUnits / bal.totalUnits) * 100) : 0;
          return {
            benefitId: bal.benefitId,
            benefitName: bal.benefit?.name,
            totalUnits: bal.totalUnits,
            usedUnits: bal.usedUnits,
            remainingUnits: remaining,
            usagePercent,
            isLowBalance: bal.totalUnits > 0 && remaining / bal.totalUnits < 0.2,
            isExhausted: bal.totalUnits > 0 && remaining === 0,
          };
        });

        return {
          type: 'summary',
          beneficiaryId: b.id,
          beneficiaryName: b.name,
          age: b.age,
          activePackage: activeSub?.package?.name || null,
          subscriptionEndDate: activeSub?.endDate || null,
          benefits,
          hasLowBalance: benefits.some(x => x.isLowBalance),
          hasExhausted: benefits.some(x => x.isExhausted),
        };
      });

      return res.json({ success: true, data: [...normalSummaries, ...unlinkedSummaries] });
    }

    return res.status(400).json({ success: false, message: 'Invalid request parameters' });
  } catch (error: any) {
    console.error('GET /api/shared/utilization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to build detailed utilization response for a single beneficiary
async function buildDetailedUtilization(beneficiary: any) {
  const activeSub = beneficiary.subscriptions?.[0] || null;
  
  let formattedBenefits: any[] = [];
  let recentLogs: any[] = [];

  if (activeSub) {
    formattedBenefits = (activeSub.benefitBalances || []).map((bal: any) => {
      const remaining = Math.max(0, bal.totalUnits - bal.usedUnits);
      const usagePercent = bal.totalUnits > 0 ? Math.round((bal.usedUnits / bal.totalUnits) * 100) : 0;
      return {
        benefitId: bal.benefitId,
        benefitName: bal.benefit?.name,
        unitLabel: bal.benefit?.unitLabel || 'units',
        benefitTypeName: bal.benefit?.benefitType?.name || null,
        totalUnits: bal.totalUnits,
        usedUnits: bal.usedUnits,
        remainingUnits: remaining,
        usagePercent,
        isLowBalance: bal.totalUnits > 0 && (remaining / bal.totalUnits) < 0.2,
        isExhausted: bal.totalUnits > 0 && remaining === 0,
      };
    });

    const rawLogs = await prisma.packageHoursLog.findMany({
      where: { subscriptionId: activeSub.id, beneficiaryId: beneficiary.id },
      orderBy: { loggedAt: 'desc' },
      take: 30,
      include: {
        visit: {
          select: {
            checkInTime: true,
            checkOutTime: true,
            status: true,
            careCompanion: { select: { user: { select: { name: true } }, ccType: true } }
          }
        }
      }
    });

    const mappedLogs = rawLogs.map(log => {
      let actualMinutes = null;
      if (log.visit?.checkInTime && log.visit?.checkOutTime) {
        const ms = new Date(log.visit.checkOutTime).getTime() - new Date(log.visit.checkInTime).getTime();
        actualMinutes = Math.round(ms / 60000);
      }
      return {
        id: log.id,
        visitId: log.visitId,
        hoursConsumed: log.hoursConsumed,
        balanceBefore: log.balanceBefore,
        balanceAfter: log.balanceAfter,
        description: log.description,
        loggedAt: log.loggedAt,
        careCompanionName: log.visit?.careCompanion?.user?.name || 'Unknown',
        ccType: log.visit?.careCompanion?.ccType || null,
        visitStatus: log.visit?.status || null,
        actualMinutes,
        isRequest: false
      };
    });

    // Fetch service requests as activity logs
    const serviceReqs = await prisma.serviceRequest.findMany({
      where: { beneficiaryId: beneficiary.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        benefit: { select: { name: true } },
        requestedByUser: { select: { name: true } },
        subscriber: { select: { name: true } }
      }
    });

    const mappedRequests = serviceReqs.map(sr => {
      let requesterName = 'Beneficiary itself';
      if (sr.requestedByRole === 'subscriber') {
        requesterName = `Subscriber (${sr.requestedByUser?.name || sr.subscriber?.name || 'Subscriber'})`;
      } else if (sr.requestedByRole === 'care_companion') {
        requesterName = `Care Companion (${sr.requestedByUser?.name || 'Care Companion'})`;
      } else if (!sr.requestedByRole && sr.subscriberId) {
        requesterName = `Subscriber (${sr.subscriber?.name || 'Subscriber'})`;
      }
      return {
        id: sr.id,
        visitId: null,
        hoursConsumed: null,
        balanceBefore: null,
        balanceAfter: null,
        description: `Requested service: ${sr.benefit?.name || 'Service'}`,
        loggedAt: sr.createdAt,
        careCompanionName: requesterName,
        ccType: sr.preferredTiming,
        visitStatus: sr.isRead ? 'READ' : 'PENDING',
        actualMinutes: null,
        isRequest: true
      };
    });

    recentLogs = [...mappedLogs, ...mappedRequests].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    ).slice(0, 30);
  }

  return {
    type: 'detail',
    beneficiaryId: beneficiary.id,
    subscription: activeSub ? {
      id: activeSub.id,
      packageName: activeSub.package?.name,
      packageType: activeSub.package?.type,
      startDate: activeSub.startDate,
      endDate: activeSub.endDate,
      isActive: activeSub.isActive,
    } : null,
    benefits: formattedBenefits,
    recentLogs
  };
}

router.post('/request-service', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, userRole } = req;
    const { beneficiaryId, benefitId, preferredDate, preferredTiming, additionalNote } = req.body;

    if (!userId || !userRole) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!beneficiaryId || !benefitId || !preferredDate || !preferredTiming) {
      return res.status(400).json({ success: false, message: 'Missing required parameters: beneficiaryId, benefitId, preferredDate, and preferredTiming are required.' });
    }

    // Resolve subscriberId if userRole is subscriber
    const subscriberId = userRole === 'subscriber' ? userId : null;

    // Validate benefit balance is not exhausted
    const cleanBenId = String(beneficiaryId).replace('unlinked-', '');
    const activeSub = await prisma.subscription.findFirst({
      where: {
        OR: [
          { beneficiaryId: beneficiaryId },
          { id: cleanBenId }
        ],
        isActive: true
      },
      include: {
        benefitBalances: {
          where: { benefitId: benefitId }
        }
      }
    });

    if (activeSub && activeSub.benefitBalances && activeSub.benefitBalances.length > 0) {
      const balance = activeSub.benefitBalances[0];
      const remaining = balance.totalUnits - balance.usedUnits;
      if (balance.totalUnits > 0 && remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Benefit exhausted. Connect with support team to renew or upgrade your package.'
        });
      }
    }

    const request = await prisma.serviceRequest.create({
      data: {
        beneficiaryId,
        subscriberId,
        benefitId,
        preferredDate: new Date(preferredDate),
        preferredTiming,
        additionalNote: additionalNote || null,
        isRead: false,
        requestedByUserId: userId,
        requestedByRole: userRole
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Service request submitted successfully.',
      data: request
    });
  } catch (error: any) {
    console.error('POST /api/shared/utilization/request-service error:', error);
    res.status(500).json({ success: false, message: error.message || 'An error occurred while saving the service request.' });
  }
});

export default router;
