import { Router, Response } from 'express';
import { authenticate } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import * as sathiService from '../../services/sathi/sathi_service';

const router = Router();

// GET /sathi/visit-requests -> list pending Sathi requests for volunteer
router.get(
  '/visit-requests',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const requests = await sathiService.getVolunteerSathiRequests(req.userId!);
    res.json(new ApiResponse(200, requests));
  })
);

// POST /sathi/visit-requests/:requestId/respond -> accept or reject Sathi request
router.post(
  '/visit-requests/:requestId/respond',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const { action, rejectionReason } = req.body;
    if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be ACCEPT or REJECT.' });
    }
    const result = await sathiService.respondToSathiVisitRequest(
      req.userId!,
      req.params.requestId,
      action,
      rejectionReason
    );
    res.json(new ApiResponse(200, result.request, result.message));
  })
);

export default router;
