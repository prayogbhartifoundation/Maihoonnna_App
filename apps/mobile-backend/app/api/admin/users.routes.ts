import { Router, Request, Response } from 'express';
import { authenticate, validate } from '../shared/deps';
import { updateUserSchema } from '../../schemas/user';
import * as userService from '../../services/admin/user_service';

const router = Router();

router.get('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUser(req.params.userId as string);
    res.json({ success: true, data: user });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.put('/:userId', authenticate, validate(updateUserSchema), async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.userId as string, req.body);
    res.json({ success: true, data: user });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

router.get('/companion-profile/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const profile = await userService.getCompanionProfile(req.params.userId as string);
    res.json({ success: true, data: profile });
  } catch (e: unknown) {
    res.status(404).json({ success: false, message: (e as Error).message });
  }
});

export default router;