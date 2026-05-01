import { Request, Response } from 'express';
import * as subscriberService from '../../services/subscriber/subscriber_service';

export const getSubscriberProfile = async (req: Request, res: Response) => {
  try {
    const subscriberId = (req as any).userId;
    if (!subscriberId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profile = await subscriberService.getSubscriberProfile(subscriberId);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const subscriberId = (req as any).userId;
    const profile = await subscriberService.updateProfile(subscriberId, req.body);
    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const subscriberId = (req as any).userId;
    const logs = await subscriberService.getActivityLog(subscriberId);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
