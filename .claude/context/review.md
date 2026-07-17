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

---

## Architecture Notes: Enrollment Wizard & Medical Synchronization (2026-04-07)
- **Single-Step Admin Enrollment**: The `admin-enroll` route (`subscriptions.js`) handles the creation of a Subscriber User, Beneficiary User, Beneficiary Profile, Emergency Contacts, Medications, and a fresh Subscription in a single Prisma `$transaction`.
- **Dynamic Medical Condition Resolution**: 
    - The frontend sends a simple `string[]` of medical conditions. 
    - The backend performs a "find-or-create" on `MedicalCondition` by name.
    - Slug generation (`toLowerCase`, `replace spaces with hyphens`) ensures URI-safe lookups.
    - `BeneficiaryCondition` links are created with `upsert` to handle repeat enrollments or existing data gracefully.
- **Structured Medication Persistence**: 
    - `Medication` model now stores UI-selected `timeSlots` (`morning`, `afternoon`, `evening`) in a `String[]` column.
    - `setReminders` is passed directly to the DB to enable push notifications for medicine intake via the mobile app.
- **Pincode Serviceability Auto-Fill**:
    - `PincodeCheck` component abstracts the `GET /api/zones/check-pincode/:pincode` call.
    - `EnrollmentWizardPage` listens for the `onCheck` callback to auto-populate `City` and `State` fields, reducing manual entry for admins.
- **Relationship Persistence**: `relationship` (e.g. "Father", "Mother") is captured during beneficiary creation and persisted to the `Beneficiary` table for emergency dispatch context.

## Architecture Notes: Core Service Delivery Logic (2026-04-07)
- **Staff Password Management**: Integrated `bcryptjs` for hashing passwords during onboarding and updates. Staff roles (`sales`, `field_manager`, `operations_manager`) are now enabled for DB-backed login.
- **RBAC Enforcement**: `GET /api/beneficiaries` and `GET /api/beneficiaries/available-staff` use `req.user.id` and `req.user.zoneId` (from JWT) to filter results for Field Managers.
- **Transactional CC Assignment**: `assign-staff` endpoint wrapped in `$transaction` to ensure `Notification` records are created atomically when a CC is assigned.
- **Transactional Visit Check-Out**: `visit_service.ts` in `mobile-backend` now handles hour/unit deduction during check-out using a `$transaction`. It updates the Visit, Subscription balance, and creates an audit `PackageHoursLog`.
- **CC Dashboard Endpoint**: Centralized `GET /assigned-beneficiaries` in `mobile-backend` to simplify CC app dashboard development.

---

## Architecture Notes: Visit Image Gallery & Human-Readable Visit Codes (2026-06-10)
- **Schema Alignment**: Kept `imageUrls` and `visitCode` synchronized in both backend schemas so that all database adapters function correctly without mismatch errors.
- **Ambiguity-free Charset**: Using `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` for visit code generation prevents human errors when reading or communicating codes over phone/email.
- **Unique Identification**: Added a unique constraint on `visitCode` to guarantee single-visit referencing. Code generation falls back gracefully to retry on rare collision checks.
- **Frontend Filter Pattern**: Filter query parsing in `admin-backend` routes supports partial matching or exact unique matches on `visitCode` without throwing DB schema cast errors.
- **Aesthetic Monospace Badging**: Utilized uppercase letter spacing and monospace font styling for the visit code badges on the Admin Panel to differentiate them visually from legacy hashed encounter IDs.
- **Double-Layered Validation**: Implemented scheduling constraints at both the UI level (disabling buttons, setting `min` date limits) and operational function boundaries (`handleSchedule` rejects invalid inputs using Toast errors) for reliable client data integrity.
- **Local-Safe Date Offsets**: Swapped native `.toISOString()` splitting with custom local date constructors (`getLocalDateString`) to prevent day-shifting errors between local time zones and UTC.
- **Inline Alert Warning Contexts**: Employed high-visibility conditional alerts below form triggers to explain action block reasons (e.g. past times or missing package benefits) directly to the operator.

---

## Architecture Notes: Dynamic Vitals System (2026-06-23)

- **Dual-path storage (legacy + relational)**: The system has two vital storage mechanisms. Legacy boolean flags (`trackHeartRate`, `trackBloodPressure`, etc.) on the `Beneficiary` table were the original implementation. The newer relational path uses `BeneficiaryVitalConfig` rows linked to `VitalDefinition` records and supports unlimited admin-defined custom vitals. Both must be kept in sync.

