# Implementation: Package Versioning & Benefit Deduction Architecture

## Files Modified
- [modify] [apps/admin-backend/prisma/schema.prisma](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/prisma/schema.prisma): Added versioning models (`PackageVersion`, `PackageVersionBenefit`), updated relations, and added `benefitId` to the `Visit` model.
- [modify] [apps/mobile-backend/prisma/schema.prisma](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/prisma/schema.prisma): Synchronized schemas between the admin and mobile backends.
- [modify] [apps/admin-backend/routes/packages.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/packages.js): Integrated version publication logic on package modifications to enforce package immutability.
- [modify] [apps/admin-backend/routes/subscriptions.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/subscriptions.js): Updated enrollment, billing snapshotting, and utilization query logic to use snapshots.
- [modify] [apps/admin-backend/routes/visits.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/visits.js): Implemented scheduling-time checks & pre-deductions for visit-based benefits, and refund logic on visit cancel.
- [modify] [apps/mobile-backend/app/services/care_companion/visit_service.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/services/care_companion/visit_service.ts): Fixed checkout logic to strictly deduct hour-based benefits and skip visit-count benefits (since they are pre-deducted at scheduling).

## Actions Taken
1. **Enforced Immutability**: Implemented a snapshot publisher where any change to a subscription package creates a new `PackageVersion` snapshot. Subscriptions now link to `PackageVersion` to lock in benefits.
2. **Visit-level Benefit Tracking**: Updated the `Visit` model to store `benefitId` directly as a foreign key.
3. **Split Benefit Deduction Modes**:
   - Visit-based benefits deduct 1 unit on scheduling (handled in admin-backend).
   - Hour-based benefits deduct actual duration hours at checkout (handled in mobile-backend and admin-backend checkout).
4. **Idempotent Refund on Cancel**: Programmed `DELETE /api/visits/:id` to check the `PackageHoursLog`, refund the exact locked `benefitId` from the subscription balance, and delete the log.
5. **Removed Fallback Ambiguity**: Cleaned up checkout code in the mobile backend to avoid guessing or selecting fallback visit-based benefits when completing a visit.
