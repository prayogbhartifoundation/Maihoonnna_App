import { Router, Request, Response } from 'express';
import { authenticate, validate } from '../shared/deps';
import { createVisitSchema, checkInSchema, checkOutSchema, rateVisitSchema } from '../../schemas/visit';
import * as visitService from '../../services/care_companion/visit_service';

const router = Router();

router.post('/', authenticate, validate(createVisitSchema), async (req: Request, res: Response) => {
  const visit = await visitService.createVisit(req.body);
  res.status(201).json({ success: true, data: visit });
});

router.get('/beneficiary/:beneficiaryId', authenticate, async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const visits = await visitService.getBeneficiaryVisits(req.params.beneficiaryId as string, limit);
  res.json({ success: true, data: visits });
});

router.get('/care_companion/:ccId', authenticate, async (req: Request, res: Response) => {
  const visits = await visitService.getCareCompanionVisits(req.params.ccId as string, req.query.date as string);
  res.json({ success: true, data: visits });
});

router.post('/check-in', authenticate, validate(checkInSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.checkIn(req.body);
    res.json({ success: true, data: visit });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.post('/check-out', authenticate, validate(checkOutSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.checkOut(req.body);
    res.json({ success: true, data: visit });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.post('/rate', authenticate, validate(rateVisitSchema), async (req: Request, res: Response) => {
  try {
    const visit = await visitService.rateVisit(req.body);
    res.json({ success: true, data: visit });
  } catch (e: unknown) {
    res.status(400).json({ success: false, message: (e as Error).message });
  }
});

export default router;