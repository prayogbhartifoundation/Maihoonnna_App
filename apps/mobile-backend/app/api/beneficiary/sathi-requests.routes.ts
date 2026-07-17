import { Router, Response } from 'express';
import { authenticate } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import * as beneficiarySathiService from '../../services/beneficiary/beneficiary_sathi_service';

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
    const eligibility = await beneficiarySathiService.getBeneficiarySathiEligibility(resolvedId);
    res.json(new ApiResponse(200, eligibility));
  })
);

// Route to get all Sathi visit requests made by the beneficiary
router.get(
  '/:beneficiaryId/sathi/my-requests',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const requests = await beneficiarySathiService.getBeneficiarySathiRequests(resolvedId);
    res.json(new ApiResponse(200, requests));
  })
);

// Route to get linked volunteers for the beneficiary
router.get(
  '/:beneficiaryId/sathi/volunteers',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const volunteers = await beneficiarySathiService.getLinkedVolunteers(resolvedId);
    res.json(new ApiResponse(200, volunteers));
  })
);

// Route to submit a Sathi visit request
router.post(
  '/:beneficiaryId/sathi/visit-requests',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const { dateTime, reason, targetVolunteerId } = req.body;
    const resolvedId = await resolveBeneficiaryId(req.params.beneficiaryId);
    const request = await beneficiarySathiService.createSathiVisitRequest(
      resolvedId,
      dateTime,
      reason,
      targetVolunteerId
    );
    res.status(201).json(new ApiResponse(201, request, 'Sathi visit request submitted successfully.'));
  })
);

export default router;
