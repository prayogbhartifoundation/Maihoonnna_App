# Code Review
- Security: URL encoding prevents parsing issues. Backend-only file uploads prevent untrusted `fileUrl` injection from frontend.
- Performance: Prisma finds are efficient. Naming strategy with timestamps/random strings avoids storage collisions.
- Verification: Schema matches backend expectations. Mock fallbacks ensure UI stability during backend development.
- Architecture: Adapter pattern in `services/storage` allows simple provider switching via `STORAGE_PROVIDER`.
- Upload Flow: Frontend collects File objects in `pendingFiles` Map; uploads happen after `staffProfileId` is known to avoid orphaned storage objects.
- Pending: `SUPABASE_SERVICE_ROLE_KEY` must be set manually by user before file uploads will work in production.
- File Naming: Backend generates unique paths using `staff/{id}/{docType}/{timestamp}_{uuid}_{sanitizedName}` to prevent overwrites.
- Auth Design: `ADMIN_CREDENTIALS` array in `auth.js` — add new entries by appending `{phone, password, name}` objects.
- Mock Fallback Pattern: All API mock fallbacks now use `err instanceof TypeError && err.message.includes('fetch')` to detect network-only failures.
- Supabase JWS Error: "Invalid Compact JWS" = wrong key format. Must use the full Service Role JWT, not a partial/anon key.
- upsert on staffDocument requires `@@unique([staffProfileId, documentType])` — confirmed present in schema.prisma line 661.
- Package Creation: Uses database transactions (`prisma.$transaction`) to ensure atomicity when creating a package along with its benefits and discounts.
- Soft Delete Pattern: `DELETE` routes for benefits/packages use `isActive: false` instead of hard deletes to prevent breaking existing user subscriptions.
- API Consolidation: `api.ts` was cleaned of mock stubs to ensure all components use the new real backend routes for product catalog management.
- Dynamic Package Architecture: Completely removed `SubscriptionType` and merged `Package` into `SubscriptionPackage`. Admins can now create and manage any arbitrary package name/type via the "Product Factory" UI.
- Type Safety: Refactored services to use string-based types while maintaining runtime enum validation (e.g., `MedicationFrequency`, `GenderType`) to prevent data corruption.
- Backward Compatibility: Admin Panel backend routes now intercept frontend wizard field names (`totalCost`, `monthlyUnits`) and map them to the proper database columns (`basePrice`, `unitsIncluded`).

---

## Architecture Notes: Dynamic Staff Editing (2026-03-30)
- StaffEditModal uses a two-step flow: fetch details (`GET /staff/:userId`) on open, then commit changes (`PUT /staff/:userId`) on save
- All profile updates run inside a Prisma `$transaction` to prevent partial saves across User + StaffProfile + role table
- Zone re-assignment for OMs: first `updateMany` to clear current zones, then `updateMany` to set new zones — atomic within the same transaction
- ID Mapping Rule: `Zone.operationsManagerId` stores the `User.id`, NOT the `OperationsManager.id` — must always pass `userId` when assigning

## Architecture Notes: Beneficiary Staff Assignment (2026-03-30)
- Pincode is the bridge: `Beneficiary.pincode` → `Zone.pincode` → Zone IDs → `StaffProfile.zoneId` filter
- Zone matching is soft: if no zone found for pincode, staff search still returns all active staff as fallback
- `available-staff` route must be registered BEFORE `/:id` route in Express to avoid route conflict (`/available-staff` being matched as `/:id`)
- CC selection conflict prevention: secondary CC dropdown filters out the currently selected primary CC
- Pending state pattern: `pendingPrimary/pendingSecondary = undefined` means "no change", `null` means "unassign", `string` means "assign this ID"
- Save optimization: only fields with `!== undefined` are included in the PUT payload

## Architecture Notes: Benefit Library Logic (2026-03-30)
- **Soft Deactivation**: Benefits are not hard-deleted; `isActive: false` is used to preserve historical package data.
- **Client-Side Filtering**: The Product Factory wizard requests `activeOnly: true` to prevent selecting discontinued benefits for new packages.
- **Management View**: The Benefits Library page omits the filter to allow admins to re-activate hidden benefits.

## Architecture Notes: Seeding & Test Data (2026-03-30)
- **StaffProfile Dependency**: The `available-staff` filtering logic relies on `StaffProfile.zoneId`. Seeding must include both `CareCompanion` (profile) and `StaffProfile` (role/zone link) for the Admin UI to function correctly.
- **Pincode String Matching**: Uses exact string matching for `pincode` in `Zone` and `Beneficiary` models to bridge staff assignments.

