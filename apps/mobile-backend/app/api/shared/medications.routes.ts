import { Router, Request, Response } from 'express';
import { authenticate, validate } from './deps';
import { createMedicationSchema, createAdherenceSchema } from '../../schemas/medication';
import * as medicationService from '../../services/shared/medication_service';

const router = Router();

router.get('/beneficiary/:beneficiaryId', authenticate, async (req: Request, res: Response) => {
  const meds = await medicationService.getBeneficiaryMedications(req.params.beneficiaryId as string);
  res.json({ success: true, data: meds });
});

router.post('/', authenticate, validate(createMedicationSchema), async (req: Request, res: Response) => {
  const med = await medicationService.createMedication(req.body);
  res.status(201).json({ success: true, data: med });
});

router.post('/adherence', authenticate, validate(createAdherenceSchema), async (req: Request, res: Response) => {
  const record = await medicationService.createAdherenceRecord(req.body);
  res.status(201).json({ success: true, data: record });
});

export default router;