import { Router } from 'express';
import authRouter from './auth.routes';
import profileRouter from './profile.routes';
import matchesRouter from './matches.routes';
import visitsRouter from './visits.routes';

const router = Router();

router.use('/', authRouter);
router.use('/', profileRouter);
router.use('/', matchesRouter);
router.use('/', visitsRouter);

export default router;