- **Source of truth rule**: `BeneficiaryVitalConfig` is now the **authoritative source** for which vitals to display on the profile. The boolean flag path is only used as a fallback when `vitalConfigs` is empty (legacy enrollments before the fix).

- **Vital code contract**: The Admin module stores vitals with `VitalDefinition.code` (e.g. `PULSE`, `BP`, `BLOOD_GLUCOSE`, `SPO2`, `TEMP`, `WEIGHT`, `PAIN`, `RESP`). The enrollment form sends `{ [code]: true/false }`. The subscription service MUST map these codes when saving flags AND when creating `BeneficiaryVitalConfig` rows. Never use short legacy aliases (`HR`, `SUGAR`, `RR`) as primary keys.

- **Checkout write pattern**: `purchaseSubscription` in `subscription_service.ts` must do three things after creating the beneficiary:
  1. Write the legacy boolean flags (backward compat for dashboard queries).
  2. Resolve each checked vital code → `VitalDefinition.id` via `findMany`.
  3. `upsert` a `BeneficiaryVitalConfig` row per vital using the composite unique key `(beneficiaryId, vitalDefinitionId, effectiveFrom)`.

- **Profile read pattern**: `getBeneficiaryProfile` uses a `VITAL_META` lookup table keyed by code to map vitals to icon, color, and reading value extractor function. Any code not present in `VITAL_META` (custom admin vital) gets a generic `clipboard-pulse` icon and neutral grey — this ensures forward compatibility without code changes.

- **Display order**: Vitals in `vitalsData` are sorted by `vitalDefinition.displayOrder` so the order on the mobile profile matches what the admin configured in the Vitals module.

- **Backfill pattern**: When adding new relational data to existing records, create a `prisma/backfill_*.ts` script and run it once with `npx ts-node --transpile-only`. Do NOT run it on every server start. Document the result (records created / already existed) in `.claude/context/changes.md`.

- **Frontend color mapping**: `getVitalBgColor(code, label)` in `beneficiary-profile.tsx` maps by `code` first (reliable), then by `label` as fallback. Always prefer code-based matching. The backend sends `code` in every `vitalsData` entry for this reason.

---

## Architecture Notes: Consent & Verification Flow for CSA-Created Beneficiaries (2026-07-06)

- **Schema Alignment**: Added `createdBy` (default: `"subscriber"`, enum: `"subscriber" | "csa"`) and `verificationStatus` (default: `"verified"`, enum: `"verified" | "pending"`) fields to the `Beneficiary` model.
- **CSA Mode Admin Enrollment**:
  - The `/admin-enroll` route (`apps/admin-backend/routes/subscriptions.js`) checks for a `csaMode` flag.
  - If `csaMode: true`, the beneficiary profile is marked as `"pending"`, the linked subscription is marked as `isActive: false` (inactive), and no Payment record is written (since payment is deferred until subscriber activation).
  - Also added optional `subscriberPassword` handling in the endpoint, allowing admins to set test passwords for easier debugging rather than defaulting strictly to OTP-only login codes.
- **Mobile Backend Activation Pipeline**:
  - `GET /:beneficiaryId/pending-details` retrieves setup data pre-configured by the CSA.
  - `POST /activate` runs inside a Prisma transaction (`prisma.$transaction`) to update the beneficiary profile to `verificationStatus: "verified"`, set the subscription `isActive: true`, set active start/end dates based on activation timestamp, initialize subscription benefit balances, create the offline payment record under payment method `csa_prepaid`, and register an activity log entry.
- **Mobile Setup UI Integration**:
  - The main subscriber index checks `verificationStatus` and displays a grey `"Inactive - Verification Pending"` badge on the beneficiary card, which redirects the user directly into the wizard.
  - Form steps (`beneficiary-info`, `medical-info`, `emergency-contacts`, `schedule-preferences`) detect `isVerificationFlow === 'true'`, download the pre-populated values, and fill them in on mount.
  - The Checkout screen overrides normal gateway actions: it checks `isVerificationFlow === 'true'` to skip Razorpay and coupons, displays a terms-and-conditions acceptance checkbox, changes the primary CTA to **"Set to Active"**, and triggers `/activate`.
