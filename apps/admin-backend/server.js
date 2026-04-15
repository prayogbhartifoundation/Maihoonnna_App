require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const ApiError = require('./utils/ApiError');
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = FRONTEND_URL.split(',').map((s) => s.trim());

// ─── Middleware ───────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(globalLimiter);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || ALLOWED_ORIGINS.includes(origin))
        return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

const payloadLimit = process.env.JSON_PAYLOAD_LIMIT || '2mb';
app.use(express.json({ limit: payloadLimit }));
app.use(express.urlencoded({ extended: true, limit: payloadLimit }));

const { verifyToken } = require('./middleware/auth');

// ─── Routes ───────────────────────────────────────────────────────────────────
// Public routes
app.use('/api/auth/login', loginLimiter);
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
app.use('/api/benefits', verifyToken, require('./routes/benefits'));
app.use('/api/packages', verifyToken, require('./routes/packages'));
app.use('/api/subscriptions', verifyToken, require('./routes/subscriptions'));
app.use('/api/visits', verifyToken, require('./routes/visits'));
app.use('/api/vitals', verifyToken, require('./routes/vitals'));
app.use('/api/coupons', verifyToken, require('./routes/coupons'));
app.use('/api/field-manager', verifyToken, require('./routes/field-manager'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'Admin Panel Backend running',
    port: PORT,
    time: new Date(),
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app
  .listen(PORT, () => {
    console.log(`🚀 Admin Panel Backend running on port ${PORT}`);
    console.log(`📌 Zones API: /api/zones`);
    console.log(`🌐 CORS origin: ${FRONTEND_URL}`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use. Please kill the process or use a different port.`
      );
      process.exit(1);
    } else {
      console.error('❌ Server startup error:', err);
    }
  });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const { prisma, pool } = require('./lib/prisma');

async function handleShutdown(signal) {
  console.log(`${signal} signal received: closing database connection...`);
  try {
    await prisma.$disconnect();
    if (pool) await pool.end(); // Ensure the pool is closed to release the port
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during disconnect:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
