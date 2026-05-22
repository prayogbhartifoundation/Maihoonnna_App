import { Router } from 'express';
import { authenticate } from '../shared/deps';
import { asyncHandler } from '../../utils/asyncHandler';
import * as addressesController from '../../controllers/subscriber/addresses.controller';

const router = Router();

router.post('/', authenticate, asyncHandler(addressesController.createAddress));
router.get('/', authenticate, asyncHandler(addressesController.getAddresses));

export default router;
