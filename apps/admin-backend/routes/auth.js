const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { JWT_SECRET } = require('../middleware/auth');

// Allowed admin credentials — add new entries here as needed
const ADMIN_CREDENTIALS = [
    { phone: '9999955555', password: '010101', name: 'System Admin' },
    { phone: '9090909090', password: '010101', name: 'Admin User' },
];

router.post('/login', async (req, res) => {
    try {
        const { phone, password, otp } = req.body;

        // Support both "password" and "otp" fields from older frontend versions
        const checkPass = password || otp;

        if (!phone || !checkPass) {
            return res.status(400).json({ success: false, message: 'Phone number and password are required' });
        }

        const admin = ADMIN_CREDENTIALS.find(
            (cred) => cred.phone === phone && cred.password === checkPass
        );

        if (admin) {
            // Generate token
            const token = jwt.sign(
                { role: 'master_admin', phone: admin.phone },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // User object matching frontend expectations
            const user = {
                id: `admin_${admin.phone}`,
                name: admin.name,
                phone: admin.phone,
                role: 'master_admin',
                token: token
            };

            return res.json({ success: true, data: user });
        } 
        
        // If not a static admin, check database for staff roles (field_manager, operations_manager, sales)
        const dbUser = await prisma.user.findUnique({
            where: { phone: phone },
            include: { staffProfile: true }
        });

        const ALLOWED_STAFF_ROLES = ['field_manager', 'operations_manager', 'sales'];

        if (dbUser && dbUser.isActive && ALLOWED_STAFF_ROLES.includes(dbUser.role)) {
            if (!dbUser.password) {
                return res.status(401).json({ success: false, message: 'Password not set for this account. Please contact your administrator.' });
            }

            const isMatch = await bcrypt.compare(checkPass, dbUser.password);
            if (isMatch) {
                const token = jwt.sign(
                    { id: dbUser.id, role: dbUser.role, phone: dbUser.phone, zoneId: dbUser.staffProfile?.zoneId },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    data: {
                        id: dbUser.id,
                        name: dbUser.name || dbUser.staffProfile?.preferredName || '',
                        phone: dbUser.phone,
                        role: dbUser.role,
                        zoneId: dbUser.staffProfile?.zoneId || null,
                        token: token
                    }
                });
            }
        }

        return res.status(401).json({ success: false, message: 'Invalid phone number or password' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
