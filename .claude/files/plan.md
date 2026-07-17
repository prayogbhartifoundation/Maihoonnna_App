# Feature Plan: Database Sync for Zone/Onboarding (2026-03-26)
... (Existing content preserved) ...

---

# Feature Plan: Staff Onboarding & Dashboard Hardening (2026-04-03)

## Objective
Standardize staff professional metadata (Nursing Council, Specializations) and resolve critical Dashboard regressions caused by backend data structure changes.

## System Design
- **Pagination Logic**: Implement conditional backend wrapping (only wrap metadata if `page`/`limit` are requested).
- **API Pattern**: Standardize `api.ts` to consistently unwrap `.data` from backend responses.
- **Transactions**: Implement atomic team updates using Prisma `$transaction` and `updateMany`.

## Schema
- **New Columns**: `specialization` (String[]), `nursingCouncil` (String) in `CareCompanion`.

## APIs
- `GET /api/subscribers` (Conditional Pagination)
- `GET /api/beneficiaries` (Conditional Pagination)
- `PUT /api/teams/:id` (Atomic Transaction)

## Edge Cases
- **Metric Inaccuracy**: Dashboard stats failing due to `isActive` flag missing in staff mappings (Resolved).
- **Inconsistent JSON Unwrapping**: Pages crashing (`.map is not a function`) due to raw `res.json()` usage in `api.ts` (Resolved).

---

# Feature Plan: Razorpay Native Module Setup & Git Hygiene (2026-07-16)

## Objective
Enable native Razorpay payment processing on physical devices via Android development builds and clean up git history from accidental large build cache commits.

## Proposed Changes
- **Git Hygiene**: Add robust gitignore rules to both root and mobile-app `.gitignore` files to prevent caching large JS bundles and build files (e.g. `.metro_live_bundle.js`, `.expo-export-dev/`, `android/build/`).
- **Onboarding Support**: Provide `.env.example` so new developers can set up their environments quickly.
- **Local Dev Workflow**: Standardize development workflow using `npx expo run:android` for local native compilation instead of using standard sandboxed Expo Go.
- **ADB Port Forwarding**: Establish port forwarding rules for physical device connection.
