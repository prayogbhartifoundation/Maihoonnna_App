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

// POST /sathi/visit-requests/:requestId/respond -> accept Sathi request (no reject — use propose-reschedule instead)
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

// POST /sathi/visit-requests/:requestId/propose-reschedule -> volunteer proposes a new date/time
router.post(
  '/visit-requests/:requestId/propose-reschedule',
  authenticate,
  asyncHandler(async (req: any, res: Response) => {
    const { proposedDateTime, message } = req.body;
    if (!proposedDateTime) {
      return res.status(400).json({ success: false, message: 'proposedDateTime is required.' });
    }
    const result = await sathiService.proposeRescheduleForSathiRequest(
      req.userId!,
      req.params.requestId,
      proposedDateTime,
      message
    );
    res.json(new ApiResponse(200, result.request, result.message));
  })
);

export default router;
