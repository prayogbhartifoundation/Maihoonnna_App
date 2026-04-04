import { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../../core/security';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = decodeToken(token);

  if (!payload) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
};

export const validate = (schema: { validate: Function }) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d: { message: string }) => d.message),
      });
      return;
    }
    next();
  };
};