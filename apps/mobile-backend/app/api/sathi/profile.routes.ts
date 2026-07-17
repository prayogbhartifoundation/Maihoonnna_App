import { Router, Response } from 'express';
import { validate, authenticate, AuthRequest } from '../shared/deps';
import { ApiResponse } from '../../utils/ApiResponse';
import * as sathiService from '../../services/sathi/sathi_service';
import { volunteerProfileUpdateSchema } from '../../schemas/sathi';

const router = Router();

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const volunteer = await sathiService.getVolunteerProfile(req.userId!);
  res.json(new ApiResponse(200, volunteer));
});

router.patch('/profile', authenticate, validate(volunteerProfileUpdateSchema), async (req: AuthRequest, res: Response) => {
  const updated = await sathiService.updateVolunteerProfile(req.userId!, req.body);
  res.json(new ApiResponse(200, updated, 'Profile updated successfully'));
});

router.post('/profile/apply', authenticate, validate(volunteerProfileUpdateSchema), async (req: AuthRequest, res: Response) => {
  const updated = await sathiService.updateVolunteerProfile(req.userId!, {
    ...req.body,
    applicationStatus: 'SUBMITTED',
  });
  res.json(new ApiResponse(200, updated, 'Application submitted successfully. Profile is under review.'));
});

router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  const dashboardData = await sathiService.getVolunteerDashboard(req.userId!);
  res.json(new ApiResponse(200, dashboardData));
});

export default router;
