import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './core/config';
import { ApiError } from './utils/ApiError';

// Auth Routes
import authRouter from './api/auth/auth.routes';

// Subscriber Routes
import dashboardRouter from './api/subscriber/dashboard.routes';
import subscriptionsRouter from './api/subscriber/subscriptions.routes';
import beneficiariesRouter from './api/subscriber/beneficiaries.routes';
import couponsRouter from './api/subscriber/coupons.routes';
import subscriberRouter from './api/subscriber/subscriber.routes';
import serviceRequestsRouter from './api/subscriber/service-requests.routes';
import addressesRouter from './api/subscriber/addresses.routes';
import subscriberVitalsRouter from './api/subscriber/vitals.routes';

// Care Companion Routes
import visitsRouter from './api/care_companion/visits.routes';
import profileRouter from './api/care_companion/profile.routes';
import dashboardCcRouter from './api/care_companion/dashboard.routes';
import scheduleCcRouter from './api/care_companion/schedule.routes';
import visitImagesRouter from './api/care_companion/visit-images.routes';

// Admin Routes
import usersRouter from './api/admin/users.routes';

// Shared Routes
import medicationsRouter from './api/shared/medications.routes';
import profilePhotoRouter from './api/shared/profile-photo.routes';
import emergencyRouter from './api/shared/emergency.routes';
import callbackRouter from './api/shared/callback.routes';
import utilizationRouter from './api/shared/utilization.routes';
import sharedUsersRouter from './api/shared/users.routes';

// Beneficiary Routes
import beneficiaryDashboardRouter from './api/beneficiary/dashboard.routes';
import beneficiaryInteractionsRouter from './api/beneficiary/interactions.routes';

// Subscriber Visits (rating)
import subscriberVisitsRouter from './api/subscriber/visits.routes';

// Public Routes
import publicVitalsRouter from './api/public/vitals.routes';
import publicZonesRouter from './api/public/zones.routes';
import publicEnrollmentRouter from './api/public/enrollment.routes';
import publicLocationRouter from './api/public/location.routes';
import publicHobbiesRouter from './api/public/hobbies.routes';

// ⚠️ DEV-ONLY — Remove this import + route registration below when done testing
import devRouter from './api/dev/dev.routes';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(globalLimiter);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins to resolve CORS issue for APK testing
      return callback(null, true);

      // // Allow requests with no origin (mobile app, curl, etc.)
      // if (!origin) return callback(null, true);

      // // If allowed origin is '*', allow everything
      // if (config.corsOrigin === '*') return callback(null, true);

      // // Check if current origin is in the allowed list
      // if (Array.isArray(config.corsOrigin) && config.corsOrigin.includes(origin)) {
      //   return callback(null, true);
      // }

      // // If literal match
      // if (config.corsOrigin === origin) return callback(null, true);

      // // callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: config.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: config.jsonLimit }));

// ─── Routes ───────────────────────────────────────────────────────────────────
const API = '/api';

app.get(`${API}`, (_req, res) => {
  res.json({ message: 'MaiHoonNa Role-Based API', version: '2.0.0', status: 'active' });
});

// Auth Route
app.use(`${API}/auth`, authRouter);

// Role: Subscriber endpoints
app.use(`${API}/subscriber/dashboard`, dashboardRouter);
app.use(`${API}/subscriber/subscriptions`, subscriptionsRouter);
app.use(`${API}/subscriber/beneficiaries`, beneficiariesRouter);
app.use(`${API}/subscriber/coupons`, couponsRouter);
app.use(`${API}/subscriber/service-requests`, serviceRequestsRouter);
app.use(`${API}/subscriber/addresses`, addressesRouter);
app.use(`${API}/subscriber/vitals`, subscriberVitalsRouter);
app.use(`${API}/subscriber`, subscriberRouter);

// Role: Care Companion endpoints
app.use(`${API}/care-companion/visits`, visitsRouter);
app.use(`${API}/care-companion/profile`, profileRouter);
app.use(`${API}/care-companion/dashboard`, dashboardCcRouter);
app.use(`${API}/care-companion/schedule`, scheduleCcRouter);
app.use(`${API}/care-companion/visit-images`, visitImagesRouter); // visit photo upload/list/delete

// Role: Admin endpoints
app.use(`${API}/admin/users`, usersRouter);

// Role: Beneficiary endpoints
app.use(`${API}/beneficiary/dashboard`, beneficiaryDashboardRouter);
app.use(`${API}/beneficiary/interactions`, beneficiaryInteractionsRouter);
app.use(`${API}/beneficiary`, beneficiaryDashboardRouter);

// Subscriber Visits rating
app.use(`${API}/subscriber/visits`, subscriberVisitsRouter);

// Shared endpoints
app.use(`${API}/shared/medications`, medicationsRouter);
app.use(`${API}/shared/emergency`, emergencyRouter);
app.use(`${API}/shared/callbacks`, callbackRouter);
app.use(`${API}/shared/utilization`, utilizationRouter);
app.use(`${API}/shared/users`, sharedUsersRouter);

// Profile Photo Upload (all roles)
app.use(`${API}/profile-photo`, profilePhotoRouter);

// Public endpoints
app.use(`${API}/public/vitals`, publicVitalsRouter);
app.use(`${API}/public/hobbies`, publicHobbiesRouter);
app.use(`${API}/public/zones`, publicZonesRouter);
app.use(`${API}/public/location`, publicLocationRouter);
app.use(`${API}/public`, publicEnrollmentRouter);

// ⚠️ DEV-ONLY — Remove this block when done testing (also delete app/api/dev/dev.routes.ts)
app.use(`${API}/dev`, devRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
});

export default app;