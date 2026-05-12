import { Router, Request, Response } from 'express';
import { authenticate } from '../shared/deps';
import * as visitService from '../../services/care_companion/visit_service';

const router = Router();

// GET /api/care-companion/schedule
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const schedule = await visitService.getCareCompanionSchedule(userId);
    res.json({ success: true, data: { visits: schedule } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
