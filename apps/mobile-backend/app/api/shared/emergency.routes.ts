import { Router, Request, Response } from 'express';
import { authenticate, validate } from './deps';
import { createEmergencySchema, updateEmergencySchema } from '../../schemas/emergency';
import * as emergencyService from '../../services/shared/emergency_service';

const router = Router();

router.post('/', authenticate, validate(createEmergencySchema), async (req: Request, res: Response) => {
  const emergency = await emergencyService.createEmergency(req.body);
  res.status(201).json({ success: true, data: emergency });
});

router.get('/active', authenticate, async (_req: Request, res: Response) => {
  const emergencies = await emergencyService.getActiveEmergencies();
  res.json({ success: true, data: emergencies });
});

router.put('/:emergencyId', authenticate, validate(updateEmergencySchema), async (req: Request, res: Response) => {
  try {
    const emergency = await emergencyService.updateEmergency(req.params.emergencyId as string, req.body);
    res.json({ success: true, data: emergency });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

export default router;