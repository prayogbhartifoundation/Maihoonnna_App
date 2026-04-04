import prisma from '../../core/database';
import { createToken } from '../../core/security';
import { generateUUID } from '../../utils/helpers';

import twilio from 'twilio';

// Safe Twilio Initialization: Only initialize if keys exist and aren't the default mockup placeholders
const hasValidKeys =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC');

const twilioClient = hasValidKeys
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export const sendOtp = async (phone: string) => {
  // 1. Send SMS via Twilio Verify Service
  if (twilioClient && process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      // Twilio Verify handles OTP generation and storage internally! No DB needed.
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: "sms",
        });

      return { success: true, message: `OTP sent to ${phone} successfully via Twilio Verify. Status: ${verification.status}` };
    } catch (error: any) {
      console.error("Twilio Verify Error (Send):", error);
      throw new Error(`Failed to send real SMS. Twilio Error: ${error.message || 'Check your keys and Verify Service SID.'}`);
    }
  } else {
    // 2. Development Fallback (if real Twilio keys not configured in .env yet)
    const mockOtpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // In Dev Mode, we still need to store it somewhere since we aren't using Twilio Verify
    await prisma.otp.upsert({
      where: { phone },
      update: { code: mockOtpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      create: { phone, code: mockOtpCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
    });

    console.log(`\n\n[DEV MODE] Generated OTP for ${phone}: 👉 ${mockOtpCode} 👈\n\n`);
    return {
      success: true,
      message: `[DEV MODE] Twilio is not configured. The OTP is visible in your backend terminal log.`,
    };
  }
};

export const verifyOtp = async (phone: string, otp: string) => {
  if (otp.length !== 6 || !/^\d+$/.test(otp)) {
    throw new Error('Invalid OTP format. Must be 6 digits.');
  }

  // 1. Validate OTP using Twilio Verify Service
  if (twilioClient && process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: phone,
          code: otp,
        });

      if (verificationCheck.status !== "approved") {
        throw new Error("Incorrect OTP code entered.");
      }
    } catch (error: any) {
      console.error("Twilio Verify Error (Check):", error);
      throw new Error("Invalid or Expired OTP.");
    }
  } else {
    // 2. Development Fallback Validation Check
    const otpRecord = await prisma.otp.findUnique({ where: { phone } });

    if (!otpRecord) throw new Error('No OTP requested for this number.');
    if (otpRecord.code !== otp) throw new Error('Incorrect OTP code entered');
    if (otpRecord.expiresAt < new Date()) throw new Error('OTP has expired.');

    await prisma.otp.delete({ where: { phone } }); // Consume DEV token
  }

  // 3. User Login/Creation Continues Normally
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: generateUUID(),
        phone,
        name: 'New User',
        role: 'subscriber',
      },
    });
  }

  const token = createToken({ sub: user.id, role: user.role });

  return {
    success: true,
    message: 'Verification & Login successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
    token,
  };
};

import bcrypt from 'bcryptjs';

export const registerWithPassword = async (phone: string, name: string, age: number, passwordRaw: string) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error('A user with this phone number already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(passwordRaw, salt);

  // Create real row in DB
  const user = await prisma.user.create({
    data: {
      id: generateUUID(),
      phone,
      name,
      age,
      password: hashedPassword,
      role: 'subscriber',
    },
  });

  const token = createToken({ sub: user.id, role: user.role });

  return {
    success: true,
    message: 'Registration successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      role: user.role,
    },
    token,
  };
};

export const loginWithPassword = async (phone: string, passwordRaw: string) => {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.password) {
    throw new Error('Invalid phone number or password.');
  }

  // Compare hashes
  const isMatch = await bcrypt.compare(passwordRaw, user.password);

  if (!isMatch) {
    throw new Error('Invalid phone number or password.');
  }

  const token = createToken({ sub: user.id, role: user.role });

  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      role: user.role,
    },
    token,
  };
};

export const checkLocation = async (location: string) => {
  return {
    available: true,
    message: 'Great news! We serve your area. You can now enjoy our full range of services.',
    coverage: 'Service Coverage Active in 1000+ locations',
    zones: ['North Zone', 'South Zone', 'East Zone', 'West Zone'],
  };
};