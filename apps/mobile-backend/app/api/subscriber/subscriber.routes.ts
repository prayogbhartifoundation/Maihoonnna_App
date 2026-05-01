import { Router } from 'express';
import { authenticate } from '../shared/deps';
import * as subscriberController from '../../controllers/subscriber/subscriber.controller';

const router = Router();

router.get('/profile', authenticate, subscriberController.getSubscriberProfile);
router.patch('/profile', authenticate, subscriberController.updateProfile);
router.get('/activity', authenticate, subscriberController.getActivityLog);

export default router;
