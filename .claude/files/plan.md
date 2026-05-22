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
