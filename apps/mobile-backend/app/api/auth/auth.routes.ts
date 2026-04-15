import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../shared/deps';
import { sendOtpSchema, verifyOtpSchema, checkLocationSchema, registerPasswordSchema, loginPasswordSchema } from '../../schemas/auth';
import * as authService from '../../services/auth/auth_service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';

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


router.post('/send-otp', otpLimiter, validate(sendOtpSchema), asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendOtp(req.body.phone);
  res.json(new ApiResponse(200, result, 'OTP sent successfully'));
}));

router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body.phone, req.body.otp);
  res.json(new ApiResponse(200, result, 'OTP verified successfully'));
}));

router.post('/check-location', validate(checkLocationSchema), asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.checkLocation(req.body.location);
  res.json(new ApiResponse(200, result, 'Location check completed'));
}));

router.post('/register-password', loginLimiter, validate(registerPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone, name, age, password } = req.body;
  const result = await authService.registerWithPassword(phone, name, age, password);
  res.json(new ApiResponse(201, result, 'Registration successful'));
}));

router.post('/login-password', loginLimiter, validate(loginPasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const result = await authService.loginWithPassword(phone, password);
  res.json(new ApiResponse(200, result, 'Login successful'));
}));

export default router;