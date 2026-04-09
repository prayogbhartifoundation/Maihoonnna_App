import { Router, Request, Response } from 'express';
import { authenticate } from '../shared/deps';
import prisma from '../../core/database';

const router = Router();

// GET /api/care-companion/profile
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // From authenticate middleware

    const cc = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        careCompanionProfile: true,
        staffProfile: true,
      },
    });

    if (!cc || !cc.careCompanionProfile) {
      return res.status(404).json({ success: false, message: 'Care Companion profile not found' });
    }

    // Calculate impact stats
    const totalVisits = await prisma.visit.count({
      where: { careCompanionId: cc.careCompanionProfile.id, status: 'completed' },
    });

    // Total hours = sum of durationMinutes / 60
    const visitsWithDuration = await prisma.visit.findMany({
      where: { careCompanionId: cc.careCompanionProfile.id, status: 'completed' },
      select: { durationMinutes: true },
    });
    const totalHours = visitsWithDuration.reduce((sum, v) => sum + (v.durationMinutes || 0), 0) / 60;

    const uniqueBeneficiaries = await prisma.visit.groupBy({
      by: ['beneficiaryId'],
      where: { careCompanionId: cc.careCompanionProfile.id },
    });

    res.json({
      success: true,
      data: {
        name: cc.name,
        initials: cc.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CC',
        role: 'Care Companion',
        verified: cc.isVerified,
        email: cc.email,
        phone: cc.phone,
        location: cc.careCompanionProfile.zone || 'N/A',
        memberSince: cc.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        impact: {
          visits: totalVisits,
          hours: Math.round(totalHours),
          clients: uniqueBeneficiaries.length,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/care-companion/profile/assigned-beneficiaries
router.get('/assigned-beneficiaries', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const cc = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        careCompanionProfile: true,
      },
    });

    if (!cc || !cc.careCompanionProfile) {
      return res.status(404).json({ success: false, message: 'Care Companion profile not found' });
    }

    const beneficiaries = await prisma.beneficiary.findMany({
      where: {
        OR: [
          { primaryCcId: cc.careCompanionProfile.id },
          { secondaryCcId: cc.careCompanionProfile.id }
        ],
        isActive: true
      },
      include: {
        subscriber: {
          select: { name: true, phone: true }
        }
      }
    });

    res.json({ success: true, data: beneficiaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
