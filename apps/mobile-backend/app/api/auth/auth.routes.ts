import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../shared/deps';
import { sendOtpSchema, verifyOtpSchema, checkLocationSchema, registerPasswordSchema, loginPasswordSchema } from '../../schemas/auth';
import * as authService from '../../services/auth/auth_service';

const router = Router();

// Rate Limiter for OTP Requests (e.g., max 5 requests per 15 mins per IP)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  message: { success: false, message: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter for Password Logins (e.g., max 10 requests per 15 mins per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { success: false, message: 'Too many login attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});


router.post('/send-otp', otpLimiter, validate(sendOtpSchema), async (req: Request, res: Response) => {
  const result = await authService.sendOtp(req.body.phone);
  res.json(result);
});

router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyOtp(req.body.phone, req.body.otp);
    res.json(result);
  } catch (e: unknown) {
    res.status(400).json({ success: false, message: (e as Error).message });
  }
});

router.post('/check-location', validate(checkLocationSchema), async (req: Request, res: Response) => {
  const result = await authService.checkLocation(req.body.location);
  res.json(result);
});

router.post('/register-password', loginLimiter, validate(registerPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { phone, name, age, password } = req.body;
    const result = await authService.registerWithPassword(phone, name, age, password);
    res.json(result);
  } catch (e: unknown) {
    res.status(400).json({ success: false, message: (e as Error).message });
  }
});

router.post('/login-password', loginLimiter, validate(loginPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;
    const result = await authService.loginWithPassword(phone, password);
    res.json(result);
  } catch (e: unknown) {
    res.status(400).json({ success: false, message: (e as Error).message });
  }
});

export default router;