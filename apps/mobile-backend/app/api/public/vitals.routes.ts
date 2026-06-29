import { Router, Request, Response } from 'express';
import prisma from '../../core/database';

const router = Router();

// GET /api/public/vitals
// Public endpoint for the mobile app onboarding flow to fetch available vitals
router.get('/', async (req: Request, res: Response) => {
  const { activeOnly } = req.query;
  
  try {
    const where: any = { isLatestVersion: true };
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const vitals = await prisma.vitalDefinition.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });
    
    res.json({ success: true, data: vitals });
  } catch (error: any) {
    console.error('Error fetching vitals in mobile-backend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch vitals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
