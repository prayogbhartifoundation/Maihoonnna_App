# MaiHoonNa — Claude Context Overview

This file is the main entry point for AI-assisted development context on this project.
For full session details, see `.claude/context/changes.md` and `.claude/files/changes.md`.

---

## Project Structure

```
apps/
  admin-backend/     Express.js + Prisma 7 (Node)  — Admin Panel API (port 3001)
  admin-frontend/    React + Vite (TypeScript)      — Admin dashboard UI (port 5173)
  mobile-backend/    Fastify + Prisma 7 (TypeScript) — Subscriber/CC/Beneficiary API (port 3000)
  mobile-app/        Expo + React Native             — Mobile app (Expo Go / port 8081)
```

Database: **Supabase PostgreSQL** (pooled via `aws-1-ap-south-1.pooler.supabase.com`, port 5432 only — IPv6/6543 not supported on free tier)

---

## Major Completed Features

### ✅ Staff & Zone Management
- Full CRUD for Zones, Operations Managers, Field Managers, Care Companions
- Pincode-based zone serviceability check with real-time UI feedback
- Staff assignment to beneficiaries via zone-filtered staff picker
- Push notification to CC, Beneficiary, and Subscriber on assignment
- Staff password management with bcrypt, RBAC via JWT

### ✅ Subscription & Package System
- Dynamic subscription packages (no hardcoded types) with benefit library
- Coupon engine: 9-step validation, per-user limits, first-time subscriber discounts
- Package benefit tracking: visit-count deduction at scheduling, hours deduction at checkout
- Admin enrollment wizard (5 steps): Subscriber → Beneficiary → Medical → Emergency → Package

### ✅ Beneficiary Enrollment & Medical Data
- Enrollment collects conditions, medications (with time slots + reminders), hobbies, emergency contacts
- Dynamic vitals selection during enrollment — feeds `BeneficiaryVitalConfig` relational table
- Address auto-fill via Google Geocoding reverse proxy (protects API key server-side)
- Granular address fields: `flatPlot`, `streetArea`, `landmark`, `city`, `state`, `pincode`, lat/lng

### ✅ Dynamic Vitals System (MAJOR — 2026-06-23)
The vitals pipeline was completely fixed end-to-end:

**Admin Module** creates `VitalDefinition` records (code, name, unit, displayOrder).
**Enrollment form** fetches these from `/public/vitals?activeOnly=true` and sends `{ [code]: true }` for checked vitals.
**Checkout** (`subscription_service.ts`) saves:
  - Legacy boolean flags on `Beneficiary` (backward compat)
  - `BeneficiaryVitalConfig` rows for ALL checked vitals (including custom admin-created ones)

**Profile** (`beneficiary_service.ts`) reads from `BeneficiaryVitalConfig` as the source of truth.
Falls back to boolean flags only for legacy enrollments that predate the fix.

Key files:
- `apps/mobile-backend/app/services/subscriber/subscription_service.ts` — checkout
- `apps/mobile-backend/app/services/subscriber/beneficiary_service.ts` — profile builder
- `apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx` — display
- `apps/mobile-backend/prisma/backfill_vital_configs.ts` — one-time data migration (already run)

### ✅ Care Companion Mobile App
- CC dashboard: assigned beneficiaries, visits, check-in/check-out
- Visit photo capture with gallery
- Vitals recording during visits (linked to `VitalReading` and `Visit` records)
- Human-readable visit codes (ambiguity-free charset, unique constraint)
- Push notification registration via Expo

### ✅ Subscriber Mobile App
- Beneficiary profile with hero stats, vitals tab, medical tab, timeline
- Package utilization screen (progress rings, benefit balances, activity log)
- Service request flow with live location picker
- Auth: OTP via MSG91 WhatsApp, password login, global logout (AsyncStorage.clear)

### ✅ Auth & Security
- Global `AuthContext` (React) separates logged-in/logged-out navigation stacks
- `gestureEnabled: false` on root screens prevents back-swipe to auth
- Shared `ChangePasswordSharedScreen` works for all user roles
- Admin panel DB-backed login for Sales, FM, OM roles

---

## Critical Rules for Future Development

1. **Vital codes** — always use `VitalDefinition.code` values (`PULSE`, `BP`, `BLOOD_GLUCOSE`, `SPO2`, `TEMP`, `WEIGHT`, `PAIN`, `RESP`). Never use legacy short aliases (`HR`, `SUGAR`, `RR`) as primary keys.

2. **Database port** — use port `5432` only. Port `6543` (PgBouncer / IPv6) is not available on the Supabase free plan.

3. **Backfills** — run once with `npx ts-node --transpile-only prisma/backfill_*.ts`. Never run on server start.

4. **Schema sync** — after every `schema.prisma` change, run `npx prisma db push` AND `npx prisma generate` in BOTH `admin-backend` and `mobile-backend`.

5. **Visit scheduling** — cannot schedule visits for past dates. Past-date visits go straight to `missed` status. Time-based: can schedule same-day future time slots.

6. **DEV-ONLY cleanup** — search for `⚠️ DEV ONLY` comments in codebase. Remove `dev.routes.ts` and associated blocks from `main.ts`, `beneficiary-info.tsx`, `checkout.tsx` before production.
