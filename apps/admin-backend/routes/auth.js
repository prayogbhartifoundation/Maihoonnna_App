const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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
        } else {
            return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
