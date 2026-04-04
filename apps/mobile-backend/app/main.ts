import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Auth Routes
import authRouter from './api/auth/auth.routes';

// Subscriber Routes
import dashboardRouter from './api/subscriber/dashboard.routes';
import subscriptionsRouter from './api/subscriber/subscriptions.routes';
import beneficiariesRouter from './api/subscriber/beneficiaries.routes';
import couponsRouter from './api/subscriber/coupons.routes';

// Care Companion Routes
import visitsRouter from './api/care_companion/visits.routes';
import profileRouter from './api/care_companion/profile.routes';

// Admin Routes
import usersRouter from './api/admin/users.routes';

// Shared Routes
import medicationsRouter from './api/shared/medications.routes';
import emergencyRouter from './api/shared/emergency.routes';
import callbackRouter from './api/shared/callback.routes';

// Beneficiary Routes
import beneficiaryDashboardRouter from './api/beneficiary/dashboard.routes';

// Public Routes
import publicVitalsRouter from './api/public/vitals.routes';
import publicZonesRouter from './api/public/zones.routes';

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Role: Care Companion endpoints
app.use(`${API}/care-companion/visits`, visitsRouter);
app.use(`${API}/care-companion/profile`, profileRouter);

// Role: Admin endpoints
app.use(`${API}/admin/users`, usersRouter);

// Role: Beneficiary endpoints
app.use(`${API}/beneficiary/dashboard`, beneficiaryDashboardRouter);

// Shared endpoints
app.use(`${API}/shared/medications`, medicationsRouter);
app.use(`${API}/shared/emergency`, emergencyRouter);
app.use(`${API}/shared/callbacks`, callbackRouter);

// Public endpoints
app.use(`${API}/public/vitals`, publicVitalsRouter);
app.use(`${API}/public/zones`, publicZonesRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

export default app;