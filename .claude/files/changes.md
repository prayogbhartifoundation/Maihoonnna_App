# Implementation: Database Sync and Fix

## Files Modified
- [modify] [Admin_panel\backend\.env](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/Admin_panel/backend/.env): Updated `DATABASE_URL` with `%40` encoding.
- [new] [backend\.env](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/backend/.env): Created root backend .env for Prisma CLI.

## Actions Taken
- Executed `npx prisma db push` to sync Supabase schema.
- Executed `npx prisma generate` to refresh the client.
- Restarted backend/frontend dev servers.

---

# Implementation: Staff Onboarding & Pagination Fix (2026-04-03)

## Files Modified
- [modify] [apps/admin-backend/prisma/schema.prisma](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/prisma/schema.prisma): Added `specialization` and `nursingCouncil` to CareCompanion.
- [modify] [apps/admin-backend/routes/users.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/users.js): Standardized pagination wrapping (conditional) and mapped `isActive` for dashboard.
- [modify] [apps/admin-backend/routes/teams.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/teams.js): Implemented atomic team updates using `$transaction` and `updateMany`.
- [modify] [apps/admin-frontend/src/services/api.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/services/api.ts): Standardized all API calls to unwrap the `.data` payload.

## Actions Taken
- Synced Prisma schema with `npx prisma db push`.
- Fixed "filter is not a function" on Dashboard by implementing conditional backend pagination.
- Verified all staff management lists (CC, FM, OM) for correct loading and sorting.

---

# Implementation: Team Management & UI Standardization (2026-04-03 - Session 2)

## Files Modified
- [modify] [apps/admin-backend/prisma/schema.prisma](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/prisma/schema.prisma): Made `Team.fieldManagerId` optional (`String?`).
- [modify] [apps/admin-backend/routes/teams.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/teams.js): Fixed route shadowing by moving `/:id` below static routes; handled optional FM logic.
- [modify] [apps/admin-frontend/src/app/pages/CreateTeamPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/CreateTeamPage.tsx) & [EditTeamPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/EditTeamPage.tsx): Fixed `Select.Item` value crash and added "None" option for FM.
- [modify] [apps/admin-frontend/src/app/pages/SubscribersPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/SubscribersPage.tsx), [BeneficiariesPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/BeneficiariesPage.tsx), [FieldManagerPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/FieldManagerPage.tsx), [CareCompanionsPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/CareCompanionsPage.tsx), [OperationsManagersPage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/OperationsManagersPage.tsx): Standardized card footer grid to resolve UI overflow.

## Actions Taken
- Performed `npx prisma db push` to normalize `Team` model.
- Standardized action button layouts across all entity cards for better accessibility and responsiveness.
- Resolved "404 Not Found" for `available-companions` and `available-managers` API endpoints.

---

# Implementation: Package Utilization Tracking (2026-05-25)

## Overview
Full end-to-end system to track subscription package benefit consumption per beneficiary — supporting both visit-count and hours-based billing (minimum 1 hour billing rule).

## Files Modified

### Backend
- [modify] [apps/admin-backend/routes/visits.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/visits.js):
  - Fixed `PackageHoursLog.create` bug (wrong field names: `hoursUsed` → `hoursConsumed`, missing `visitId`, `balanceBefore`, `balanceAfter`).
  - `POST /api/visits` now accepts optional `benefitId`; visit-count benefits deduct 1 unit immediately at scheduling; hours-based benefits are tagged on the visit for checkout deduction.
  - Added `PATCH /api/visits/:id/complete` — marks visit as completed, records `checkInTime`/`checkOutTime`, deducts hours using rule: `Math.max(60, actualMinutes) / 60` hours (< 60 min → 1 hr, ≥ 60 min → actual).

- [modify] [apps/admin-backend/routes/subscriptions.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/subscriptions.js):
  - Added `GET /api/subscriptions/beneficiary/:id/utilization` — returns active subscription, per-benefit balances with `isLowBalance` / `isExhausted` / `usagePercent`, and last 30 `PackageHoursLog` entries.

