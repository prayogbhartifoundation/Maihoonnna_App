import { Router } from 'express';
import prisma from '../../core/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [bestPractices, suggestedActivities, faqs] = await Promise.all([
      prisma.saathiBestPractice.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.saathiSuggestedActivity.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.saathiFaq.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        bestPractices,
        suggestedActivities,
        faqs,
      },
    });
  } catch (error) {
    console.error('Error fetching guide data:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
