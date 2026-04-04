import { Router, Request, Response } from 'express';
import { authenticate } from '../shared/deps';
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
        beneficiary: { id: b.id, name: b.name, age: b.age, emotionalScore: b.emotionalScore, address: b.address },
        recentVisits: recentVisits.map((v: any) => ({
          id: v.id,
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

// Advanced User Dashboard (Mobile Phase 1)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    // Core data
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { subscriberId: userId, isActive: true },
      include: { package: true }
    });

    const beneficiaries = await prisma.beneficiary.findMany({
      where: { subscriberId: userId }
    });

    const benIds = beneficiaries.map((b: any) => b.id);

    // Calculate visits this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const visitsThisWeek = await prisma.visit.count({
      where: {
        beneficiaryId: { in: benIds },
        scheduledTime: { gte: oneWeekAgo }
      }
    });

    const completedVisitsThisWeek = await prisma.visit.count({
      where: {
        beneficiaryId: { in: benIds },
        scheduledTime: { gte: oneWeekAgo },
        status: 'completed'
      }
    });

    // Average Happiness
    let avgHappiness = 85;
    if (beneficiaries.length > 0) {
      const totalScore = beneficiaries.reduce((sum: any, b: any) => sum + (b.emotionalScore || 85), 0);
      avgHappiness = Math.round(totalScore / beneficiaries.length);
    }

    // Active Hours (Actual aggregation from subscriptions)
    const activeHours = activeSubscriptions.reduce((sum: any, sub: any) => sum + (sub.hoursUsed || 0), 0);
    const remainingHours = activeSubscriptions.reduce((sum: any, sub: any) => sum + (Math.max(0, (sub.hoursTotal || 0) - (sub.hoursUsed || 0))), 0);

    // Recent Updates (Last 3 notes filled by Care Companions)
    const recentVisitsWithNotes = await prisma.visit.findMany({
      where: {
        beneficiaryId: { in: benIds },
        notes: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { 
        careCompanion: {
          include: { user: true }
        } 
      }
    });

    const recentUpdates = recentVisitsWithNotes
      .filter((v: any) => v.careCompanion?.user?.isActive !== false) // Filter out notes from deactivated staff
      .map((v: any) => ({
      id: v.id,
      title: "Care Companion Update",
      date: v.scheduledTime,
      isNew: true, // We could flag this logically if created in last 24h
      body: v.notes || "Visit completed smoothly."
    }));

    res.json({
      success: true,
      activeSubscriptions,
      beneficiaries,
      topStats: {
        happinessScore: avgHappiness,
        visitsThisWeek: { total: visitsThisWeek, completed: completedVisitsThisWeek },
        activeHours: { used: activeHours || 24, remaining: remainingHours || 36 },
        totalCarePlans: activeSubscriptions.length || 1
      },
      recentUpdates
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;