- [modify] [apps/admin-backend/routes/subscribers.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/subscribers.js):
  - Added `GET /api/subscribers/:id/utilization-summary` — returns all active beneficiaries under a subscriber with their mini benefit usage summaries.

### Frontend
- [modify] [apps/admin-frontend/src/services/api.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/services/api.ts):
  - Added `visitApi.complete(id, data)` — calls `PATCH /api/visits/:id/complete`.
  - Added `subscriptionApi.getBeneficiaryUtilization(beneficiaryId)` — typed return with benefit balances.
  - Added `subscriberApi.getUtilizationSummary(subscriberId)` — typed return with per-beneficiary summaries.

- [new] [apps/admin-frontend/src/app/components/PackageUtilizationPanel.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/components/PackageUtilizationPanel.tsx):
  - Reusable component displaying SVG circular progress rings per benefit, horizontal progress bars with colour-coded states (green/amber/red), low-balance warning banner, and a paginated activity log.

- [modify] [apps/admin-frontend/src/app/pages/BeneficiaryProfilePage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/BeneficiaryProfilePage.tsx):
  - Added "Package Usage" tab embedding `PackageUtilizationPanel` for the beneficiary.

- [modify] [apps/admin-frontend/src/app/pages/SubscriberProfilePage.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/pages/SubscriberProfilePage.tsx):
  - Added "Package Utilization" section showing all beneficiaries with mini progress bars, status badges (OK / Low / Exhausted), and clickable links to each beneficiary profile.

## Key Business Rules Implemented
- **Visit-count benefits**: deduct 1 unit at the time of scheduling.
- **Hour-based benefits**: deduct at checkout using `Math.max(60, actualMinutes) / 60` hours (minimum 1-hour billing unit).
- **Low balance warning**: triggered when < 20% of units remain.
- **Exhausted**: when `usedUnits >= totalUnits`.
- Field manager selects `benefitId` explicitly when scheduling a visit (benefit dropdown from active subscription).

---

# Implementation: Mobile App Package Utilization (2026-05-25)

## Overview
Built and integrated the Package Utilization screen into the mobile app, providing secure, role-based access for both Subscribers and Beneficiaries. This mirrors the admin panel's package utilization tracking.

## Files Modified

### Mobile Backend (`apps/mobile-backend`)
- [new] [apps/mobile-backend/app/api/shared/utilization.routes.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/api/shared/utilization.routes.ts):
  - Created `GET /api/shared/utilization` endpoint.
  - Implemented role-based logic using the authenticated `req.userRole` and `req.userId`.
  - **Subscriber Flow**: Returns a summary of all active beneficiaries under their account with mini-benefit usage stats. If `?beneficiaryId=xxx` is passed, it validates ownership and returns detailed statistics for that specific beneficiary.
  - **Beneficiary Flow**: Automatically fetches and returns their own detailed statistics and recent package hours logs, completely isolating data access between users.
  - *Bug Fix*: Corrected Prisma queries to query `Beneficiary` using `subscriberId: userId` directly, as the schema does not have a standalone `Subscriber` model (Subscribers are `User` records).
- [modify] [apps/mobile-backend/app/main.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/main.ts):
  - Mounted the new router at `/api/shared/utilization`.

### Mobile App Frontend (`apps/mobile-app`)
- [new] [apps/mobile-app/components/shared/PackageUtilizationPanel.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/components/shared/PackageUtilizationPanel.tsx):
  - Created a generic React Native component to display utilization.
  - Uses beautifully styled horizontal progress bars with color-coded states (Green = OK, Amber = Low, Red = Exhausted).
  - Includes a low-balance warning banner.
  - Features a paginated activity log showing Care Companion details, visit duration, and deductions.
- [new] [apps/mobile-app/app/package-utilization.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/package-utilization.tsx):
  - Created a top-level shared Expo Router screen.
  - Fetches data from `GET /api/shared/utilization` and intelligently determines the role from the response structure.
  - Renders either a list of beneficiary summary cards (for Subscribers) or the detailed `PackageUtilizationPanel` (for Beneficiaries or specific Subscriber selection).
