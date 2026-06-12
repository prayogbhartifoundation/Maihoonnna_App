import { Router } from 'express';
import { authenticate, AuthRequest } from './deps';
import prisma from '../../core/prisma';

const router = Router();

// POST /api/users/push-token
router.post('/push-token', authenticate, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { token } = authReq.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    const userId = authReq.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    res.json({ success: true, message: 'Push token synced successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50, // Fetch the last 50 notifications
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = authReq.params;
    const userId = authReq.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/notifications/read-all
router.patch('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
