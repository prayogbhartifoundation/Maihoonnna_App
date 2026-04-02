require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map(s => s.trim());

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { verifyToken } = require('./middleware/auth');

// ─── Routes ───────────────────────────────────────────────────────────────────
// Public routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pincode', require('./routes/pincode'));

// Protected routes
app.use('/api/zones', verifyToken, require('./routes/zones'));
app.use('/api/users', verifyToken, require('./routes/users'));
app.use('/api/upload-document', verifyToken, require('./routes/upload'));
app.use('/api/callbacks', verifyToken, require('./routes/callbacks'));
app.use('/api/teams', verifyToken, require('./routes/teams'));
app.use('/api/subscribers', verifyToken, require('./routes/subscribers'));
app.use('/api/beneficiaries', verifyToken, require('./routes/beneficiaries'));
// ─── Subscription & Benefits ──────────────────────────────────────────────────
app.use('/api/benefit-types', verifyToken, require('./routes/benefitTypes'));
app.use('/api/benefits',      verifyToken, require('./routes/benefits'));
app.use('/api/packages',      verifyToken, require('./routes/packages'));
app.use('/api/vitals',        verifyToken, require('./routes/vitals'));
app.use('/api/coupons',       verifyToken, require('./routes/coupons'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'Admin Panel Backend running', port: PORT, time: new Date() });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.path} not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Admin Panel Backend running on port ${PORT}`);
    console.log(`📌 Zones API: /api/zones`);
    console.log(`🌐 CORS origin: ${FRONTEND_URL}`);
});