- [modify] [apps/mobile-app/app/(subscriber)/components/profile/SubscriptionTab.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/components/profile/SubscriptionTab.tsx):
  - Wrapped the "Current Plan" card in a `TouchableOpacity` to navigate to `/package-utilization`.
- [modify] [apps/mobile-app/app/(beneficiary)/more.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(beneficiary)/more.tsx):
  - Added a new menu item "Package Utilization" (with a package icon) that navigates to `/package-utilization`.

## Key Features Implemented
- **Role-Based Security**: API strictly enforces access control based on JWT claims (`req.userId` and `req.userRole`). Subscribers cannot view out-of-network beneficiaries.
- **Shared UI Architecture**: One unified screen gracefully handles different layouts depending on the active user role and available data.
- **Native Rendering**: Progress visualizations built entirely with native React Native Views (no external SVG dependencies needed).

---

# Implementation: MSG91 WhatsApp OTP Integration (2026-05-25)

## Overview
Replaced the mock OTP logger with a live MSG91 WhatsApp Outbound Message integration for authenticating users. Fixed frontend API bugs that prevented the OTP flow from triggering.

## Files Modified

### Backend (`apps/mobile-backend`)
- [new] [apps/mobile-backend/app/core/otp/Msg91Provider.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/core/otp/Msg91Provider.ts):
  - Created a new provider implementing the `OtpProvider` interface.
  - Generates a 6-digit OTP, stores it in the database with a 5-minute expiry.
  - Sends a `POST` request to `api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/`.
  - Maps the OTP to both `body_1` (for the message text) and `button_1` (for quick copy URL).
  - Explicitly formats the 10-digit number to include the `91` country code.
- [modify] [apps/mobile-backend/app/core/otp/OtpFactory.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/core/otp/OtpFactory.ts):
  - Updated to return the `Msg91Provider` if `MSG91_AUTH_KEY` is present in the environment variables.
- [modify] [apps/mobile-backend/.env](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/.env):
  - Injected `MSG91_AUTH_KEY`.

### Frontend (`apps/mobile-app`)
- [modify] [apps/mobile-app/app/(auth)/index.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/index.tsx):
  - Fixed a critical bug where the `fetch` request to `/api/auth/send-otp` was entirely commented out.
  - Restored the payload to correctly pass the phone number to the backend.

### Admin/Database (`apps/admin-backend`)
- [modify] [apps/admin-backend/prisma/seed-beneficiary-subscriber.js](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/prisma/seed-beneficiary-subscriber.js):
  - Updated seed script to use fresh names (Amit Sharma, Rahul Sharma) and real phone numbers for end-to-end OTP testing.

---

## Session: Location Picker Crash Fix (2026-06-01)

### Overview
Resolved ANR crashes on physical devices by rewriting the Location Picker to use industry-standard paradigms.

### Files Modified
- [modify] [apps/mobile-app/components/ui/AddressPicker.native.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/components/ui/AddressPicker.native.tsx):
  - Rewrote to use a fixed-center crosshair pin.
  - Implemented 300ms debounce on `reverseGeocode` to prevent JS thread flooding.
  - Added `isDragging` state.
- [modify] [apps/mobile-app/services/location/getCurrentLocation.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/services/location/getCurrentLocation.ts):
  - Downgraded `Location.Accuracy.BestForNavigation` to `Location.Accuracy.Balanced` for faster GPS locks.
- [modify] [apps/mobile-app/app.json](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app.json):
  - Added Google Maps SDK API Key to `android.config.googleMaps.apiKey` and iOS config.

---

# Session: Auth Navigation & Git Branch Fix (2026-06-02)

## Overview
Resolved a global back-navigation bug where native gestures would direct logged-in users back to the auth flow and logout. centralizing state via React Context and splitting authenticated/unauthenticated layouts. Recovered and merged custom Git commits overwritten by a developer force push on `stagging`.

## Files Modified

### Git Recovery
- [modify] Active branch `main` (Restored overwritten commits and pulled missing files like `HeaderSpacer.tsx` from `stagging` without overwriting custom work).

