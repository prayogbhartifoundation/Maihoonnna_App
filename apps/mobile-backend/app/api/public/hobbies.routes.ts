import { Router, Request, Response } from 'express';
import prisma from '../../core/database';

const router = Router();

// GET /api/public/hobbies
// Public endpoint to fetch configured hobbies
router.get('/', async (req: Request, res: Response) => {
  const { activeOnly } = req.query;
  
  try {
    const where: any = {};
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    const hobbies = await prisma.hobby.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    
    res.json({ success: true, data: hobbies });
  } catch (error: any) {
    console.error('Error fetching hobbies in mobile-backend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch hobbies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
