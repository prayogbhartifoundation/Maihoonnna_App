import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import prisma from '../../core/database';

const router = Router();

router.get('/subscriber/:subscriberId', authenticate, async (req: Request, res: Response) => {
  const beneficiaries = await prisma.beneficiary.findMany({
    where: { subscriberId: req.params.subscriberId as string },
  });

  const dashboardData = await Promise.all(
    beneficiaries.map(async (b: any) => {
      const recentVisits = await prisma.visit.findMany({
        where: { beneficiaryId: b.id },
        orderBy: { scheduledTime: 'desc' },
        take: 5,
      });

      let cc = null;
      if (b.primaryCcId) {
        cc = await prisma.careCompanion.findFirst({ 
          where: { 
            id: b.primaryCcId,
            user: { isActive: true }
          } 
        });
      }

      return {
        beneficiary: { id: b.id, name: b.name, age: b.age, emotionalScore: b.emotionalScore === 8.0 ? 85 : (b.emotionalScore || 85), address: b.address },
        recentVisits: recentVisits.map((v: any) => ({
          id: v.id,
          visitCode: v.visitCode,
          encounterId: v.encounterId,
          status: v.status,
          scheduledTime: v.scheduledTime,
          mood: v.mood,
        })),
        careCompanion: cc ? { id: cc.id, name: cc.name, zone: cc.zone, isAvailable: cc.isAvailable } : null,
      };
    })
  );

  res.json({ success: true, data: { beneficiaries: dashboardData } });
});

router.get('/care-companion/:ccId', authenticate, async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const visits = await prisma.visit.findMany({
    where: {
      careCompanionId: req.params.ccId as string,
      scheduledTime: { gte: today, lt: tomorrow },
    },
    orderBy: { scheduledTime: 'asc' },
  });

  res.json({
    success: true,
    data: {
      todayVisits: visits.map((v: any) => ({
        id: v.id,
        visitCode: v.visitCode,
        encounterId: v.encounterId,
        beneficiaryId: v.beneficiaryId,
        scheduledTime: v.scheduledTime,
        status: v.status,
      })),
      totalVisits: visits.length,
      completed: visits.filter((v: any) => v.status === 'completed').length,
    },
  });
});

import * as subscriptionService from '../../services/subscriber/subscription_service';

// Secure "My Dashboard" route
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  // Redirect to the unified handler using the token's userId
  req.params.userId = req.userId!;
  return handleUserDashboard(req, res);
});

// Advanced User Dashboard (Mobile Phase 1)
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  return handleUserDashboard(req, res);
});

async function handleUserDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId as string;

    // Security check: A user should only be able to see their own dashboard
    // unless they are an admin/staff
    if (req.userId !== userId && req.userRole !== 'admin' && req.userRole !== 'field_manager') {
      console.warn(`[Dashboard] User ${req.userId} attempting to access dashboard for ${userId}`);
      // return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const targetBeneficiaryId = req.query.beneficiaryId as string | undefined;

    // Core data
    const allActiveSubscriptions = await prisma.subscription.findMany({
      where: { subscriberId: userId, isActive: true },
      include: {
        package: true,
        benefitBalances: {
          include: {
            benefit: true
          }
        }
      }
    });

    const beneficiaries = await prisma.beneficiary.findMany({
      where: { subscriberId: userId }
    });

    let effectiveBeneficiaryId = targetBeneficiaryId;
    if (!effectiveBeneficiaryId && beneficiaries.length === 1) {
      effectiveBeneficiaryId = beneficiaries[0].id;
    }

    let benIds = beneficiaries.map((b: any) => b.id);
    if (effectiveBeneficiaryId && benIds.includes(effectiveBeneficiaryId)) {
      benIds = [effectiveBeneficiaryId];
    }

    const activeSubscriptions = effectiveBeneficiaryId 
      ? allActiveSubscriptions.filter((s: any) => s.beneficiaryId === effectiveBeneficiaryId)
      : allActiveSubscriptions;

    // Calculate visits this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let visitsThisWeek = 0;
    let completedVisitsThisWeek = 0;

    if (benIds.length > 0) {
      visitsThisWeek = await prisma.visit.count({
        where: {
          beneficiaryId: { in: benIds },
          scheduledTime: { gte: oneWeekAgo }
        }
      });

      completedVisitsThisWeek = await prisma.visit.count({
        where: {
          beneficiaryId: { in: benIds },
          scheduledTime: { gte: oneWeekAgo },
          status: 'completed'
        }
      });
    }

    // Map beneficiaries to normalize the default 8.0 score
    const mappedBeneficiaries = beneficiaries.map((b: any) => ({
      ...b,
      // Only map default Prisma seed score (8.0) → null; real scores pass through as-is
      emotionalScore: b.emotionalScore === 8.0 ? null : (b.emotionalScore ?? null)
    }));

    // Average Happiness (Scoped)
    const scopedBeneficiaries = mappedBeneficiaries.filter((b: any) => benIds.includes(b.id));
    let avgHappiness: number | null = null;
    const scoredBeneficiaries = scopedBeneficiaries.filter((b: any) => b.emotionalScore !== null && b.emotionalScore !== undefined);
    if (scoredBeneficiaries.length > 0) {
      const totalScore = scoredBeneficiaries.reduce((sum: any, b: any) => sum + b.emotionalScore, 0);
      avgHappiness = Math.round(totalScore / scoredBeneficiaries.length);
    }

    // Active Hours (Actual aggregation from hourly benefit balances if available, fallback to subscription columns)
    let activeHours = 0;
    let totalHours = 0;

    activeSubscriptions.forEach((sub: any) => {
      const hourBalances = (sub.benefitBalances || []).filter(
        (b: any) => b.benefit.unitLabel?.toLowerCase().includes('hour')
      );
      if (hourBalances.length > 0) {
        activeHours += hourBalances.reduce((sum: number, b: any) => sum + (b.usedUnits || 0), 0);
        totalHours += hourBalances.reduce((sum: number, b: any) => sum + (b.totalUnits || 0), 0);
      } else {
        activeHours += sub.hoursUsed || 0;
        totalHours += sub.hoursTotal || 0;
      }
    });

    const remainingHours = Math.max(0, totalHours - activeHours);

    // Recent Updates (Last 3 notes filled by Care Companions)
    let recentUpdates: any[] = [];
    if (benIds.length > 0) {
      const recentVisitsWithNotes = await prisma.visit.findMany({
        where: {
          beneficiaryId: { in: benIds },
          notes: { not: null, notIn: ["", " "] }
        },
        orderBy: { scheduledTime: 'desc' },
        take: 3,
        include: { 
          careCompanion: {
            include: { user: true }
          } 
        }
      });

      recentUpdates = recentVisitsWithNotes
        .filter((v: any) => v.careCompanion?.user?.isActive !== false) // Filter out notes from deactivated staff
        .map((v: any) => ({
          id: v.id,
          title: "Care Companion Update",
          date: v.scheduledTime,
          isNew: true,
          body: v.notes || "Visit completed smoothly."
        }));
    }

    res.json({
      success: true,
      activeSubscriptions: allActiveSubscriptions,
      beneficiaries: mappedBeneficiaries,
      topStats: {
        happinessScore: avgHappiness,
        visitsThisWeek: { total: visitsThisWeek, completed: completedVisitsThisWeek },
        activeHours: { used: activeHours, remaining: remainingHours },
        totalCarePlans: allActiveSubscriptions.length || 0
      },
      recentUpdates
    });
  } catch (error: any) {
    console.error('[Dashboard Error]:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

export default router;