### Auth Centralization & Navigation Control
- [new] [apps/mobile-app/contexts/AuthContext.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/contexts/AuthContext.tsx):
  - Centralized authentication context provider containing `isLoggedIn`, `userRole`, `isLoading`, `login()`, and `logout()` operations.
  - Implements session loading from AsyncStorage.
- [modify] [apps/mobile-app/app/_layout.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/_layout.tsx):
  - Wraps the app in `AuthProvider`.
  - Conditioned layout root stacks to isolate unauthorized screens from authorized ones based on active `isLoggedIn` state.
- [modify] [apps/mobile-app/app/index.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/index.tsx):
  - Refactored to utilize `useAuth` hook instead of localized storage checks.
- [modify] [apps/mobile-app/app/(auth)/verify-otp.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/verify-otp.tsx) & [login-password.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/login-password.tsx):
  - Replaced inline routing logic with the global context `login` hook caller.
- [modify] [apps/mobile-app/utils/logout.ts](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/utils/logout.ts):
  - Added modern React Hook `useLogoutWithConfirm` supporting clean context-level state resetting.
  - Maintained backward-compatible legacy export functions to support older components.
- [modify] [apps/mobile-app/components/GlobalHeader.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/components/GlobalHeader.tsx) & [care-companion/CompanionHeader.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/components/care-companion/CompanionHeader.tsx):
  - Upgraded header templates to tap directly into context auth handlers.
- [modify] [apps/mobile-app/app/(subscriber)/components/shared/GlobalDrawer.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/components/shared/GlobalDrawer.tsx), [profile.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/profile.tsx), [more.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(beneficiary)/more.tsx), [profile/index.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(beneficiary)/profile/index.tsx), [dashboard-preview.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/dashboard-preview.tsx):
  - Converted internal sign-out handlers to utilize the newly built hook for dialogs.
