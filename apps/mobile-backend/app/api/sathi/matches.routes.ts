import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import * as sathiService from '../../services/sathi/sathi_service';

const router = Router();

router.get('/matches', authenticate, async (req: AuthRequest, res: Response) => {
  const matches = await sathiService.getVolunteerMatches(req.userId!);
  res.json(new ApiResponse(200, matches));
});

router.get('/matches/:beneficiaryId', authenticate, async (req: AuthRequest, res: Response) => {
  const beneficiary = await sathiService.getVolunteerMatchDetail(req.userId!, req.params.beneficiaryId as string);
  res.json(new ApiResponse(200, beneficiary));
});

export default router;
