import { Router, Response } from 'express';
import { authenticate } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import * as emergencyService from '../../services/beneficiary/beneficiary_emergency_service';
import prisma from '../../core/database';

const router = Router();

async function resolveBeneficiaryId(idParam: string): Promise<string> {
  const beneficiary = await prisma.beneficiary.findFirst({
    where: {
      OR: [
        { id: idParam },
        { userId: idParam }
      ]
    }
  });
  if (!beneficiary) {
    throw new Error('Beneficiary record not found');
  }
  return beneficiary.id;
}

// GET eligibility for emergency support
router.get(
  '/:beneficiaryId/emergency/eligibility',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const eligibility = await emergencyService.getBeneficiaryEmergencyEligibility(resolvedId);
    res.json(new ApiResponse(200, eligibility));
  })
);

// POST trigger emergency alert
router.post(
  '/:beneficiaryId/emergency',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const { lat, lng, address, description } = req.body || {};
    const result = await emergencyService.triggerEmergencyRequest(
      resolvedId,
      req.user?.id || resolvedId,
      { lat, lng, address, description }
    );
    res.json(new ApiResponse(201, result, 'Emergency alert triggered successfully. Care team notified.'));
  })
);

export default router;