- [modify] [apps/mobile-app/app/(subscriber)/_layout.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/_layout.tsx) & [(care-companion)/_layout.tsx](file:///C:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(care-companion)/_layout.tsx):
  - Configured native navigation settings with `gestureEnabled: false` on critical screen roots.
- [modify] Removed redundant routing handlers from dashboard indexes across `(subscriber)/index.tsx`, `(beneficiary)/index.tsx`, and `(care-companion)/index.tsx`.

## Actions Taken
- Recovered branches, merged custom code, and staged final commit `4ed8e0b` on `main`.
- Implemented global auth state React Context (`AuthContext`).
- Separated login routing stacks at root layout level.
- Cleaned up obsolete validation and redirection loops.
- Resolved TypeScript imports and context-related declarations cleanly without error.

---

# Session: Dynamic Vitals System — End-to-End Fix (2026-06-23)

## Overview
Beneficiary profiles showed fewer vitals than selected during enrollment because `BeneficiaryVitalConfig` relational records were never created at checkout. The `vitalsData` builder only read legacy boolean flags and ignored custom admin-created vitals entirely.

## Files Modified

### Mobile Backend (`apps/mobile-backend`)
- [modify] [apps/mobile-backend/app/services/subscriber/subscription_service.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/services/subscriber/subscription_service.ts):
  - Fixed vital code mapping: `PULSE` (was `HR`), `BLOOD_GLUCOSE` (was `SUGAR`), `RESP` (was `RR`) — now matches actual `VitalDefinition.code` values stored by the Admin module.
  - **NEW step 1c** after beneficiary creation: iterates over all checked vital codes from `medicalData.vitals`, looks up each `VitalDefinition` by code, and creates `BeneficiaryVitalConfig` rows via `upsert`. Covers both system vitals and any custom vitals.

- [modify] [apps/mobile-backend/app/services/subscriber/beneficiary_service.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/services/subscriber/beneficiary_service.ts):
  - Added `vitalConfigs: { where: { isActive: true }, include: { vitalDefinition: true } }` to the Prisma query in `getBeneficiaryProfile`.
  - Replaced the hardcoded 6-vital if-chain with a loop over `activeConfigs`. Uses a `VITAL_META` record keyed by vital code to assign icon, color, trend, and reading value extractor.
  - Custom vitals (code not in `VITAL_META`) get a generic `clipboard-pulse` icon.
  - Vitals sorted by `vitalDefinition.displayOrder`.
  - Legacy boolean flag fallback retained for enrollments predating this fix.

- [new] [apps/mobile-backend/prisma/backfill_vital_configs.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/prisma/backfill_vital_configs.ts):
  - One-time backfill script: finds all beneficiaries with `trackXxx = true` boolean flags but no `BeneficiaryVitalConfig` rows, and creates the missing relational records.
  - Executed: **24 configs created**, 9 already existed.
  - Run: `npx ts-node --transpile-only prisma/backfill_vital_configs.ts`

### Mobile App (`apps/mobile-app`)
- [modify] [apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx):
  - Removed hardcoded `i===0 → heartIconBox` / `i===1 → bpIconBox` position-based styles.
  - Added `getVitalBgColor(code, label)`: maps by vital code first, label as fallback, grey for unknowns.
  - Hero stats card now renders up to 4 vitals (was capped at 2).
  - Removed stale "No Visits Recorded Yet" popup (placeholder values no longer emitted).
  - Backend now sends `code` field with each vital for reliable frontend color mapping.

- Ran `npx tsc --noEmit` on both `mobile-backend` and `mobile-app` — zero errors.
- Ran backfill script — successfully migrated all existing beneficiary vital selections to relational table.
- Verified in-app: 3 selected vitals now appear correctly on beneficiary profile (was showing 2).

---

# Session: Visit Benefit Deduction Bugfix (2026-06-23)

## Overview
When scheduling a visit, the selected benefit was being saved into the visit's `notes` string as a hack (`__benefitId:xxx`) instead of a proper database column. During checkout, if the notes had been modified, the backend failed to deduct hours from the correct benefit.

## Files Modified

### Database Schemas
- [modify] [apps/admin-backend/prisma/schema.prisma](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/prisma/schema.prisma):
  - Added `benefitId String?` and `benefit Benefit?` relation to the `Visit` model.
  - Added `visits Visit[]` back-relation to the `Benefit` model.
- [modify] [apps/mobile-backend/prisma/schema.prisma](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/prisma/schema.prisma):
  - Mirrored the exact same schema additions to keep both backends fully in sync.

### Backend Routing
- [modify] [apps/admin-backend/routes/visits.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/visits.js):
  - **`POST /` (Scheduling)**: Stored `benefitId` natively in the visit creation payload; removed the legacy notes-string hack.
  - **`PATCH /:id/complete` (Checkout)**: Replaced notes-parsing logic with a direct read of `visit.benefitId` from the DB to determine which package benefit to deduct hour balances from.

## Actions Taken
- Executed `npx prisma db push` and `npx prisma generate` in both `admin-backend` and `mobile-backend`.
- Checked `deductBenefitBalance` logic to confirm deduction scope is strictly limited via `subscriptionId_benefitId` composite index.
- Validated Javascript syntax with `node --check routes/visits.js`.

---

# Implementation: Razorpay Native Module & Git Hygiene (2026-07-16)

## Files Modified
- [modify] [.gitignore](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/.gitignore): Added root-level rules to ignore build files, local properties, secrets, and caches across the monorepo packages.
- [modify] [apps/mobile-app/.gitignore](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/.gitignore): Added mobile-app local ignores for node_modules, build directories, pod structures, env files, and Metro bundles.
- [new] [apps/mobile-app/.env.example](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/.env.example): Added template file detailing variables like local development environment settings, API endpoints, Google Maps key, and Razorpay test key IDs.

## Actions Taken
- Untracked pre-existing `.expo-export-dev/`, `.expo-export-temp*`, `dist/`, `.metro_live_bundle.js`, and `.DS_Store` files using `git rm -r --cached`.
- Successfully compiled an Android Development Build via `npx expo run:android` locally and deployed the APK to the connected device via ADB.
- Established ADB port-forwarding mappings (ports 8081 and 8001) using `adb reverse` to allow local device to query the local development server.
- Force pushed all changes to `dev` branch.
