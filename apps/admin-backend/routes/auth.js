const express = require('express');
const { prisma } = require('../lib/prisma');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { signToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/password');

const router = express.Router();

// Allowed admin credentials — add new entries here as needed
const ADMIN_CREDENTIALS = [
  { phone: '9999955555', password: '010101', name: 'System Admin' },
  { phone: '9090909090', password: '010101', name: 'Admin User' },
];

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { phone, password, otp } = req.body;
    const checkPass = password || otp;

    if (!phone || !checkPass) {
      throw new ApiError(400, 'Phone number and password are required');
    }

    const admin = ADMIN_CREDENTIALS.find(
      (cred) => cred.phone === phone && cred.password === checkPass
    );

    if (admin) {
      const token = signToken({ role: 'master_admin', phone: admin.phone });

      return res.json(
        new ApiResponse(
          200,
          {
            id: `admin_${admin.phone}`,
            name: admin.name,
            phone: admin.phone,
            role: 'master_admin',
            token: token,
          },
          'Admin Login successful'
        )
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { phone: phone },
      include: { staffProfile: true },
    });

    const ALLOWED_STAFF_ROLES = [
      'field_manager',
      'operations_manager',
      'care_companion',
      'admin',
      'master_admin',
      'customer_service',
      'volunteer',
      'command_center',
      'emergency_coordinator'
    ];

    if (
      dbUser &&
      dbUser.isActive &&
      ALLOWED_STAFF_ROLES.includes(dbUser.role)
    ) {
      if (!dbUser.password) {
        throw new ApiError(
          401,
          'Password not set for this account. Please contact your administrator.'
        );
      }

      const isMatch = await comparePassword(checkPass, dbUser.password);
      if (isMatch) {
        // Update last login and create activity log
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { lastLoginAt: new Date() }
        });

        await prisma.activityLog.create({
          data: {
            userId: dbUser.id,
            type: 'SECURITY',
            action: 'LOGGED_IN',
            details: {
              role: dbUser.role,
              method: password ? 'password' : 'otp'
            }
          }
        });

        const token = signToken({
          id: dbUser.id,
          role: dbUser.role,
          phone: dbUser.phone,
          zoneId: dbUser.staffProfile?.zoneId,
        });

        return res.json(
          new ApiResponse(
            200,
            {
              id: dbUser.id,
              name: dbUser.name || dbUser.staffProfile?.preferredName || '',
              phone: dbUser.phone,
              role: dbUser.role,
              zoneId: dbUser.staffProfile?.zoneId || null,
              token: token,
            },
            'Login successful'
          )
        );
      }
    }

    throw new ApiError(401, 'Invalid phone number or password');
  })
);

module.exports = router;
