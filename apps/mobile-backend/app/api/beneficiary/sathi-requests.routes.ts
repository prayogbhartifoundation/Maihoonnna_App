import { Router, Response } from 'express';
import { authenticate } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import * as sathiService from '../../services/sathi/sathi_service';

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
    throw new Error('Beneficiary not found');
  }
  return beneficiary.id;
}

// Route to check if beneficiary is eligible to request Sathi visits
router.get(
  '/:beneficiaryId/sathi/eligibility',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const eligibility = await sathiService.getBeneficiarySathiEligibility(resolvedId);
    res.json(new ApiResponse(200, eligibility));
  })
);

// Route to submit a Sathi visit request
router.post(
  '/:beneficiaryId/sathi/visit-requests',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const { dateTime, reason } = req.body;
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const request = await sathiService.createSathiVisitRequest(
      resolvedId,
      dateTime,
      reason
    );
    res.status(201).json(new ApiResponse(201, request, 'Sathi visit request submitted successfully.'));
  })
);

export default router;
