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

      const summary = beneficiaries.map(b => {
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

      return res.json({ success: true, data: summary });
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

    recentLogs = rawLogs.map(log => {
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
        actualMinutes
      };
    });
  }

  return {
    type: 'detail',
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

export default router;
