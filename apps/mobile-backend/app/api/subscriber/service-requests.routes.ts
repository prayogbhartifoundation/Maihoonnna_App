import { Router } from 'express';
import { authenticate } from '../shared/deps';
import { asyncHandler } from '../../utils/asyncHandler';
import * as serviceRequestsController from '../../controllers/subscriber/service-requests.controller';

const router = Router();

router.post('/', authenticate, asyncHandler(serviceRequestsController.createServiceRequest));
router.get('/', authenticate, asyncHandler(serviceRequestsController.getServiceRequests));

export default router;
