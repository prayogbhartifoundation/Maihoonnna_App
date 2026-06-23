/**
 * ⚠️  DEV-ONLY ROUTE — Remove this file and its import in main.ts when done testing.
 *
 * Provides a backdoor endpoint to set/update a password on any beneficiary user
 * identified by their phone number. This bypasses OTP and is ONLY safe for
 * local development / testing.
 *
 * Registered in main.ts as: app.use('/api/dev', devRouter);
 *
 * Usage:
 *   POST /api/dev/set-beneficiary-password
 *   Body: { "phone": "9876543210", "password": "Test@123" }
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../core/database';

const router = Router();

router.post('/set-beneficiary-password', async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'phone and password are required' });
  }

  if (password.length < 4) {
    return res.status(400).json({ success: false, message: 'password must be at least 4 characters' });
  }

  const normalizedPhone = phone.replace(/\D/g, '').slice(-10);

  // Find user by phone (try with and without country code)
  const user = await prisma.user.findFirst({
    where: {
      phone: normalizedPhone,
      role: 'beneficiary',
    },
    select: { id: true, phone: true, name: true, role: true },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `No beneficiary user found with phone: ${phone}. Make sure you have enrolled a beneficiary first.`,
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return res.json({
    success: true,
    message: `Password set for beneficiary "${user.name}"`,
    hint: `Login with phone: ${user.phone} and the password you just set.`,
  });
});

export default router;
