import { Router, Request, Response } from 'express';
import { authenticate, validate } from '../shared/deps';
import { createBeneficiarySchema, updateBeneficiarySchema } from '../../schemas/beneficiary';
import * as beneficiaryService from '../../services/subscriber/beneficiary_service';

const router = Router();

// Beneficiaries
router.post('/', authenticate, validate(createBeneficiarySchema), async (req: Request, res: Response) => {
  const b = await beneficiaryService.createBeneficiary(req.body);
  res.status(201).json({ success: true, data: b });
});

router.get('/subscriber/:subscriberId', authenticate, async (req: Request, res: Response) => {
  const list = await beneficiaryService.getSubscriberBeneficiaries(req.params.subscriberId as string);
  res.json({ success: true, data: list });
});

router.get('/:beneficiaryId', async (req: Request, res: Response) => {
  try {
    const b = await beneficiaryService.getBeneficiary(req.params.beneficiaryId as string);
    res.json({ success: true, data: b });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.put('/:beneficiaryId', authenticate, validate(updateBeneficiarySchema), async (req: Request, res: Response) => {
  try {
    const b = await beneficiaryService.updateBeneficiary(req.params.beneficiaryId as string, req.body);
    res.json({ success: true, data: b });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

export default router;