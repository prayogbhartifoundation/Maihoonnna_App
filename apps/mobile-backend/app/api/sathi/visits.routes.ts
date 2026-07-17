import { Router, Response } from 'express';
import { validate, authenticate, AuthRequest } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import * as sathiService from '../../services/sathi/sathi_service';
import {
  volunteerCheckinSchema,
  volunteerCheckoutSchema,
} from '../../schemas/sathi';

const router = Router();

router.post('/visits/checkin', authenticate, validate(volunteerCheckinSchema), async (req: AuthRequest, res: Response) => {
  const visitLog = await sathiService.checkinVolunteerVisit(req.userId!, req.body);
  res.status(201).json(new ApiResponse(201, visitLog, 'Checked in successfully'));
});

router.patch('/visits/:id/checkout', authenticate, validate(volunteerCheckoutSchema), async (req: AuthRequest, res: Response) => {
  const { result, message } = await sathiService.checkoutVolunteerVisit(req.userId!, req.params.id as string, req.body.notes);
  res.json(new ApiResponse(200, result, message));
});

router.get('/hours', authenticate, async (req: AuthRequest, res: Response) => {
  const logs = await sathiService.getVolunteerVisitLogs(req.userId!);
  res.json(new ApiResponse(200, logs));
});

router.get('/credits', authenticate, async (req: AuthRequest, res: Response) => {
  const txs = await sathiService.getVolunteerCreditTransactions(req.userId!);
  res.json(new ApiResponse(200, txs));
});

export default router;
