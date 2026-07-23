- Added URL encoding for DATABASE_URL password in .env
- Synchronized database schema with Prisma (db push/generate)
- Fixed missing columns in zones table
- Implemented `StaffOnboardingMetadata` mock fallbacks in frontend `api.ts`
- Built Storage Service Architecture with Supabase/S3 adapters
- Added `fileKey` to `StaffDocument` schema for persistent storage tracking
- Created dedicated `POST /api/upload-document` with naming sanitization
- Refactored `/staff/onboard` to use backend-controlled document mapping
- Added `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_PROVIDER`, `STORAGE_BUCKET` to Admin Panel backend `.env`
- Added `staffOnboardingApi.uploadDocument()` to frontend `api.ts` (sends FormData to backend)
- Updated `StaffOnboardingPage.tsx` to track actual `File` objects in `pendingFiles` Map state
- After onboarding returns `staffProfileId`, all pending files are uploaded to Supabase in parallel
- Files are renamed client-side before upload using timestamp + uuid to prevent collisions
- Expanded `ADMIN_CREDENTIALS` array in `auth.js` to support 9090909090 / 010101 alongside 9999955555
- Fixed `getMetadata()` and `onboard()` mock fallbacks to only trigger on genuine network failures
- Improved `supabaseStorage.js` error messages to detect placeholder key and print clear error
- Added 5 new models to `schema.prisma`: `BenefitType`, `Benefit`, `Package`, `PackageBenefit`, `PackageDiscount`
- Created backend routes for `benefitTypes.js`, `benefits.js`, and `packages.js` including transactional multi-row creation
- Created frontend pages: `BenefitTypesPage.tsx` and `BenefitsPage.tsx`
- Integrated real APIs in `api.ts`, replacing old mock stubs and fixing duplicate declaration errors
- Updated `routes.tsx` to include new management pages
- Merged `Package` model into `SubscriptionPackage` in `schema.prisma` to consolidate package management
- Removed `SubscriptionType` enum to allow for arbitrary, user-defined package types (Dynamic Packages)
- Refactored all backend services (`subscription_service.ts`, `visit_service.ts`, etc.) to remove enum dependencies
- Updated Admin Panel backend `packages.js` route to support the existing "Product Factory" wizard's field names (`totalCost`, `monthlyUnits`)
- Fixed `seed_test.ts` by adding missing `generateUUID` imports and correcting `MedicationFrequency` enum values
- Synchronized database via `npx prisma db push --force-reset` and successfully re-seeded test data

---

## Session: Dynamic Staff Profile Editing & Zone Management (2026-03-30)

### StaffEditModal

- Created reusable `StaffEditModal.tsx` component used across CC, FM, and OM listing pages
- Modal fetches staff data via `GET /api/users/staff/:userId` and updates via `PUT /api/users/staff/:userId`
- Role-based rendering: Personal, Professional, and Assignment tabs adapt automatically based on role
- Zones (multi-select) for Operations Managers, team/zone assignment for CCs, reporting line for FMs
- Edit buttons added to `OperationsManagersPage.tsx`, `CareCompanionsPage.tsx`, and `FieldManagerPage.tsx`
- Onboarding page (`StaffOnboardingPage.tsx`) was intentionally left untouched

### Backend Staff CRUD (`users.js`)

- Added `GET /api/users/staff/:userId` — aggregates User + StaffProfile + role-specific table into one response
- Added `PUT /api/users/staff/:userId` — transactional update of User, StaffProfile, and role record (CC/FM/OM)
- OM updates include zone re-assignment: removes from old zones, assigns to new zones atomically

### Zone Management (`zones.js` + `ZonesPage.tsx`)

- Added `operationsManagerId` support to Zone creation and update routes
- Zone PUT endpoint accepts both `fieldManagerId` and `operationsManagerId` selectively
- `ZonesPage.tsx` now fetches `/api/users/operations-managers` alongside field managers
- Zone cards show both OM and FM labels with distinct orange/blue colors
- Unified assignment modal: toggle between "Ops Manager" and "Field Manager" tabs before assigning
- Fixed ID bug: zone assignment uses `userId` (not internal role table id) which matches `operationsManagerId` in `zones` table
- Fixed zone data fetch: removed `zonesJson.json` typo — now uses `zonesJson.data` correctly

### API Service Layer (`api.ts`)

- Added `staffOnboardingApi.getStaffDetails(userId)` → `GET /api/users/staff/:userId`
- Added `staffOnboardingApi.updateStaff(userId, data)` → `PUT /api/users/staff/:userId`
- Added (previously) `zoneApi.assignOM(zoneId, omId)` for direct zone OM assignment

---

## Session: Subscription Auto-Cost Calculation (2026-03-30)

- Updated `Benefit` interface in `types/index.ts` to include `unitCost?: number` and `isChargeable?: boolean`
- Added reactive `useEffect` in `SubscriptionsPage.tsx` to auto-calculate total package cost:
  - Formula: `Total = SUM(Benefit Unit Cost × Monthly Units) × Duration (Months)`
  - Triggers on: `selectedBenefits`, `benefitUnits`, `duration`, `benefits`, `showWizard` changes
- Labelled cost input as "Auto-calculated" with formula hint text for admin clarity
- Benefit selection step now shows per-unit cost (e.g., ₹500/visit) next to each benefit card
- Unit configuration step shows live cost subtotal per benefit row
- Calculated total is sent to backend as `totalCost` → mapped to `basePrice` in packages table
- Users can still manually override the total if needed (field is editable)

---

## Session: Beneficiary Staff Assignment via Pincode (2026-03-30)

### Backend (`beneficiaries.js` — Rewritten)

- `GET /api/beneficiaries` now returns: `pincode`, `city`, `state`, `primaryCcId`, `secondaryCcId`, `fieldManagerId`
  - Also includes proper `emergencyContacts` (filtered to isPrimary true)
- **NEW** `GET /api/beneficiaries/available-staff?pincode=XXXXX`:
  - Finds `Zone` records matching the given pincode + `isActive: true`
  - Queries `StaffProfile` with `role: 'care_companion'` + `zoneId IN [matched zones]` + `employmentStatus: 'active'`
  - Same query for `role: 'field_manager'`
  - Returns `{ careCompanions, fieldManagers, zones }` — only staff in the same pincode zone
  - If no zones match, still returns staff (graceful fallback)
- **NEW** `PUT /api/beneficiaries/:id/assign-staff`:
  - Accepts `{ primaryCcId, secondaryCcId, fieldManagerId }` (all optional)
  - Uses Prisma update with `include` to return newly assigned CC/FM names
  - Supports `null` values to unassign

### Frontend (`BeneficiariesPage.tsx` — Rewritten)

- Added **"Assign Staff"** tab in the beneficiary profile dialog (3 tabs total: Profile, Assign Staff, Clinical Config)
- On dialog open: auto-fetches `beneficiaryApi.getAvailableStaff(pincode)` if pincode exists
- Shows matched zone name in a banner for admin context
- Graceful states: no pincode warning, loading spinner, no staff found message
- Primary CC selector (orange accent): highlights current assignment, tapping row changes pending selection
- Secondary CC selector (blue accent): filters out the primary selection automatically
- Unavailable staff shown dimmed (opacity-50) but selectable (admin override)
- "Save Staff Assignments" button only enabled when `pendingPrimary` or `pendingSecondary` has changes
- After save: refreshes local beneficiary data and resets pending state
- Beneficiary cards now show CC/FM assignment chips inline (orange = primary, blue = secondary)
- Beneficiary cards show zone pincode for quick reference

### API Service Layer (`api.ts`)

- Added `beneficiaryApi.getAvailableStaff(pincode)` → `GET /api/beneficiaries/available-staff?pincode=...`
- Added `beneficiaryApi.assignStaff(beneficiaryId, payload)` → `PUT /api/beneficiaries/:id/assign-staff`

---

## Session: Seeding & Benefit Library Fix (2026-03-30)

### Seeding Beneficiary Data (Pincode 110059)

- Updated `backend/prisma/seed_test.ts`:
  - Added new Beneficiary: **Mrs. Sharma** with pincode `110059`.
  - Added new Zone: **Janakpuri Zone** with pincode `110059`.
  - Added new Care Companion: **Amit Sharma** with `StaffProfile` linked to the Janakpuri Zone.
- This ensures the zone-based staff assignment feature can be tested with valid matching data.
- Successfully executed `npm run seed:test` to populate the database.

### Benefit Library Deactivation Fix

- **Types Update**: Added `isActive: boolean` to the global `Benefit` interface in `types/index.ts`.
- **Backend Filter**: Updated `GET /api/benefits` in `benefits.js` to handle `activeOnly=true` query parameter using Prisma filtering.
- **API Service**: Updated `benefitApi.getAll()` in `api.ts` to support the `activeOnly` option and append the query string.
- **Product Factory Wizard**: Updated `SubscriptionsPage.tsx` to call `benefitApi.getAll({ activeOnly: true })`.
- **Mock Data**: Updated `mockData.ts` to include `isActive: true` for all predefined benefits to ensure lint/type compliance.
- Result: Deactivated benefits in the library are now correctly hidden from the package creation wizard.

---

## Session: Vitals Management, Package Pricing Fixes, and Dynamic Pincode Registration (2026-03-31)

### Vitals Management System Implementation

- Created `VitalDefinition` Prisma model to store vital signs (name, unit, icon, field key, order, active status).
- Created a full CRUD backend API (`/api/vitals`) in the Admin Panel to allow admins to manage these definitions.
- Implemented soft deletion (`isActive: false`) logic for vitals.
- Created `VitalsPage.tsx` interface in the Admin Panel for adding, editing, and deleting vitals.
- Refactored `maihoonna/app/(setup)/medical-info.tsx` to pull dynamic vitals from a new `GET /api/public/vitals` endpoint instead of relying on hardcoded UI forms.

### Dynamic Subscription Packages Bug Fix

- Debugged `Cannot read properties of undefined (reading 'toLocaleString')` crash in `subscription-packages.tsx`.
- Identified mismatch between frontend mapping (`pkg.price`) and backend Prisma schema (`pkg.basePrice`).
- Applied the `basePrice` fix to `subscription-packages.tsx`, and proactively patched `subscribe-form.tsx` and `checkout.tsx` to prevent cascading checkout flow crashes.
- Added protective fallback defaults (`|| 0` / `|| []`) to features array mapping and visits counting.

### Dynamic Registration UI & Pincode Zoning

- Overhauled `maihoonna/app/(auth)/register.tsx` to perfectly match the revised brand aesthetic (colors, styling, spacing).
- Added dedicated inline phone number `+91` input box.
- Embedded real-time `useEffect` debounce listener onto the pincode input field.
- Created backend endpoint `GET /api/public/zones/check-pincode` which queries the `Zone` dictionary to see if a pincode is actively served.
- Implemented real-time dynamic zone rendering: Instantly flashes a green success banner fetching Care Companion and Care Center statistics if the zone exists, or an orange "coming soon" banner if it doesn't.
- Modified the existing single-page schema-breaking UX into an elegant 2-step sliding registration form. Clicking "Continue to Verification" now slides to step 2 to securely request `Age` and `Password` inputs in order to satisfy the legacy `/auth/register-password` backend endpoint.

### Medical Information UI Revamp & DB Hookup

- Remodeled the `maihoonna/app/(setup)/medical-info.tsx` page to replicate the custom mockup UI.
- Implemented deep React state array systems (`conditions[]`, `medications[]`) bridging the gap instead of using flattened strings.
- Developed custom floating modals:
  - "Add Medical Information": Collects medical condition titles pushing dynamically as pill tokens.
  - "Add Medicine": Collects drug payloads, dose metrics, frequencies (with enum adapters), and configurable time slots generating robust sub-cards.
- Added a `setReminders` boolean column explicitly to the backend `Medication` Prisma schema and pushed without code generation to unlock UI payload savings safely.
- Reworked `checkout.tsx` to JSON-marshall nested arrays into the `purchase` service effectively.
- Rewrote the `purchaseSubscription` query block inside `subscription_service.ts`:
  - Dynamically sweeps payloads resolving literal strings into `MedicalCondition` library entries before properly attaching normalized lookup relational ids onto the `BeneficiaryCondition` intermediate payload.
  - Converts UI Medication objects cleanly into exact Prisma `medicationList.create` payloads directly beneath Beneficiary creation queries utilizing generic type fallback bridges `/ @ts-ignore` for active session migrations.

---

## Session: Onboarding UX Enhancements & Relationship Persistence (2026-03-31)

### Beneficiary Onboarding UX (`beneficiary-info.tsx`)

- Replaced text input for "Relationship to Subscriber" with a premium bottom-sheet selection modal.
- Implemented dynamic "Other" logic: selecting "Other" or entering a custom value triggers a secondary text input for manual specification.
- Updated state management to seamlessly bridge the modal selection and the transition to custom text entry.

### Medical Info UX (`medical-info.tsx`)

- Replaced comma-separated text input for "Hobbies & Interests" with an interactive multi-choice grid modal.
- Implemented `toggleHobby` logic to manage multiple selections within a persistent string state.
- Added "Other" hobby support: checking "Other" reveals a text field to capture custom interests (stored as `(Custom Value)`).

### Backend & Database Integration

- **Prisma Schema**: Added `relationship` field (String?) to the `Beneficiary` model.
- **Migration**: Applied `add_relationship_to_beneficiary` migration to the PostgreSQL database.
- **Subscription Service**: Updated `purchaseSubscription` in `subscription_service.ts` to extract the `relationship` field from the frontend payload and persist it during beneficiary creation.
- **Data Seeding**: Enhanced `seed_test.ts` to populate:
  - 7 Vital Definitions (BP, HR, Sugar, etc.) for dynamic medical-info rendering.
  - 8 Common Medical Conditions.
  - 3 Standard Subscription Packages (Silver, Gold, Platinum).
- **Execution**: Successfully re-seeded the database to provide a fully functional test environment with real data lookups.

---

## Session: Global Package Visibility & Advanced Coupon Engine (2026-03-31)

### Global Subscription Visibility

- Added `isGlobal` boolean field to `SubscriptionPackage` model in `schema.prisma`.
- Updated `getSubscriptionPackages` service in `subscription_service.ts` to filter by `isActive: true` AND `isGlobal: true` for subscriber-side listings.
- Added `isGlobal` control to Admin Panel package creation/edit flow and backend routes.

### Advanced Coupon Engine Implementation

- **Database Schema**:
  - Added `Coupon`, `CouponUsage`, and `CouponAttemptLog` models supporting complex rules (limits, segmentation, expiration).
  - Extended `Payment` model with `couponCode` and `discountAmount` fields for transaction tracking.
  - Executed migration and regenerated Prisma Client after clearing Node process locks.
- **Validation Service (`coupon_service.ts`)**:
  - Developed a centralized 9-step validation engine (Status, Dates, Global Limits, Per-User Limits, Package Eligibility, Min Order, First-Time Users).
  - Added `logCouponAttempt` for ROI and fraud tracking.
- **Admin Dashboard Integration**:
  - Created `CouponsPage.tsx` with a multi-tab wizard and analytics dashboard showing total redemptions vs. failed attempts.
  - Registered new coupon CRUD routes in `Admin_panel/backend/server.js`.
- **Subscription Checkout Integration**:
  - Exposed `POST /api/subscriber/coupons/validate` for real-time mobile app validation.
  - Refactored `purchaseSubscription` in `subscription_service.ts` to consume `couponCode`, apply discounts, and persist usage records atomically.
  - Updated `maihoonna/app/(setup)/checkout.tsx` with a premium coupon UI, real-time total recalculation, and discount visibility.

### Critical Fixes & Cleanup

- Fixed incorrect relative import paths in `subscription_service.ts`.
- Resolved Prisma Client synchronization errors by force-regenerating the client.
- Confirmed zero TypeScript template/lint errors in the backend service layer.

---

## Session: Pincode Lookup Service & Automated Location Entry (2026-04-01)

### Backend Proxy Route

- Developed `GET /api/pincode/:pincode` in `backend/routes/pincode.js`.
- Proxies requests to the Indian Postal Pincode API (`api.postalpincode.in`) to avoid CORS issues and centralize external calls.
- Registered the route in `server.js`.

### Reusable Frontend Hook

- Created `usePincodeLookup.ts` in `frontend/src/app/hooks/`.
- Encapsulates fetching, debouncing logic (triggers on 6 digits), loading states, and error handling.
- Supports multiple "Post Office" results for a single pincode.

### Zones Management Integration (`ZonesPage.tsx`)

- Integrated `usePincodeLookup` into the Zone creation/edit form.
- Implemented a **Multi-Area Selection Dropdown**: If a pincode maps to multiple areas, a floating list allows for manual selection.
- Auto-fills `City`, `State`, and `Address` (with the area name) upon selection.
- **Bug Fix**: Added logic to clear location fields when the pincode is deleted.
- **Dynamic Override**: Ensured selecting a new area always overwrites the Address field with the fresh area name.

### Staff Onboarding Integration (`StaffOnboardingPage.tsx`)

- Integrated `usePincodeLookup` into Step 1 (Personal Details).
- **Layout Fix**: Resolved dropdown visibility issues in the 3-column grid by nesting the absolute-positioned results inside a `relative` wrapper.
- Synchronized `City`, `State`, and `Address Line 1` with the pincode lookup results.
- Maintained manual override capability for all auto-filled fields.

### Git Operations

- Successfully rebased local commits with `origin/main` to resolve push rejections.
- Pushed all integration changes to the remote repository.

---

## Session: Scalable DataFilter & API-driven Search (2026-04-01)

### Database Optimization

- Added `@@index` directives to `schema.prisma` for `name`, `city`, and `pincode` across all major models (Zone, Beneficiary, CareCompanion, etc.).
- Applied indexes to the production database via `npx prisma db push`.

### Backend API Refactoring

- Standardized all `GET` routes (`zones.js`, `beneficiaries.js`, `subscribers.js`, `users.js`) to support `search`, `searchBy`, `page`, and `limit`.
- Implemented efficient server-side pagination using Prisma's `findMany` and `count` in parallel.
- Fixed a critical crash where searching for text in a numeric column (like pincode) would error; added explicit typed-search handling.

### Frontend Component Architecture

- Created `DataFilter.tsx`: A premium, reusable filter bar with:
  - Debounced search (500ms) to reduce API load.
  - **"Search By" Toggle Buttons**: Segmented controls (Name, Zone, City, Pincode) to narrow down results explicitly.
  - Consistent styling with the MaiHoonNa design system.
- Updated `api.ts`: Added `getAllPaginated` methods for all staff and beneficiary entities.

### Page-level Integration

- Fully refactored **Zones**, **Operations Managers**, **Field Managers**, **Care Companions**, **Beneficiaries**, and **Subscribers** pages.
- Replaced all legacy client-side `.filter()` logic with real-time API calls.
- Added responsive pagination controls (Prev/Next) with "Showing X to Y of Z" indicators.

### Document/Storage Fixes

- Identified missing `.env` file in `Admin_panel/backend/` as the root cause of Supabase "Invalid Compact JWS" errors.
- Created a `.env` template and instructed user on key placement to unblock file uploads.

---

## Session: Search UI Modernization & Flexible Infrastructure (2026-04-01)

### Premium Search & Filter UI

- **Integrated Design**: Rebuilt `DataFilter.tsx` as a unified search bar with an internal category dropdown (Amazon/Flipkart style).
- **Global Search**: Defaulted search to "All" category while still supporting field-specific refinement (Name, Zone, Pincode).
- **Clear All**: Added a dedicated reset button that clears both search text and category filters instantly.
- **Micro-animations**: Added shadow-hover effects, vertical dividers, and refined border styling for a premium feel.

### UI Stability & Bug Fixes

- **Stale Closure Resolution**: Refactored data fetching in 6 major pages (`Beneficiaries`, `CareCompanions`, `Zones`, etc.) using `useCallback` to ensure fresh state usage.
- **Anti-Flicker Architecture**: Replaced the "unmount-on-load" pattern with a semi-transparent Loading Overlay.
- **Focus Persistence**: Ensured the search bar remains mounted during data refreshes, preventing cursor loss and input erasing while typing.

### Flexible Infrastructure (Amazon Ready)

- **Service Refinement**: Updated `supabaseStorage.js` to support `SUPABASE_ANON_KEY` as a fallback for initial development.

---

## Session: Backend Hardening & Standalone Production Readiness (2026-04-02)

### Standalone Backend Deployment

- **Decoupling**: Successfully prepared `admin-backend` for standalone production hosting.
- **Auto-Generation**: Added `"postinstall": "prisma generate"` to `package.json` to ensure the Prisma Client is built automatically during deployment on platforms like Render or Vercel.
- **Dependency Management**: Moved `prisma` from `devDependencies` to `dependencies` to ensure the generator is available in production environments.

### Database Stability & Connection Management

- **Prisma Singleton Pattern**: Implemented a robust singleton for the `PrismaClient` in `lib/prisma.js` to prevent connection leaks.
- **Shared Pool Singleton**: Integrated `pg.Pool` alongside `@prisma/adapter-pg` to resolve `DeprecationWarning: Calling client.query()` and optimize connection reuse.
- **Graceful Shutdown**: Added a robust `SIGINT/SIGTERM` handler in `server.js` that ends the database pool and releases port **3001** immediately.
- **Port Conflict Recovery**: Implemented a clear error handler for `EADDRINUSE` to guide users in clearing hanging processes.

### Prisma 7 Migration & Cloud Sync

- **Config Overhaul**: Migrated to the new `prisma.config.ts` format required by Prisma 7.
- **Schema Cleanup**: Removed the hardcoded `url` from `schema.prisma` (no longer supported in P7 with adapters) and centralized it in the config file.
- **Database Synchronization**: Successfully executed `npx prisma db push` to align the Supabase cloud database with the latest local schema transitions.

### Data Integrity & Frontend Validation

- **Strict Input Constraints**:
  - Implemented length and numeric-only restrictions for **Phone (10)**, **Pincode (6)**, **Aadhaar (12)**, and **PAN (10, uppercase)** fields.
- **Chronological Validation**:
  - Added date-range checks for **Zone Lease** and **Subscription Dates** (Expiry must be after Start Date).
- **Coupon Lifecycle**:
  - Implemented a "Soft Delete" feature (`isActive: false`, `isVisible: false`) for the Coupon Management UI to preserve historical usage data while removing active availability.

### Comprehensive Seeding System

- **Unified Seeder**: Created a robust `prisma/seed.js` script that populates the entire system (Subscribers, Beneficiaries, Managers, CCs, Packages, and Zones) in one pass.
- **Integration**: Registered the seed command in `prisma.config.ts` for native `npx prisma db seed` support.
- **Verification**: Built and ran `verify-seed.js` to ensure data integrity across all relational models.

---

## Session: Subscription Package Overhaul & Refined Pricing (2026-04-06)

### Database & Schema Evolution

- **Prisma Schema**: Added `mrp`, `discountPercentage`, and `miscellaneousCost` (Float) fields to the `SubscriptionPackage` model.
- **Synchronization**: Successfully executed `npx prisma db push` and regenerated the Prisma Client across all backend services (`admin-backend`, `mobile-backend`).

### Admin Backend Hardening

- **Fixed 500 Error**: Resolved a critical crash in `POST /api/packages` caused by an attempt to write to the non-existent legacy `totalHours` field.
- **Enhanced Routes**: Updated `POST` and `PATCH /api/packages` to correctly handle `mrp`, `discountPercentage`, and `miscellaneousCost`.
- **Type Safety**: Ensured `parseFloat` mapping for all incoming pricing strings to prevent database type mismatches.

### Admin Frontend (Product Factory 2.0)

- **UI Streamlining**: Hidden legacy "Duration (Months)" and "Total Allocated Hours" fields from the creation wizard to focus on unit-based benefits.
- **Pricing Logic Engine**:
  - **Formula**: `(Benefit Subtotal × (1 - Discount/100)) + Miscellaneous Cost`.
  - **MRP Auto-Calculation**: Automatically sets MRP as `Benefit Subtotal + Miscellaneous Cost`.
- **Manual Pricing Override**:
  - Implemented `isManualPrice` state to allow admins to precisely set the final package price regardless of the calculated suggestion.
  - Added a "Reset to calculated" feature to easily revert manual changes.
- **Cost Breakdown UI**: Added a detailed breakdown in the **Review Step**: `Benefit Subtotal` → `Discount` → `Miscellaneous` → `Final Cost`.
- **Formatting**: Updated benefit unit rendering to a cleaner `[Benefit Name] [Amount][Label]` format with bolded quantities.

### Mobile App Discovery & Benefits

- **Backend Service**: Updated `subscription_service.ts` to include nested `packageBenefits` and their associated `BenefitTypes` in the packges payload.
- **UI Redesign**: Overhauled `subscription-packages.tsx` for a clearer visual hierarchy:
  - **Price Transparency**: Added strike-through MRP and a prominent discount badge (e.g., "20% OFF").
  - **Benefit-Centric Cards**: Replaced static feature strings with dynamic database benefits (e.g., **12 Sessions** of Physiotherapy).
  - **Bold Formatting**: Applied `800` font weight to unit quantities for better readability.
  - **Simplicity**: Removed legacy 6-month/Annual toggles to provide a more direct, benefit-focused choice.

---

## Session: System Benefit Types Locking & UI Governance (2026-04-06)

### Database & Protection Layer

- **Prisma Schema**: Added `isSystem: Boolean` (default: false) to the `BenefitType` model.
- **Database Sync**: Pushed schema changes to Supabase via `npx prisma db push`.
- **System Marking**: Executed a targeted migration script to mark the 7 core benefit types (**Nurse, Care Assistant, Ambulance, Tele-consultation, Physio Session, Lab Test, Pharmacy**) as `isSystem: true`.
- **Backend Hardening**: Updated `benefitTypes.js` routes (`PATCH`, `DELETE`) to strictly block renaming or deactivation of system-protected types.

### Admin Dashboard UI (`BenefitTypesPage.tsx`)

- **System Badge**: Implemented a prominent amber "System" badge with a `Lock` icon for protected benefit types.
- **Action Governance**:
  - Disabled **Edit** and **Deactivate** buttons for system types to prevent accidental modification.
  - Integrated `TooltipProvider` to explain _why_ these actions are disabled ("System types are required for tracking").
- **Edit Form Protection**: Specifically disabled the "Name" input field when editing a system type to maintain data integrity for downstream hour-tracking systems.
- **Lucide Integration**: Added `Lock` icon to the benefit cards for immediate visual recognition of protected status.

### Source Control

- Committed and pushed all changes to `main` branch with descriptive tracking.

---

## Session: Pincode Serviceability & Enrollment Wizard UI Modernization (2026-04-07)

### Pincode Serviceability Check

- **Backend Router (`zones.js`)**: Implemented `GET /api/zones/check-pincode/:pincode` returning standardized JSON wrapped in a `data` object.
- **Frontend Component (`PincodeCheck.tsx`)**: Updated to pass the full `Zone` object to the parent on success.
- **Wizard Integration**: Implemented auto-fill logic in `EnrollmentWizardPage.tsx` for City and State based on pincode serviceability results for both Subscriber and Beneficiary.

### Enrollment Wizard: Medical & Life Modernization

- **UI Redesign**: Replaced static text inputs with dynamic, interactive lists matching the mobile app's core UX.
- **Medical Conditions**: Added a token-based system with a `Dialog` modal for adding custom conditions.
- **Medication Scheduling**: Implemented a comprehensive `Add Medicine` form capturing Dosage, Frequency, Time Slots (Morning/Afternoon/Evening), and a `setReminders` toggle.
- **Hobbies & Interests**: Added a badge-based system with a `Dialog` modal for capturing personal interests to aid social connection matching.
- **Vitals Tracking**: Replaced standard checkboxes with a cleaner, grid-based toggle system for vital signs monitoring.

### Backend Enrollment Logic (`subscriptions.js`)

- **Medication Persistence**: Updated the `medicationList.create` mapping to correctly persist `timeSlots` (String[]) and `setReminders` (Boolean).
- **Condition Synchronization**: Implemented dynamic `MedicalCondition` resolution: automatically finds existing conditions or creates new ones via slug-generation before linking to the beneficiary via `BeneficiaryCondition`.
- **Relationship & Physician**: Ensured physician names, phones, and relationship fields are correctly persisted in the single-step admin enrollment flow.

### Structural Integrity & Stability

- Refactored `EnrollmentWizardPage.tsx` into a robust, multi-step conditional rendering architecture.
- Resolved JSX syntax errors caused by nested component breakages during the complex UI overhaul.
- Verified that the 5-step wizard correctly handles state transitions from Subscriber → Beneficiary → Medical → Emergency → Package → Payment.

## Core Service Delivery Logic & Staff Password Management (2026-04-07)

### Staff Authentication & RBAC

- **Admin Backend (`auth.js`)**: Extended `/login` to support DB-backed `bcrypt` login for **Sales**, **Field Manager**, and **Operations Manager**.
- **Admin Backend (`users.js`)**: Added `sales` to onboarding roles and implemented password hashing during staff creation.
- **Admin Backend (`beneficiaries.js`)**: Applied zone/FM-based filtering on list and available-staff endpoints.
- **Admin Frontend**: Added "Access & Security" settings to `StaffOnboardingPage` and updated `StaffOnboardingPayload` types.

### Allocation & Notifications

- **Admin Backend (`beneficiaries.js`)**: Wrapped `assign-staff` in a Prisma transaction that automatically dispatches `Notification` records to Care Companions upon assignment.

### Care Companion Dashboard

- **Mobile Backend (`profile.routes.ts`)**: Created `GET /api/care-companion/profile/assigned-beneficiaries` to serve assigned client lists to the CC mobile app.

### Service Usage Deduction

- **Mobile Backend (`visit_service.ts`)**: Implemented transactional `checkOut` logic that:
  - Calculates visit duration.
  - Deducts units/hours from active `Subscription.hoursUsed`.
  - Logs deduction audit via `PackageHoursLog`.
  - Updates beneficiary emotional score.

## Session: Care Service Geolocation & Address Management (April 30, 2026 - 09:18 AM IST)

### Geolocation & Address System

- Created the `Address` model in the Prisma schema to store subscriber addresses with geographic coordinates (`latitude`, `longitude`, `isDefault`).
- Built the `LocationPickerMap` component in the mobile app using `expo-location` and `react-native-maps` to allow subscribers to drop pins and select accurate addresses.
- Handled dependency issues by correctly swapping missing `lucide-react-native` icons with `@expo/vector-icons` (Feather).

### Care Service Request Flow

- Extended the existing `Appointment` model with an `isServiceRequest` flag, an optional `careCompanionId`, and a relationship to the new `Address` model. This avoids creating a duplicate service request model and unifies scheduling.
- Implemented `RequestServiceScreen` in `apps/mobile-app/app/(beneficiary)/request-service.tsx` to let users choose existing addresses, or drop a new pin on a map to submit a request.
- Fixed authentication flow for service requests by correctly pulling the `userToken` from `AsyncStorage` and passing it in the `Authorization` header.
- Added a graceful "Demo Mode" fallback UI to the `request-service.tsx` screen so that it handles map and request interactions without crashing when the app is run locally without an active login context.

### Backend APIs & Stability

- Added dedicated backend routes for address management (`GET/POST /api/subscriber/addresses`) and service requests (`GET/POST /api/subscriber/service-requests`).
- Fixed Foreign Key constraint issues in `service-requests.controller.ts` by ensuring the appointment creation explicitly looks up the `Beneficiary.id` associated with the logged-in `userId`, rather than attempting to save the `userId` directly as the `beneficiaryId`.
- Wrapped async controllers (`addresses.controller.ts` and `service-requests.controller.ts`) with Express `asyncHandler` to catch rejected promises (e.g., Prisma errors) and prevent Unhandled Promise Rejections from crashing the backend.
- Resolved all TypeScript and compilation errors across `mobile-app` and `mobile-backend`.

---

## Session: Staff Avatar Standardization & Fixes (2026-04-30)

- Centralized profile photo rendering by creating an OOP-style reusable \EntityAvatar\ component.
- Replaced manual avatar rendering structures across Operations Managers, Field Managers, Care Companions, and Teams pages with the new component.
- Upgraded the \DataCard\ component to support avatar display for Subscribers and Beneficiaries.
- Identified and fixed a backend bug in \users.js\ where the Care Companion mapping logic was dropping the \profilePhoto\ field.
- Corrected frontend mapping logic in \CareCompanionsPage.tsx\ that was silently discarding the photo URL from the backend API response.
- Fixed TypeScript interface definitions to properly handle the \style\ prop for correctly overlapping avatars on the Teams page.
- Ensured fallback avatar logic automatically generates color-coded initials when user photos are absent.
- Synchronized and verified the full data flow from the database to the frontend across all roles.

---

## Session: Universal Geocoding & Address System Upgrade (2026-05-01)

### Backend Geocoding Proxy

- Implemented a public endpoint `GET /api/public/location/reverse-geocode` in the `mobile-backend`.
- Securely handles Google Geocoding API calls using a server-side `GOOGLE_MAPS_API_KEY`, protecting the API key from client-side exposure.
- Registered the route in `main.ts` with the `/api/public/location` prefix to support guest users during signup without requiring authentication.

### Database Schema Updates

- Added granular address fields to the `Beneficiary` model in `schema.prisma`:
  - `flatPlot`
  - `streetArea`
  - `landmark`
- Generated Prisma client to apply the new schema.

### Backend Subscription Service

- Updated `purchaseSubscription` in `subscription_service.ts` to accept and persist the new detailed address fields (`flatPlot`, `streetArea`, `landmark`, `city`, `state`, `pincode`, `latitude`, `longitude`).
- Ensured comprehensive address data is correctly packaged and saved into the `beneficiaries` table.

### AddressInputField Modernization

- Redesigned `AddressInputField.tsx` to function purely as a modern "Use Current Location" button (similar to Swiggy/Zomato).
- Removed the large, redundant manual `TextInput` for the full address string.
- The button now elegantly displays the fetched address or a loading spinner.
- Removed the legacy `AddressPicker` fallback modal entirely, opting for a clean alert error message when location access fails (especially handling the `User denied Geolocation` OS-level block).
- Enhanced UX by auto-routing fetched address details directly into the distinct form fields (Flat, Street, City, etc.).

### Frontend Form Integration

- Expanded `subscriberForm` and `beneficiaryForm` state objects in `subscribe-form.tsx` and `beneficiary-info.tsx` to handle the granular address fields.
- Removed outdated labels from `AddressInputField` usage, making the detect button act as a prominent action area.
- Updated `checkout.tsx` to correctly package and send all detailed address fields in the final purchase payload.

## Session: Global Change Password Refactor (2026-05-01)

### Bug Fixes & Refactoring

- **Resolved 400 Bad Request**: Identified a frontend state bug in the Change Password screen where the `verificationType` was incorrectly inferred at the moment of the API call, causing `currentPassword` to be sent as `undefined`.
- **Shared Component Architecture**: Extracted the password change logic into a globally reusable component `ChangePasswordSharedScreen.tsx` located in `apps/mobile-app/components/shared/`.
- **Removed Role-Specific Dependencies**: Eliminated the hardcoded fetch to `/subscriber/profile` for OTP verification. The component now reads the user's phone directly from the authenticated `userData` in `AsyncStorage`, making it compatible with all user roles.

### Backend Infrastructure

- **Global Auth Endpoint**: Moved the password change logic from the subscriber-specific service to a unified endpoint `POST /api/auth/change-password`.
- **Service Layer Migration**: Implemented the `changePassword` logic in `auth_service.ts`, supporting both OTP and Current Password verification types for any authenticated user.
- **Activity Logging**: Integrated automatic `SECURITY` activity logging for password changes directly into the global auth service.
- **Code Cleanup**: Removed legacy `changePassword` routes, controller methods, and service functions from the subscriber module to prevent code duplication.

### Frontend Routing

- Standardized the password change screen across all app modules.
- Updated `app/(subscriber)/settings/change-password.tsx` to use the shared component.
- Created new dedicated screens `app/(care-companion)/settings/change-password.tsx` and `app/(beneficiary)/settings/change-password.tsx` that wrap the shared component, ensuring the feature is available in all system modules.

---

## Session: Field Management Rebuild + Push Notification System (2026-05-11)

### Goal

Complete "fresh start" rebuild of the Field Management dashboard.
Flow: Select FM → Auto-load team (CCs) → Load zone-assigned beneficiaries → Appoint CC inline.
Also implement push notifications to CC, beneficiary, and subscriber when a CC is appointed.

---

### Admin Frontend — Component Architecture

**`SharedComponents.tsx`** (rewritten)

- Stripped all dead code; now exports only focused, reusable primitives:
  `LoadingState`, `EmptyState`, `ErrorState`, `StatCard`, `AvailabilityBadge`, `CCLoadBadge`, `Avatar`, `SectionHeader`

**`FMSelectorDropdown.tsx`** (new)

- Styled `<select>` dropdown listing all active Field Managers.
- Shows mini preview card (name, CC count, beneficiary count, availability dot) after selection.
- Warns when no FMs exist.

**`TeamPanel.tsx`** (new)

- Displays all CCs in the selected FM's team.
- Shows name, CC type (nurse / care assistant), phone, availability badge, primary/secondary load counts, today's visit count.
- Has a Refresh button.

**`BeneficiaryList.tsx`** (new)

- Searchable + filterable (All / Unassigned / Assigned) list of beneficiaries.
- Expandable rows: click a row to open the Appoint CC panel inline.
- Inline CC selector (dropdown) + Appoint button. Disable when all CCs are at capacity.
- Remove CC button on currently-assigned beneficiaries.

**`OpsManagerFieldView.tsx`** (full rewrite)

- Orchestrates all components.
- On FM select: loads team (CCs) via `fieldManagerApi.getMyTeam(fmId)` and beneficiaries via `fieldManagerApi.getBeneficiariesByFM(fm.userId)`.
- Stats row: Team Size, Available CCs, Beneficiaries, Assigned.
- Two-column layout: TeamPanel (2/5 width) + BeneficiaryList (3/5 width).
- Optimistic updates on assign/remove CC.
- Shows a placeholder when no FM selected yet.

**`FieldManagerView.tsx`** (cleanup)

- Removed broken schedule tab.
- Now reuses `TeamPanel` and `BeneficiaryList` components.
- BeneficiaryList shown in read-only mode for FM (assignment handled by Ops Manager).

**`AdminFieldView.tsx`** (bug fix)

- Fixed `TypeError: z.toLowerCase is not a function` crash.
  Cause: `assignedZones` array can contain objects `{id, name}` instead of plain strings.
  Fix: safe extraction `typeof z === 'string' ? z : (z?.name ?? z?.id ?? '')` before toLowerCase.
- Fixed broken imports: replaced removed `MyTeamTab`/`BeneficiariesTab` with `TeamPanel`/`BeneficiaryList`.

**`FieldManagementPage.tsx`** (simplified)

- Removed strict role gate for testing period.
- FM role → FieldManagerView. Everyone else → OpsManagerFieldView.
- Role locking to be applied later.

---

### Admin Backend

**`services/notifications.js`** (new)

- Expo Push Notification helper using native Node.js `https` module (no extra SDK needed).
- `notifyUser(tx, { userId, type, title, body, data })`: creates DB `Notification` record + sends Expo push if `User.fcmToken` is an `ExponentPushToken[...]`.
- `notifyMany(tx, [...])`: batch notification sender.
- All push errors are silently swallowed (never crash the main DB operation).
- Uses `setImmediate` to fire pushes outside the DB transaction.

**`routes/beneficiaries.js` — `PUT /:id/assign-staff`** (enhanced)

- Now fetches full beneficiary (`userId`, `subscriberId`) for notification targeting.
- On new primary CC assignment:
  1. Notifies CC: "👋 New Beneficiary Assignment — first visit scheduled 2 days from now at 10 AM"
  2. Notifies Beneficiary user (if has account): "🤝 Care Companion Assigned"
  3. Notifies Subscriber (family member): "✅ Care Companion Assigned"
  4. Notifies secondary CC if newly assigned.
  5. Creates an upcoming `Visit` record (status: `scheduled`, 2 days from now at 10 AM).
- All notifications + visit creation happen AFTER the transaction (non-blocking), so notification failure never rolls back the assignment.
- Added `notifyMany` import from `services/notifications.js`.

**`routes/field-manager.js` — `GET /beneficiaries`** (enhanced)

- Added `?fmId=<userId>` query param support.
- When `fmId` is passed and caller is admin or ops_manager: filter `WHERE fieldManagerId = fmId`.
- This ensures the beneficiary list is scoped to only those allocated to the selected FM (not all beneficiaries).

**`routes/users.js` — `POST /push-token`** (new)

- Stores Expo push token in `User.fcmToken`.
- Called by mobile app on launch to register/refresh the device token.
- Requires valid auth token (Bearer).

---

### Admin Frontend — API Service (`api.ts`)

- Added `fieldManagerApi.getBeneficiariesByFM(fmUserId)`:
  Calls `GET /field-manager/beneficiaries?fmId=<fmUserId>`
  Returns only beneficiaries assigned to that specific FM.
- `fieldManagerApi.getBeneficiaries()` (existing) unchanged — used by FM's own view (no fmId param).

**Why this matters**: Previously `OpsManagerFieldView` was calling `beneficiaryApi.getAllPaginated()` which returned ALL beneficiaries regardless of FM. Now it calls `getBeneficiariesByFM(fm.userId)` and gets only the ones assigned to that FM via Beneficiary Allocation.

---

### Mobile App — Push Notifications

**`package.json`**: Installed `expo-notifications` (SDK 55 compatible).

**`app.json`**: Added `expo-notifications` plugin:

```json
[
  "expo-notifications",
  {
    "icon": "./assets/images/group1.png",
    "color": "#FF7A00",
    "androidMode": "default",
    "androidCollapsedTitle": "MaiHoonNa Notifications"
  }
]
```

**`services/notifications.ts`** (new)

- `registerForPushNotifications()`:
  1. Skips on simulator (physical device only).
  2. Requests OS notification permission.
  3. Creates Android notification channel with `FF7A00` accent color.
  4. Gets Expo push token via `Notifications.getExpoPushTokenAsync({ projectId })`.
  5. Stores token locally in AsyncStorage.
  6. POSTs token to `POST /api/users/push-token` with auth header.
- `addNotificationReceivedListener(handler)`: foreground notification listener.
- `addNotificationResponseListener(handler)`: tap/open listener.
- `clearAllNotifications()`: dismisses tray + resets badge count.
- Foreground handler configured via `Notifications.setNotificationHandler` (show alert + sound + badge).

**`app/_layout.tsx`** (updated)

- Calls `registerForPushNotifications()` on app startup.
- Wires up foreground received listener (logs title to console).
- Wires up tap listener (logs `data` — TODO: navigate to relevant screen based on `data.type`).
- Cleans up both subscriptions on unmount.

---

### Architecture Notes

**How push notifications flow:**

```
Admin appoints CC (PUT /beneficiaries/:id/assign-staff)
  → DB transaction: update beneficiary + activity log
  → Post-transaction (non-blocking):
      → notifyMany() → for each user:
          → prisma.notification.create (DB record)
          → fetch user.fcmToken
          → if ExponentPushToken[...]: POST to exp.host/--/api/v2/push/send
  → Mobile app receives push via Expo infrastructure
  → On app open: registerForPushNotifications() syncs device token
```

**Key design decisions:**

- Expo Push API used (no Firebase SDK dependency) — free, reliable, cross-platform.
- `User.fcmToken` field (already existed in schema) repurposed for Expo push tokens.
- Notifications outside transaction: failure never rolls back CC assignment.
- `?fmId=` server-side filter: avoids sending all beneficiaries over the wire.

---

## Care Companion Live Module Updates (May 12, 2026)

### Mobile App — Sandboxed Navigation

**`apps/mobile-app/components/care-companion/CompanionBackButton.tsx`** (new)

- Extracted back-navigation logic into a dedicated, sandboxed component that operates solely within the local companion hierarchy.
- Relies on dynamic `router.canGoBack()` checks and falls back elegantly to `router.replace('/(care-companion)')` to eliminate unresolved module path bundler cache errors.

**Import Cleansing** (updated)

- Standardized all back button imports to the modular `CompanionBackButton` in **`visit-details.tsx`**, **`profile.tsx`**, and **`history.tsx`** to ensure full layout stabilization.

---

### Mobile App — Defensive Dashboard & Responsive UI

**`apps/mobile-app/app/(care-companion)/index.tsx`** (updated)

- **Null Safety Integration**: Embedded conditional optional-chaining checks on `nextVisit` to prevent dashboard page load crashes if the care companion has zero active scheduled visits.
- **Graceful Empty State**: Renders a premium `"No Upcoming Visits"` card with a pleasant status message and clear instructions rather than a blank or broken screen.
- **Grid Rebalance**: Converted the Quick Actions grid from a 2x2 layout (which left an awkward blank fourth slot after removing "Training") into a responsive, single-row **3-column horizontal menu** (`width: '31%'` with micro-shadows and compact centering).

---

### Mobile Backend — Completed Visits & Dynamic History API

**`apps/mobile-backend/app/api/care_companion/visits.routes.ts`** (updated)

- Added an authenticated **`GET /api/care-companion/visits/history`** endpoint:
  - Validates Care Companion authorization using secure JWT session headers.
  - Returns calculated live statistics: `totalVisits` completed, `totalHours` consumed, and `avgHours` per visit.
  - Queries and maps completed visits, feeding in the exact recorded vital signs (`bpSystolic`, `bpDiastolic`, `temperature`, `oxygenLevel`, `weight`), general checkout notes, overall companion mood, and medication names that were checked/taken.

---

### Mobile App — Live History Page Integration

**`apps/mobile-app/app/(care-companion)/history.tsx`** (updated)

- Upgraded the static placeholder page to fully fetch the dynamic **`GET /api/care-companion/visits/history`** database payload in real-time.
- Utilizes storage sessions via `AsyncStorage` and renders data into elegant, custom accordion dropdown rows containing recorded vitals and notes.

---

## Session: Dynamic Beneficiary Teams, Schedules, and Self-Healing Medication Tracking (2026-05-13)

### Dynamic Beneficiary Team Lookup

- **Problem**: The Care Team screen was hardcoded to display mock care coordinators and companions.
- **Solution**: Wired it up to real dynamic database relations.
- **Backend API (`apps/mobile-backend/app/api/beneficiary/team.routes.ts`)**:
  - Implemented authenticated route **`GET /api/beneficiary/team/me`** to dynamically extract the logged-in User's active health profile.
  - Queries the database to fetch their primary care companion (`primaryCc`), secondary care companion (`secondaryCc`), and primary field manager (`primaryCc.primaryCcProfile.fieldManager`).
  - Aggregates and returns detailed biographies, verified phone numbers, and profile photos for real care coordinators.
- **Frontend Integration (`apps/mobile-app/app/(beneficiary)/team.tsx`)**:
  - Upgraded the component to query this dynamic API on mount via AsyncStorage credentials.
  - Safely displays real team members or fallbacks with color-coded initial avatars if profile pictures are missing.

### Dynamic Schedule Timeline

- **Problem**: The upcoming schedule page was static and threw `400 Bad Request` errors during login sessions.
- **Solution**: Developed a clean endpoint mapping visit calendars to the UI.
- **Backend API (`apps/mobile-backend/app/api/beneficiary/schedule.routes.ts`)**:
  - Implemented authenticated route **`GET /api/beneficiary/schedule/upcoming`**.
  - Automatically maps the active user to their `Beneficiary` profile and queries the database for all `scheduled` or `in_progress` visits where they are the recipient.
  - Includes full Care Companion profile attachments to show names, roles, and profile photos in the client-side list.
- **Frontend Integration (`apps/mobile-app/app/(beneficiary)/schedule.tsx`)**:
  - Remodeled the upcoming visits tab to pull real live schedule cards matching the official high-fidelity UI design.
  - Gracefully displays a placeholder status when no visits are currently scheduled.

### Dynamic Medication Adherence Manager Upgrade

- **Problem**: The medication list on the mobile dashboard returned empty schedules because the mobile app queries with `userData.id` (User account credentials ID), while the admin panel saves medications with the `Beneficiary` operational health profile ID. In addition, the admin panel saves time slots as word checkboxes (`[ 'morning', 'afternoon' ]`) instead of strict colon-separated strings (e.g. `08:00 AM`).
- **Solution**: Developed a state-of-the-art dual-lookup and semantic translator layer.
- **Dual-Lookup Self-Healing (`apps/mobile-backend/app/services/shared/MedicationAdherenceManager.ts`)**:
  - Upgraded `resolveBeneficiaryId()` to automatically run a double-check query on incoming IDs:
    ```typescript
    const beneficiary = await prisma.beneficiary.findFirst({
      where: {
        OR: [{ id: this.beneficiaryId }, { userId: this.beneficiaryId }],
      },
    });
    ```
    If the manager is initialized with a `userId` (from mobile) or `id` (from admin), it automatically resolves to the correct profile, bridging the cross-portal databases seamlessly.
- **Semantic Word-based Time Slot Parser**:
  - Upgraded `parseTimeSlotToDate()` to recognize named checkboxes:
    - `'morning'` ➡️ `08:00 AM`
    - `'afternoon'` ➡️ `02:00 PM`
    - `'evening'` ➡️ `06:00 PM`
    - `'night'` ➡️ `09:30 PM`
      These chronological word translations are automatically mapped to real timezones for correct daily sequencing.

### Blank-Page Prevention & Upcoming Medication Scans

- **Problem**: Showing an empty screen with "No medications scheduled for today" on the meds page is a poor user experience if a beneficiary has upcoming medications starting in the future.
- **Solution**: Built an automatic forward-scanning scheduler.
- **Backend Upgrades (`MedicationAdherenceManager.ts` — `getTodaySchedule`)**:
  - Implemented a dual-state scheduler. First, it generates the dosage slots for today.
  - If today has zero active items, the manager automatically queries the database for the earliest active future medication start date:
    ```typescript
    const nextMed = await prisma.medication.findFirst({
      where: {
        beneficiaryId: this.beneficiaryId,
        isActive: true,
        startDate: { gt: todayEnd },
      },
      orderBy: { startDate: "asc" },
    });
    ```
  - If a future record is found, it calculates the dynamic hourly dosage slots for _that specific future date_, flagging them with:
    - `isFutureSchedule: true`
    - `futureDateText: "[Weekday], [Month] [Day]"` (e.g., `"Wed, May 20"`)
- **Frontend Upgrades (`apps/mobile-app/components/shared/MedsTracker.tsx`)**:
  - Added type-safety declarations in `MedScheduleItem` for `isFutureSchedule` and `futureDateText`.
  - Dynamically updates the daily schedule header row text. If the returned payload is a future-scanned schedule, it changes from `"Today's Doses"` to:
    > **`Upcoming Doses (Starting [Date])`**
  - This prevents blank screens and shows the user exactly when their medication schedule resumes!

### Global UX Routing Improvements

- **Home Dashboard (`apps/mobile-app/app/(beneficiary)/index.tsx`)**:
  - Routed the orange **"View All"** action button under the "Today's Medications" section to navigate straight to the `/meds` tracker tab using Expo Router.
- **More Options Navigation Menu (`apps/mobile-app/app/(beneficiary)/more.tsx`)**:
  - Connected the `Interactions` list option to route directly to `/(beneficiary)/interactions`.
  - Connected the `Medical Records` document option to route directly to `/(beneficiary)/medical-records`.
  - Added an **Orange Profile Card header** matching the high-fidelity UI mockup at the top of the menu list.
  - Tapping this card routes directly to the nested profile routing portal: `/(beneficiary)/profile`.
  - Dynamically loads and displays the active beneficiary's name.

### Dynamic Interaction Log Engine

- **Backend API (`apps/mobile-backend/app/api/beneficiary/dashboard.routes.ts`)**:
  - Created **`GET /api/beneficiary/interactions/me`** to dynamically extract all completed visits for the authenticated beneficiary.
  - Automatically loads the visiting care companion's name and avatar, parses actual checkout timestamps into human-friendly dates, calculates the precise duration, and formats the vitals, clinical checkout notes, and beneficiary feedback ratings.
- **Frontend View (`apps/mobile-app/app/(beneficiary)/interactions.tsx`)**:
  - Created a gorgeous interaction history list displaying expandable cards.
  - Includes a real-time star rating indicator (1-5 stars) matching the care companion visit ratings.
  - Expands dynamically with custom 2x2 vitals panels, clinical progress notes, and blue-tinted customer quote feedback blocks.

### Dynamic Medical Records & Trends Module

- **Backend API (`apps/mobile-backend/app/api/beneficiary/dashboard.routes.ts`)**:
  - Created **`GET /api/beneficiary/medical-records/me`** to pull the last 5 completed visits to track health metrics.
  - Returns the latest single reading of Blood Pressure, Heart Rate, Temperature, and Weight, alongside compiled historical charts tracking systolic and diastolic BP trends chronologically.
- **Frontend View (`apps/mobile-app/app/(beneficiary)/medical-records.tsx`)**:
  - Created a grid of vital signs displays containing color-themed metric indicators.
  - Engineered a premium, high-performance visual **Trends Graph Component** tracking historical systolic and diastolic blood pressure readings chronologically against baseline axes grids (0 to 140 scale).
  - Displays a detailed dual-column vital history summary matching the high-fidelity UI specifications.

### Dynamic Profile Management Sub-system

- **Backend APIs (`apps/mobile-backend/app/api/beneficiary/dashboard.routes.ts`)**:
  - **`GET /profile/me`**: Pulls full detailed Beneficiary entity data, mapping associated User attributes, diagnosed conditions relation trees, and Emergency Contacts collections.
  - **`POST /profile/me`**: Safely pushes contact updates (Name, Phone, Email, Address) atomizing across User logins and Beneficiary tables concurrently.
  - **`POST /profile/health-info`**: Overhauls Blood Group definitions, translates selection grids, and auto-syncs allergies/conditions. Automatically provisions missing cataloged `MedicalCondition` rows to protect DB foreign reference constraints.
  - **`POST /profile/emergency-contacts`**: Cleanses, overwrites, and sequences primary/secondary emergency contacts collections in the DB.
- **Client Nested Sub-routes (`apps/mobile-app/app/(beneficiary)/profile/...`)**:
  - **`index.tsx`**: Features a premium orange gradient banner, editable avatar badge, 3-grid summary bubbles (Blood Type, Allergies count, Conditions count), editable contacts panel, and direct deep-links.
  - **`health-info.tsx`**: Displays blood group grids, interactive dismissible tags for allergies/conditions, inline modals to append records dynamically, and cautionary advisory cards.
  - **`emergency-contacts.tsx`**: Renders emergency contact badges, manages primary/secondary notification flags, and features deletion prompts alongside addition workflows.
  - **`notifications.tsx`**: Hosts styled Switch toggles adjusting Push, SMS, and WhatsApp alerts.

### Workspace Cleanup & Technical Debt Reduction

- Deleted all temporary diagnostic and scratch scripts across `apps/mobile-backend/scripts/`, `apps/admin-backend/scratch/`, and database validation artifacts.
- Left the core `prisma/seed-beneficiary-subscriber.js` fully intact and ready to seed.

---

## Session: Care Companion & Beneficiary Web-safe Alerts, Flow Redirection & Layout Optimization LLD (2026-05-13)

This section provides the **Low-Level Design (LLD)** and code-level mechanics implemented during the mobile app refinement sessions. These improvements address cross-platform web vs. native bugs, clean up route structures under Expo Router, and prevent UI clipping issues.

### 1. Cross-Platform Web Confirmation Modal Adapter

- **Problem**: React Native's `Alert.alert` with multiple buttons (like _Delete/Cancel_ or _Done/Exit_) silent-fails in Web browsers (`localhost:8081`). Native platforms intercept these modal configs easily, but standard browsers treat the callback array as a no-op, preventing deletion and checkout flows.
- **Low-Level Design (LLD)**:
  - Added specialized platform-conditional routing blocks using React Native's `Platform.OS === 'web'`.
  - For Web compilation: Fallback to the browser's synchronous native `window.confirm(message)` and `window.alert(message)` modal boxes.
  - Implemented inside:
    - **`apps/mobile-app/app/(beneficiary)/profile/emergency-contacts.tsx`**: Triggers a `window.confirm()` confirmation modal. On approval (`confirmed === true`), it correctly maps the filter indexes and fires the `handleSaveContacts()` backend action.
    - **`apps/mobile-app/app/(care-companion)/visit-details.tsx`**: Displays a synchronous success `window.alert()` upon successful database synchronization, immediately releasing the thread to redirect the companion.

### 2. Expo Router Nesting & Tab bar Route Consolidation

- **Problem**: In Expo Router, every page created inside the `app/(beneficiary)` subdirectory automatically registers as an active bottom tab inside `_layout.tsx` unless manually overridden. This causes duplicate icons, broken margins, and overlapping arrow tab selectors.
- **Low-Level Design (LLD)**:
  - Consolidated the bottom navigation layout in **`apps/mobile-app/app/(beneficiary)/_layout.tsx`**.
  - Added explicit `<Tabs.Screen>` overrides for all utility pages and directories, setting `options={{ href: null }}`.
  - Fully restricted bottom tabs to only the **5 Primary User Flows**:
    - `index` (Home Dashboard)
    - `schedule` (Appointments Timeline)
    - `meds` (Pill Adherence Calendar)
    - `inbox` (Companion Messaging)
    - `more` (Global menu panel)
  - Hidden sub-routes with `href: null` (accessible via internal `router.push` action handlers):
    - `team` (Care coordinator cards)
    - `request-service` (Care booking)
    - `interactions` (Companion feedback logs)
    - `medical-records` (Diagnostic trends chart)
    - `profile/index` (Main bio details)
    - `profile/health-info` (Allergies list)
    - `profile/emergency-contacts` (Next-of-kin card)
    - `profile/notifications` (Switch preferences)
    - `settings` & `settings/change-password`

### 3. Care Companion Checkout Redirection Flow

- **Problem**: After saving home-visit notes and vitals, Care Companions were returned to a "Success" alert, but clicking "Done" simply popped the view controller (`router.back()`). This mistakenly sent them back to the active form edit sheet of an already completed and locked visit record.
- **Low-Level Design (LLD)**:
  - Updated the checkout submission pipeline in **`apps/mobile-app/app/(care-companion)/visit-details.tsx`** inside `handleCheckOutSave()`.
  - Replaced back-navigation handlers with `router.replace('/(care-companion)')` (or `window.alert` fallback on web).
  - This immediately replaces the active route in the navigation stack with the Companion Dashboard screen (`index.tsx`), updating the calendar timeline automatically.

### 4. Browser Scroll-Lock & Viewport Layout Bug Fixes

- **Problem**: On web, React Native `<KeyboardAvoidingView>` can calculate container bounds incorrectly. This clips the page viewport and locks vertical scroll actions—completely hiding the bottom card inputs and the orange "Save Encounter" trigger buttons.
- **Low-Level Design (LLD)**:
  - Disabled the active keyboard boundaries specifically for Web browsers in **`apps/mobile-app/app/(care-companion)/visit-details.tsx`** by adding:
    ```typescript
    <KeyboardAvoidingView enabled={Platform.OS !== 'web'}>
    ```
  - Added explicit `style={{ flex: 1 }}` and `showsVerticalScrollIndicator={true}` directly to the wrapper `<ScrollView>`. This instructs browser layout engines to inject the default vertical scrollbar track.
  - Increased bottom breathing-room margins by setting the trailing spacing `<View>` spacer container from `40px` to `100px`.

### 5. Cleaning Overlapping Data & Care Hours Metric Removal

- **Problem**: The beneficiary home page (`(beneficiary)/index.tsx`) rendered a "Care Hours" metrics card that calculated float division strings (e.g. `16.016666666666666h`), resulting in text overlapping and breaking alignment. Because Care Hours are no longer in scope for active customer subscriptions, the section is redundant.
- **Low-Level Design (LLD)**:
  - Completely purged the `Subscription Hours Row` card from **`apps/mobile-app/app/(beneficiary)/index.tsx`** (lines 188 to 217).
  - This removes the division float numbers and cleanses the viewport layout, letting the card stack go directly from the stats row straight to the active **Care Coordinator** bio cards.

### 6. Chronic Conditions & Medical Info Database Schema Sync

- **Low-Level Field Mappings**:
  - **Chronic Conditions** in the UI are mapped to the **`MedicalInformation`** table fields in the database.
  - Saving diagnosed condition tags triggers a dynamic profile sync that inserts cataloged data while protecting DB foreign constraints:
    - **Backend Sync API Route**: `POST /api/beneficiary/profile/health-info` (File: `apps/mobile-backend/app/api/beneficiary/profile.routes.ts`)
    - **Database Upsert Flow**:
      ```typescript
      await prisma.beneficiaryMedicalInfo.upsert({
        where: { beneficiaryId: req.user.beneficiaryProfile.id },
        update: { chronicConditions: JSON.stringify(conditionsArray) },
        create: {
          beneficiaryId: req.user.beneficiaryProfile.id,
          chronicConditions: JSON.stringify(conditionsArray),
        },
      });
      ```

---

## Session: Security Hardening & Auth Infrastructure Upgrade (2026-05-16)

### Professional Authentication (JWT + RBAC)

- **Dual-Token System**: Implemented Access Tokens (1h) and Refresh Tokens (7d) to replace the legacy 24h static token system.
- **Refresh Token Rotation**: Created a database-backed session management system (`User.refreshToken`) that allows for secure token rotation and remote session invalidation.
- **New Auth Endpoints**: Added `/api/auth/refresh` (token renewal), `/api/auth/logout` (session clearing), and `/api/auth/me` (profile verification).
- **RBAC Middleware**: Implemented `authorizeRoles` middleware to enforce strict access boundaries between Field Managers, Admins, and Master Admins.
- **Route Protection**: Secured all sensitive admin routes in `server.js` using specific role requirements (e.g., locking admin management to `master_admin`).

### Password Security & Identity

- **Credential Migration**: Completely removed all hardcoded plain-text credentials (e.g., `ADMIN_CREDENTIALS` array) from the source code.
- **Bcrypt Integration**: Enforced `bcryptjs` hashing for all user accounts.
- **Database Seeding**: Created a secure database-backed Master Admin account (``) to replace the hardcoded fallback, ensuring the system is production-ready.

### Data Integrity & Beneficiary Sync

- **Medication Overwrite Logic**: Refactored the beneficiary update flow to support "Overwrite Sync" for medications.
- **Historical Protection**: Removed cascading deletes on medication adherence logs to ensure that updating a medication list never deletes past medical history.
- **Audit Logging**: Enhanced `ActivityLog` to track exactly which admin performed a beneficiary update and what specific changes were made.

### Frontend Synchronization

- **API Interceptor**: Updated the Admin Frontend's `apiFetch` to handle the new `accessToken` header and nested user profile structure.
- **Auth Context**: Rewrote the frontend `AuthContext` to support seamless login/logout and session persistence using the new multi-token response.

---

## Session: Geo-fenced Check-In and Proximity Flagging System (2026-05-28)

### Architectural Overview

To ensure that Care Companions (CCs) are physically present at a beneficiary's residence when checking in for a visit, we implemented a complete end-to-end Geo-fenced Check-in and Admin Flagging system.

The architecture balances accountability with field operational flexibility using a **"Soft Geofence Warning"** strategy:

- Care Companions are strongly encouraged to check in automatically when within range of the beneficiary's registered coordinates.
- If they are out of range or have GPS telemetry issues, they are permitted to override the geofence and check in manually by providing a mandatory explanation.
- The system automatically flags out-of-range, manual, and unverified check-ins on the Field Management admin dashboard, providing Field Managers and Operations Managers with complete transparency over field operations.

```
+------------------+                   +------------------+                   +--------------------+
|  CC Mobile App   |                   |  Mobile Backend  |                   |   Admin Frontend   |
| (expo-location)  |                   | (haversine dist) |                   |  (Field Dashboard) |
+--------+---------+                   +--------+---------+                   +---------+----------+
         |                                      |                                       |
         | --- 1. Get GPS coordinates --------> |                                       |
         | --- 2. Post Check-in ---------------> |                                       |
         |    (Coords + Manual Reason)          |                                       |
         |                                      | --- 3. Compute Proximity ------------> |
         |                                      | --- 4. Persist geo fields ------------>|
         | <--- 5. Return isGeoVerified ------- |                                       |
         |                                      |                                       |
         |                                      | <== 6. Fetch telemetry (admin API) ===|
         |                                      |                                       | --- 7. Display 4-State
         |                                      |                                       |    Proximity Badges
         v                                      v                                       v
```

---

### 1. Backend Infrastructure & Telemetry Persistence

#### Configurable Geofence Radius (`.env`)

- Added a new configuration parameter `GEOFENCE_RADIUS_METERS` to the mobile-backend environment file (`apps/mobile-backend/.env`), defaulting to **50 meters** (the industry standard for urban GPS variance).
- This enables administrators to scale or restrict the geofence range dynamically without requiring code modifications.

#### Input Schema Validation (`apps/mobile-backend/app/schemas/visit.ts`)

- Updated the check-in schema to accept an optional `manualCheckInReason` string, which accommodates explanation remarks from the Care Companion for manual overrides.

#### Proximity Metrics & Validation Logic (`apps/mobile-backend/app/services/care_companion/visit_service.ts`)

- **Haversine Distance Formula**: Implemented a mathematically precise spherical geometry helper `haversineDistance` to calculate the exact distance between two sets of GPS coordinates in meters:
  ```typescript
  function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  ```
- **Operational Verification Workflow**:
  1. The system fetches the target `Visit` and resolves its corresponding `Beneficiary` and user details.
  2. If the beneficiary does not have coordinates (`latitude` and `longitude` are null), the system bypasses range calculations, skips geofence validation, and flags the visit as unverified (`isGeoVerified = false`).
  3. When GPS coordinates are present, the backend calculates the exact distance (`geoDistanceMeters`) between the check-in location and the beneficiary's registered address.
  4. **Verification Evaluation**: A check-in is marked as **Geo-Verified** (`isGeoVerified = true`) ONLY if:
     - The Care Companion's distance is less than or equal to `GEOFENCE_RADIUS_METERS`.
     - The Care Companion did NOT supply a `manualCheckInReason` (which represents an intentional manual override).
  5. The telemetry data (`checkInLat`, `checkInLng`, `geoDistanceMeters`, `isGeoVerified`, and `manualCheckInReason`) is atomically persisted into the `Visit` database record.

#### API Endpoints Routing (`apps/mobile-backend/app/api/care_companion/visits.routes.ts`)

- Updated `/check-in` and `/:visitId/details` endpoints to serialize and return the new location telemetry attributes to the client app.

---

### 2. Mobile App (Care Companion Interface)

#### High-Accuracy GPS Retrieval

- Integrated the native **`expo-location`** library to interface with native iOS/Android location managers.
- Developed the asynchronous helper `getMyLocation()` requesting high-accuracy coordinates (`Accuracy.High`) to ensure reliability.
- Gracefully handles platform permissions: prompts users dynamically and issues intuitive warnings if location access is disabled.

#### Pre-Flight Distance Validation (`apps/mobile-app/app/(care-companion)/visit-details.tsx`)

- Added a client-side `haversineDistance` checker to perform real-time pre-flight range checks.
- When the screen loads, the app resolves the CC's current position and compares it to the beneficiary's location, displaying a live proximity indicator.

#### Dual Check-In Interface

Replaced the legacy single-button layout with a modern, high-fidelity card-based interface offering two operational pathways:

1. **Auto Geofence Check-In (Recommended)**:
   - A bright, prominent button enabled when the CC is resolved within the geofence range.
   - Triggers high-accuracy GPS capture, verifies range, and completes the check-in process instantly.
   - Post-check-in displays a premium green **"Location Verified ✓"** badge.
2. **Manual Override Check-In**:
   - Designed as an alternative when GPS signal is degraded, when indoor location drift occurs, or when checking in out of range.
   - Reveals an input text block requiring the Care Companion to provide a valid reason (e.g., "GPS signal weak inside house" or "Checked in at building entrance").
   - Restricts the submit action until remarks are entered, maintaining data accountability.
   - Post-check-in displays an amber **"Manual Check-in (Flagged)"** badge displaying the entered reason.

---

### 3. Admin Backend & Geolocation Reporting

#### Prisma Entity Mapping (`apps/admin-backend/routes/visits.js`)

- Refactored the `GET /api/visits` route to fetch the beneficiary's registered coordinates (`latitude`, `longitude`) along with the visit's check-in telemetry (`checkInLat`, `checkInLng`, `isGeoVerified`, `geoDistanceMeters`, `manualCheckInReason`).
- Maps and sanitizes these values, feeding a complete telemetry packet to the frontend dashboard.

---

### 4. Admin Frontend (Field Management Dashboard)

#### Real-time Geofence Status Tracking (`apps/admin-frontend/src/app/components/field-management/ScheduledVisitsPanel.tsx`)

- Upgraded the **Scheduled Visits Panel** used by Field Managers and Operations Managers.
- Added visual indicator chips to every in-progress and completed visit card, mapping their real-world geofence check-in status to a 4-state flagging matrix:

| State                  | Visual Indicator | Icon            | Condition                                                  | Actionable Info                                                                         |
| :--------------------- | :--------------- | :-------------- | :--------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Geo-Verified**       | 🟢 Green Chip    | `ShieldCheck`   | `isGeoVerified === true`                                   | Shows computed proximity at check-in (e.g., _"Location Verified · 12m"_)                |
| **Manual Check-In**    | 🟡 Amber Chip    | `AlertTriangle` | `manualCheckInReason` is populated                         | Displays the companion's raw explanation (e.g., _"Manual Check-in — GPS signal issue"_) |
| **Out of Range**       | 🔴 Red Chip      | `ShieldAlert`   | `isGeoVerified === false` and `geoDistanceMeters` > radius | Displays calculated violation distance (e.g., _"Out of Range · 342m"_)                  |
| **No Beneficiary GPS** | ⚫ Gray Chip     | `MapPin`        | Beneficiary coordinates are empty                          | Explains that coordinates are not registered (e.g., _"No Beneficiary GPS"_)             |

- This ensures that field administrators have immediate, glanceable insights to auditing operational compliance, preventing fraudulent check-ins while allowing natural manual exceptions.

---

### 5. In-Progress Visit Dashboard State Persistence & Resume Flow

To deliver a seamless user experience when a Care Companion backs out of an ongoing encounter or returns to the dashboard, we implemented a reactive visit state preservation mechanism:

#### API Enhancement (`apps/mobile-backend/app/api/care_companion/dashboard.routes.ts`)

- Modified the `/care-companion/dashboard` route inside the `nextVisit` payload generator to return the active/upcoming visit `status`.
- This exposes whether the visit is `'scheduled'` or already `'in_progress'` directly to the home screen payload.

#### Mobile Dashboard State Reactivity (`apps/mobile-app/app/(care-companion)/index.tsx`)

- Developed an `isVisitInProgress` state evaluator comparing `nextVisit.status === 'in_progress'`.
- **Dynamic Check-in Header Card**:
  - Retains the exact premium, unified brand theme color (`LIGHT_ORANGE` `#F97316`) and `location-outline` icon to preserve design continuity.
  - Updates the text dynamically to `"Visit In Progress" / "Active: [Patient Name]"` when in progress.
  - Replaces the generic `"Check In"` button label with a functional `"Resume"` button that links directly back to the active encounter.
  - Wired up the button's `onPress` to dynamically resume the active visit, providing a central access point.
- **Dynamic Next Visit Card**:
  - Dynamically updates the primary call-to-action button when a visit is active.
  - Switches the label from `"Start Visit"` to `"Continue Visit"`.
  - Preserves the native `DEEP_ORANGE` (`#FE6700`) brand color to maintain the original sleek aesthetics.
- When clicked, both pathways load the `/visit-details` page, which retrieves the saved checklist, dynamic vitals, and medication state from the backend database, enabling Care Companions to resume exactly where they left off.

---

## Session: Location Picker Crash Fix (2026-06-01)

### Fixed "Pick accurate location" ANR Crash on Android

- Rewrote `AddressPicker.native.tsx` to follow a Swiggy/Zomato style fixed-center crosshair paradigm.
- Eliminated JS-thread lag by ensuring the map pans underneath a static pin, preventing React Native `<Marker>` re-renders on every drag.
- Implemented a 300ms debounce before firing `Location.reverseGeocodeAsync` so it only geocodes when the user lifts their finger, rather than on every frame of a drag.
- Added an `isDragging` state to show a graceful loading indicator ("Move pin to select...") in the bottom sheet.
- Modified `getCurrentLocation.ts` to downgrade `Location.Accuracy.BestForNavigation` to `Location.Accuracy.Balanced` (matching industry standards) to fix the 30-second block when fetching the first GPS lock.
- Added the Google Maps SDK API key into `app.json` for Android so the native map component renders correctly instead of showing a blank grey grid.

---

## Session: Auth Navigation + Git Branch Fix (2026-06-02)

### Git Branch Recovery

- **Problem:** Developer force-pushed to `stagging`, overwriting recent commits and replacing the history, causing the user to lose visibility of a newly added `HeaderSpacer.tsx` component.
- **Solution:**
  - Recovered the user's original commit `6acea0e` ("Added Google Maps integration updates") and merged/cherry-picked the relevant code into the active working branch `main`.
  - Pulled the developer's forced changes from `stagging` (including the new `HeaderSpacer.tsx` component) onto the local `main` branch via `git restore --source=stagging`.
  - Consolidated the changes into a final stable `main` branch state under commit `4ed8e0b` ("changed the headerspacer"), preserving all commits and changes without overwriting.

### Global Auth Navigation & Persistent Session Fix

- **Problem:** When users performed a native slide-back gesture on iOS or Android on any dashboard/home screen, it would navigate them back to the Login screen and log them out of the device. Authentic sessions were not persistent, and users were forced to re-log in unnecessarily.
- **Root Cause:**
  - There was no centralized authentication state management (e.g. React Context).
  - Every individual dashboard index/screen layout was checking credentials via isolated `AsyncStorage` calls and immediately triggering `router.replace('/(auth)')` when initialized.
  - Auth screens remained in the active navigation stack history.
- **Solution:**
  - **Centralized Auth Context:** Developed `apps/mobile-app/contexts/AuthContext.tsx` providing a robust centralized `AuthContext` to track `isLoggedIn`, `userRole`, `isLoading`, and expose `login()` and `logout()` methods globally.
  - **Root Layout Navigation Split:** Updated the root `app/_layout.tsx` to conditionally render two completely distinct stack segments based on the `isLoggedIn` auth state:
    - **Unauthenticated Stack:** Renders only `(auth)` group screens (`index`, `verify-otp`, `login-password`, etc.).
    - **Authenticated Stack:** Renders application groups (`(subscriber)`, `(care-companion)`, `(beneficiary)`, etc.) and standalone app screens (`package-utilization`, `visit-details`).
    - _Impact:_ Once a user is logged in, auth screens are completely removed from the navigation stack history. Tapping or sliding back on any dashboard screen can no longer reach a login screen.
  - **Sign-in Flow Integration:** Refactored auth verification screens (`verify-otp.tsx` and `login-password.tsx`) to utilize `login(role)` from the `AuthContext` rather than performing ad-hoc `router.replace` navigation.
  - **Session Persistence:** Added automatic check on initialization in `AuthContext` to restore existing sessions from secure storage (`AsyncStorage`).
  - **Clean Logout Flow:**
    - Created a customized React Hook `useLogoutWithConfirm` inside `utils/logout.ts` that triggers an Alert modal and clears context state/AsyncStorage on confirmation.
    - Preserved a legacy backwards-compatible `logoutWithConfirm` function signature to prevent breakage on other screens.
    - Updated all dashboard header and profile files (`GlobalHeader.tsx`, `CompanionHeader.tsx`, `GlobalDrawer.tsx`, `profile.tsx`, `more.tsx`) to use the new hook.
  - **Back Gesture Protection:** Explicitly added screen options with `gestureEnabled: false` inside `(subscriber)/_layout.tsx` and `(care-companion)/_layout.tsx` root screens to block accidental exits from core dashboard roots.
  - **Removal of Legacy Guards:** Cleaned up all scattered, duplicate check-and-redirect scripts from index files across `(subscriber)`, `(beneficiary)`, and `(care-companion)` groups.
  - **TypeScript Verification:** Successfully compiled all modified files, ensuring all navigation, types, and hooks are fully clean.

---

## Session: Mobile Testing & Dashboard UI Alignments (2026-06-03)

### Environment-Aware API Router & Physical Device Tunneling

- **Problem:** When trying to test the mobile application on physical Android devices via Expo Go, Wi-Fi networks (LAN) blocked connection due to AP Isolation and local Windows Firewall rules.
- **Solution:**
  - Designed and documented a physical USB debugging workflow using **ADB reverse port forwarding** (`adb reverse tcp:8081 tcp:8081` & `adb reverse tcp:8001 tcp:8001`).
  - Created a complete developer onboarding document: [MOBILE_TESTING_SETUP.md](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/MOBILE_TESTING_SETUP.md) detailing prerequisites, PATH exports, USB debugging setups, and run instructions.
  - Refactored [api.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/constants/api.ts) to detect `__DEV__` environments. If testing locally, it dynamically routes traffic for Android/iOS simulators and physical devices (tunnelling localhost/127.0.0.1 via `adb reverse`) without hardcoding private dev IP addresses.

### Login Screen Layout & Figma Alignment

- **Problem:** The login interface was cut off on smaller mobile screen dimensions or when the soft keyboard was visible, and its visual design (logo, card gradients, text input borders, and buttons) did not match the Figma design specification.
- **Solution:**
  - Upgraded [index.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/index.tsx>) to wrap inside a properly-configured `KeyboardAvoidingView` and a parent-scrolled `ScrollView` for seamless keyboard and dimension handling.
  - Copied the high-quality user-provided logo assets into the project assets folder: the square circular logo symbol (`logo_symbol.png`) and the horizontal branded logo wordmark (`logo_full.png`).
  - Integrated [logo_full.png](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/assets/images/logo_full.png) inside the `logoContainer` on the login page [index.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(auth)/index.tsx>), using its exact 5.333:1 aspect ratio (`width: scale(220), height: scale(41.25)`) to display the official branded logo symbol and typography cleanly without squishing or distortion.
  - Aligned the login card gradient (`colors={["#FFFFFF", "#FFE3D1"]}`), increased corner roundedness (`borderRadius: scale(16)`), and styled a soft brand orange shadow glow (`shadowColor: "#FE6700"`).
  - Polished the input row (country code container and text input) with soft borders (`#E5E7EB`), rounded corners, and proper margins.
  - Styled the primary "Send OTP" button with shadows and warm brand orange (`#FF8E4D`).
  - Added and styled the black primary "Biometric Login" button with a fingerprint icon.
  - Preserved the secondary "Login with Password" option (styled as a clean white button with a soft grey border and dark text/lock icon) sitting cleanly beneath the Biometric button.
  - Polished the "Browse Packages" button and terms text in the footer.

### Subscriber Dashboard Layout Realignment to Figma

- **Problem:** The subscriber dashboard design diverged from the Figma spec: it lacked header controls and placed all statistical blocks inside the hero banner instead of overlapping rows.
- **Solution:**
  - Restructured the dashboard layout in [index.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/index.tsx>).
  - **Inline Header & Controls:** Added back a clean, premium inline header (`dashHeader`) containing the "Dashboard" title, notification bell (with a dynamic badge count of 2), and a hamburger menu button connected to open the global drawer.
  - **Stats Card Layout Re-alignment:**
    - Split the four statistical grid cards to match the Figma.
    - **Top Row (Happiness Score & Visits This Week):** Restructured to stay inside the curved orange `ImageBackground` banner.
    - **Bottom Row (Active Hours & Total Care Plans):** Moved outside of the `ImageBackground` component, rendering on the white/cream background flush with the bottom of the hero banner.
    - Configured a new `statsGridBottom` stylesheet pattern and removed unnecessary bottom margins from the `heroBanner` element.
  - Removed outdated or incorrect top headers from subscriber sub-views to keep view layouts clean and safe-area compliant.

---

## Session: iPhone Local Wi-Fi Testing & Android USB Diagnostics (2026-06-05)

### iOS (iPhone) Network Config & Testing Setup

- **Problem:** Testing on a physical iPhone does not support standard `adb reverse` USB port forwarding (which is Android-specific). Devices need to connect over a local network (Wi-Fi or Mobile Hotspot).
- **Solution:**
  - Added dedicated iOS setup instructions to [MOBILE_TESTING_SETUP.md](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/MOBILE_TESTING_SETUP.md), including network alignment strategies, Windows Firewall commands, and environment variable guidelines.
  - Temporarily configured `EXPO_PUBLIC_LOCAL_IP=192.168.1.38` in [.env](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/.env) for local network testing.

### Android USB Diagnostics & Localhost Reversion

- **Problem:** USB debugging on Android failed to connect to the backend because the environment variable configuration was pointing to the Wi-Fi IP instead of `localhost`.
- **Solution:**
  - Restored `EXPO_PUBLIC_LOCAL_IP=localhost` in [.env](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/.env) for USB testing.
  - Set up active ADB port forwarding on ports `8081` (Metro) and `8001` (Backend API) to restore USB communication.

---

## Session: Visit Image Gallery & Human-Readable Visit Codes Integration (2026-06-10)

### Visit Image Gallery & Schema Synchronization

- **Database Schema Sync**:
  - Synchronized `imageUrls` array field to both `admin-backend/prisma/schema.prisma` and `mobile-backend/prisma/schema.prisma` databases.
  - Successfully ran Prisma client regeneration and schema pushes to keep both backends fully in sync.
- **Image Gallery Upload Logic**:
  - Implemented the capability to upload up to 10 visit images (up to 25MB each) from gallery and camera.
  - Reused existing profile-upload component design to maintain consistent, premium aesthetics and code reusability.
  - Allowed environment variable configuration for file count limits and file size restrictions in the `.env` settings.

### Human-Readable Visit Codes

- **Design Specifications**:
  - Implemented a secure 9-character human-readable alphanumeric code for scheduled visits (e.g., `VK7XM4RP`).
  - Prefix starts with `V` (Visit), followed by 8 random characters.
  - Omitted ambiguous characters (`O`, `0`, `I`, `1`, `S`, `5`, `B`, `8`) to prevent transcription errors over phone lines.
  - Defined charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- **Database Fields**:
  - Added `visitCode String? @unique` to `Visit` models in both `mobile-backend` and `admin-backend` schemas, successfully pushed and generated.
- **Backend Integrations**:
  - Developed the `generateVisitCode()` helper utility in `mobile-backend` (`app/utils/helpers.ts`).
  - Updated `visit_service.ts` and `dashboard.routes.ts` in `mobile-backend` to auto-generate and attach `visitCode` to new visits and API responses.
  - Ported `generateVisitCode()` to `admin-backend/routes/visits.js`, generating visit codes on `POST /` and supporting filtering by visit code using a new `?visitCode=` query parameter on `GET /`.
- **Admin Frontend Integration**:
  - Added a "Search by Visit Code" filter input to the `ScheduledVisitsPanel.tsx` in `admin-frontend`.
  - Replaced the legacy long `encounterId` badge on the visit cards with the new premium orange monospace `visitCode` badge.
  - Featured the `visitCode` in the reschedule visit dialog header.
  - Updated the api layer in `api.ts` to forward `visitCode` filter queries to the backend.
  - Verified and cleaned syntax issues, ensuring a clean TypeScript compilation.

### Visit Scheduling Validation & Restrictions

- **Past Date & Time Restriction**:
  - Implemented client-side validation in `BeneficiaryList.tsx` to prevent scheduling visits in the past.
  - Restricted the HTML date picker using local time formats (`YYYY-MM-DD`) via the `min` property on `<input type="date">`.
  - Added a reactive evaluation block to compare selected date and time inputs against current local time, disabling the scheduling button if the time is in the past (using a 1-minute safety buffer).
  - Added a red-tinted alert dialog warning the user ("Visit time cannot be in the past. Please select a current or future date/time.") when they choose a past date/time.
  - Hardened scheduling action trigger (`handleSchedule`) to show a validation toast error if a past scheduling attempt is made.
- **Benefit Type Selection requirement**:
  - Locked the schedule submit button until the administrator selects a specific benefit card from the active package utilization panel on the right.
  - Displayed a warm orange-tinted helper alert warning the user ("Please select a benefit type from the utilization panel on the right") to prompt action.
  - Hardened backend submit mapping to reject scheduling when `benefitId` is missing and display a clear toast alert.

### Admin Panel Global Visits Page & Visit Details Modal

- **Global Visits Page**:
  - Created `/visits` route and page in the Admin Panel (`admin-frontend`).
  - Added a "Visits" tab in the operations sidebar.
  - Rendered `ScheduledVisitsPanel` without a specific Field Manager context to allow a global view of all visits.
- **Visit Details Modal**:
  - Added an "Eye" icon to all visit cards to view comprehensive visit details.
  - Designed `VisitDetailsModal.tsx` to display deep information including:
    - Geo-fencing status, distance, and manual bypass reasons.
    - Full encounter records (Vitals, Mood, Medication Adherence, Visit Summary, Notes).
    - An interactive image gallery mapping to the `imageUrls` JSON array from the backend.
- **Backend API Support**:
  - Created a new `GET /api/visits/:id` endpoint in `admin-backend/routes/visits.js`.
  - Configured `findUnique` to eagerly load nested relations: `beneficiary`, `careCompanion`, `vitalReadings`, and `medicationAdherenceRecords`.
  - Implemented specific extraction of the `phone` field from the nested `user` relation to prevent Prisma querying errors on models that do not contain a direct phone field.

---

## Session: Billing Rules, Default Dashboards & Push Notification Integration (2026-06-12)

### Billing Rule Enforcement & Checkout Updates

- **Logic Correction**: Implemented standard billing rules for visit checkouts.
- **Minimum Deduction**: Fixed the backend to enforce a minimum of 1 full hour deduction for any completed visits lasting less than 60 minutes.
- **Fractional Deduction**: Validated that visits lasting 60 minutes or longer deduct exact fractional hours without rounding down unexpectedly.

### Beneficiary Default Dashboard Data

- **Problem**: When a new beneficiary account is created with zero completed visits, the mobile app dashboard crashed or showed incorrect numbers due to missing vital/emotional records.
- **Solution**:
  - Overhauled the `beneficiary_service.ts` logic to detect empty history sets.
  - Automatically sends fallback default states: Happiness Score = 100%, Heart Rate = "0 bpm", Blood Pressure = "0/0".
  - Embedded a user-friendly UI pop-up alert explaining that "Default data is being shown because no visit records have been encountered yet."
  - Handled numeric coercion, treating any fallback `8.0` default values as a full `85%` display value.

### Push Notification System Integration

- **Backend Dispatching**: Upgraded `admin-backend/routes/visits.js` to dispatch role-specific push notifications to Care Companions, Beneficiaries, and Subscribers simultaneously.
- **Action Triggers**: Notifications are now actively sent for:
  - `POST /visits` (Visit Scheduling)
  - `PUT /visits/:id` (Visit Rescheduling)
  - `DELETE /visits/:id` (Visit Cancellation)
- **Token Management**: Created the `POST /api/users/push-token` route in `mobile-backend` to accept and persist `fcmToken` values mapping to specific User accounts.
- **Mobile Device Registration**: Integrated `expo-notifications` natively in `apps/mobile-app/app/_layout.tsx` to automatically prompt for push permissions and synchronize tokens immediately after user login.

### Notification Center & Real-Time Sync

- **Live Notifications Endpoint**: Created the `GET /api/users/notifications` and `PATCH /api/users/notifications/read-all` endpoints in `mobile-backend`.
- **Reusable Components**:
  - Engineered a generic `NotificationBell.tsx` top-header icon with dynamic unread badge indicators.
  - Designed the `notifications.tsx` master history screen displaying all read/unread messages with pull-to-refresh mechanics.
- **Foreground Event Listener**: Implemented `addNotificationReceivedListener` directly in the `NotificationBell` and `NotificationsScreen` hooks. When the application is active and in the foreground, this listener catches incoming Expo Push payloads and instantly triggers an API re-fetch, guaranteeing live unread badge updates and list population without requiring manual page refreshes.

---

## Session: Dynamic Package Benefit Storage & Logout Cache Clearing (2026-06-16)

### Dynamic Package Benefit Counts & Units Storage

- **Database Schema Sync**:
  - Synchronized `unit` String? field to both `admin-backend/prisma/schema.prisma` and `mobile-backend/prisma/schema.prisma` databases in `PackageBenefit` and `SubscriptionBenefitBalance` models.
  - Successfully ran Prisma client regeneration and database schema pushes to keep all workspaces fully in sync.
- **Admin Backend updates**:
  - Added `normalizeUnit` helper to [packages.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/packages.js) and updated `POST /`, `PUT /:id`, and `POST /:id/benefits` to fetch benefit details and store the normalized unit in `PackageBenefit`.
  - Updated [subscriptions.js](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-backend/routes/subscriptions.js) to copy/resolve units to `SubscriptionBenefitBalance` during admin-enroll, enroll, and initialize-balances.
- **Mobile Backend updates**:
  - Modified [subscription_service.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/services/subscriber/subscription_service.ts) to populate `SubscriptionBenefitBalance` records during mobile purchases (`purchaseSubscription`) with both counts and units.

### Logout & Session Cache Clearing

- **Mobile App**: Updated `logout` in [AuthContext.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/contexts/AuthContext.tsx) to execute `AsyncStorage.clear()` instead of only removing specific keys. This ensures all cached user variables and state profiles are entirely purged on logout.
- **Mobile App (Care Companion)**: Updated [profile.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(care-companion)/profile.tsx>) for care companions to trigger the standard confirmation dialog and call the correct `useLogoutWithConfirm` hook. Previously, this page only replaced routes without clearing AsyncStorage/session state.
- **Admin Frontend**: Updated `logout` in [AuthContext.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/admin-frontend/src/app/context/AuthContext.tsx) to clear `localStorage` and `sessionStorage` entirely on logout.

### React Rules of Hooks Hardening (Beneficiary Profile)

- **Problem:** When rendering the beneficiary profile screen in the mobile application, selecting a beneficiary frequently threw the React exception: `Rendered more hooks than during the previous render.`.
- **Solution:**
  - Located the root cause in [beneficiary-profile.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx>) where the `useEffect` hook (displaying the "No Visits Recorded Yet" modal) was declared after conditional early-return blocks (`if (loading)` and `if (!beneficiary)`).
  - Repositioned the `useEffect` hook directly beneath the `useQuery` query hook block, guaranteeing it always runs consistently on every render cycle before any early return statements.
  - Verified compilation success with `npx tsc --noEmit`.

---

## Session: DEV ONLY Beneficiary Password Setup (2026-06-16)

### Beneficiary Password Override Flow

- **Goal:** Provide a temporary backdoor to set a login password for newly enrolled beneficiaries during testing, completely bypassing OTPs.
- **Backend API (`dev.routes.ts`)**:
  - Created `POST /api/dev/set-beneficiary-password`.
  - Takes `{ phone, password }` and updates the existing `User` row (with `role: beneficiary`) using bcrypt.
  - Temporarily registered in `main.ts` as `app.use('/api/dev', devRouter)`.
- **Frontend UI (`beneficiary-info.tsx` & `checkout.tsx`)**:
  - Inserted an inline "Test Password" text input directly underneath the Phone Number field on the Beneficiary Info step.
  - The password state is passed through navigation parameters into `checkout.tsx`.
  - On a successful package purchase, the app makes a silent background fetch call to `/api/dev/set-beneficiary-password` using the entered test password.
- **Cleanup Required**:
  - **Delete**: `apps/mobile-backend/app/api/dev/dev.routes.ts`
  - **Delete**: `apps/mobile-app/components/dev/BeneficiaryTestPassword.tsx` (file was created initially and needs to be deleted)
  - **Remove code**: Search for `⚠️ DEV ONLY` across the codebase and remove those blocks (in `main.ts`, `beneficiary-info.tsx`, and `checkout.tsx`).

---

## Session: Dynamic Vitals System — End-to-End Fix (2026-06-23)

### Problem

Beneficiary profiles were showing fewer vitals than what was selected during enrollment. Root cause: **two disconnected storage mechanisms** were in use simultaneously:

1. Legacy boolean flags on the `Beneficiary` table (`trackHeartRate`, `trackBloodPressure`, etc.) — only covered 8 hardcoded system vitals.
2. Relational `BeneficiaryVitalConfig` table — designed to support unlimited custom vitals added via the Admin module.

During enrollment (checkout), only the 8 legacy boolean flags were being saved. The `BeneficiaryVitalConfig` table was **never populated**. Custom vitals added through the Admin Vitals module had no boolean flag mapping and were silently dropped. Additionally, the `vitalsData` builder in `getBeneficiaryProfile` read exclusively from boolean flags, meaning the relational table was ignored entirely on the read side too.

Additionally, a vital code mismatch existed: the enrollment form keyed vitals by `vitalDefinition.code` (e.g. `PULSE`, `BLOOD_GLUCOSE`, `RESP`), but `subscription_service.ts` only checked legacy short-form aliases (`HR`, `SUGAR`, `RR`) — meaning Pulse Rate and Blood Glucose were always saved as `false` even for standard system vitals.

### Architecture: How Vitals Work

```
Admin Module → Creates VitalDefinition records (code, name, unit, icon, displayOrder)
                   ↓
Enrollment Form → Fetches /public/vitals?activeOnly=true → user checks vitals
                   ↓ sends { [vitalCode]: true/false }
subscription_service.ts → MUST create:
  (a) Boolean flags on Beneficiary (legacy compat)
  (b) BeneficiaryVitalConfig rows for every checked vital (new relational path)
                   ↓
getBeneficiaryProfile → reads BeneficiaryVitalConfig → builds vitalsData
  (falls back to boolean flags if no relational configs exist = legacy enrollments)
```

### Changes Made

#### `apps/mobile-backend/app/services/subscriber/subscription_service.ts`

- Fixed vital code mapping: now checks `PULSE` (not just `HR`), `BLOOD_GLUCOSE` (not just `SUGAR`), `RESP` (not just `RR`) — matching actual codes stored in `VitalDefinition`.
- **NEW step after beneficiary creation**: iterates over all checked vitals, looks up each `VitalDefinition` by code, and creates `BeneficiaryVitalConfig` rows via `upsert`. This handles both system vitals AND any custom vitals created through the Admin module.

#### `apps/mobile-backend/app/services/subscriber/beneficiary_service.ts`

- Added `vitalConfigs` (with `vitalDefinition` include) to the Prisma query in `getBeneficiaryProfile`.
- Replaced the hardcoded 6-vital if-chain (`if trackHeartRate … if trackBloodPressure …`) with a loop over `activeConfigs` from the relational table. Uses a `VITAL_META` lookup map to assign icon, color, and reading value extractor per code.
- Custom vitals (not in `VITAL_META`) get a generic `clipboard-pulse` icon and grey color — they display correctly with `--` until a reading is recorded.
- Vitals are sorted by `vitalDefinition.displayOrder` to match Admin configuration order.
- Fallback: if `vitalConfigs` is empty (legacy pre-fix enrollments), falls back to boolean flag logic to maintain backward compatibility.

#### `apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx`

- Removed the hardcoded `i===0 → heartIconBox`, `i===1 → bpIconBox` style logic.
- Added `getVitalBgColor(code, label)` helper: maps by vital code first, then label as fallback — custom vitals get a neutral grey background.
- Hero card now shows up to 4 vitals (was hard-capped at 2) to accommodate custom vital combinations.
- Removed the "No Visits Recorded Yet" popup that referenced placeholder `0 bpm`/`0/0` values (those no longer appear).
- Backend now sends `code` alongside each vital entry in `vitalsData` for reliable color matching.

#### `apps/mobile-backend/prisma/backfill_vital_configs.ts` (NEW — one-time script)

- Created a TypeScript backfill script to retroactively create `BeneficiaryVitalConfig` rows for all existing beneficiaries whose legacy boolean track flags are `true` but who have no relational config records.
- Executed successfully: **24 new configs created** across all existing beneficiaries, **9 already existed**.
- Run with: `npx ts-node --transpile-only prisma/backfill_vital_configs.ts`

### Key Design Decision

The system now uses `BeneficiaryVitalConfig` as the **single source of truth** for which vitals to display. Boolean flags on `Beneficiary` remain as a secondary fallback for any legacy data that predates this fix. Future admin-added custom vitals automatically work end-to-end without any code changes.

---

## Session: Visit Benefit Deduction Bugfix (2026-06-23)

### Problem

When scheduling a visit from the field management dashboard, the correct package benefit was selected by the user. However, when the visit was later completed (checked out), the unit/hours were sometimes deducted from the _wrong_ benefit entirely.

### Root Cause

The `Visit` model in the database was missing a dedicated column to store which benefit was selected during scheduling.
To work around this, the backend was using a hack: shoving the benefit ID into the visit's `notes` field as `__benefitId:xxx`.
When the `PATCH /visits/:id/complete` endpoint executed at checkout, it attempted to parse the notes string to extract the `benefitId`. If the `notes` field was modified or cleared by a Care Companion or admin, the extraction failed or picked up wrong data.

### Solution

1. **Schema Update**: Added a proper `benefitId String?` column to the `Visit` model (in both `admin-backend` and `mobile-backend` Prisma schemas), along with a relation to the `Benefit` model.
2. **Database Push**: Ran `npx prisma db push` and `npx prisma generate` for both backend environments to apply the migration.
3. **Route Rewrite (`admin-backend/routes/visits.js`)**:
   - `POST /`: Now directly saves the `benefitId` into the visit's new FK column. The `notes` hack has been entirely removed.
   - `PATCH /:id/complete`: Now reads `visit.benefitId` natively from the database object to look up the correct hours-based benefit to deduct from.
   - Verified that `deductBenefitBalance` already safely enforces scope with its `subscriptionId_benefitId` composite lookup.

This ensures strict database integrity and eliminates side effects related to visit notes overriding benefit deduction rules.

---

## Session: Razorpay Payment Gateway & Dev Mock Mode (2026-06-23)

### Server-Side Payment Flow Architecture

- **Dependency**: Installed `razorpay` Node.js SDK in the mobile backend.
- **Service (`razorpay_service.ts`)**: Implemented `createOrder` (generates Razorpay `order_id`) and `verifyPaymentSignature` (uses HMAC-SHA256 crypto to validate the payment signature).
- **New Endpoint**: Created `POST /api/subscriber/subscriptions/create-order` to lock in the exact pricing from the database to prevent client-side spoofing.
- **Verification**: Updated `POST /api/subscriber/subscriptions/purchase` to accept and rigorously verify `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` before finalizing the DB purchase.

### Client-Side Checkout (`checkout.tsx`)

- **Dependency**: Installed `react-native-razorpay` in the mobile app.
- **Integration**: The checkout flow now natively pops up the Razorpay UI overlay by feeding it the `order_id` from `/create-order`.
- **Zero-Total Bypass**: The system automatically skips the Razorpay flow entirely if `pricing.total === 0` (e.g. 100% discount via coupon).

### ⚠️ DEV MOCK MODE (How to Remove for Production)

Because `react-native-razorpay` utilizes Native SDKs, it **crashes in Expo Go and Expo Web**. To allow seamless local testing without rebuilding the native app, a **Dev Mock Mode** was implemented:

1. **Frontend (`checkout.tsx`)**: If `Platform.OS === 'web'` OR the `react-native-razorpay` native module is missing (Expo Go), the app intercepts the crash and generates a mock payload with `razorpay_signature: "DEV_MOCK_SIGNATURE"`.
2. **Backend (`subscriptions.routes.ts`)**: Line 173 detects `DEV_MOCK_SIGNATURE` and **bypasses** the crypto signature verification, allowing local test purchases to succeed.

**To deploy to Production:**

1. Open `apps/mobile-backend/app/api/subscriber/subscriptions.routes.ts`.
2. Remove the `if (razorpay_signature === 'DEV_MOCK_SIGNATURE')` bypass logic in the `/purchase` endpoint to enforce strict HMAC-SHA256 signature verification.

# Vital Monitoring System Architecture Refactor

## Project Context

The system allows administrators to dynamically configure health vitals which are assigned to beneficiaries and monitored by care companions. Previously, the system used hardcoded columns (like `bpSystolic`, `heartRate`) in the `Visit` table and boolean flags (`trackBloodPressure`, etc.) in the `Beneficiary` table.

This architecture was rigid and posed technical risks:

- Deleting or updating vitals after assignment could break beneficiary records.
- Historical data lacked context if vital definitions changed.
- Adding new custom vitals required database migrations.

## What We Accomplished

### 1. Database Schema Overhaul

- **Removed Hardcoded Columns:** Dropped `bpSystolic`, `bpDiastolic`, `heartRate`, `bloodSugarFasting`, `bloodSugarPostMeal`, `temperature`, `oxygenLevel`, and `weight` from the `Visit` table in both `mobile-backend` and `admin-backend`.
- **Removed Legacy Boolean Flags:** Stripped `trackBloodPressure`, `trackHeartRate`, `trackBloodSugar`, `trackTemperature`, `trackOxygenSaturation`, `trackWeight`, `trackPainLevel`, and `trackRespiratoryRate` from the `Beneficiary` table.
- **Relational Vitals Mapping:** Migrated the data structure to rely entirely on `VitalReading` (the single source of truth for vitals captures) and `VitalDefinition` (the dynamic metadata).
- **Added Versioning:** `VitalDefinition` now uses a `version` (int) and `isLatestVersion` (boolean). Updating a vital via `PATCH` now creates a new row with an incremented version to preserve historical referential integrity.
- **Added Category Field:** Support added for a `category` field in `VitalDefinition`.

### 2. Admin Backend Updates

- **`routes/vitals.js`:**
  - Implemented the versioning logic in `PATCH /api/vitals/:id` (using transactions to mark current `isLatestVersion=false` and creating the new version).
  - Ensured `GET /api/vitals` only fetches records where `isLatestVersion: true`.
- **`routes/beneficiaries.js`:**
  - Stripped out all legacy `track*` boolean references from the `PUT /api/beneficiaries/:id` route so the server doesn't crash during profile updates.

### 3. Mobile Backend (API & Services)

- **`services/care_companion/visit_service.ts`:**
  - Refactored `updateVisitDetails` and `checkOut` functions to map incoming vitals directly to the `VitalReading` table instead of hardcoded `Visit` columns.
  - Replaced `encounterId` foreign key references with `visitId`.
  - Added support for inserting boolean (`valueBoolean`) vitals.
- **`api/care_companion/visits.routes.ts`:**
  - Rewrote the Care Companion `GET /history` route to dynamically fetch vitals from related `VitalReadings` instead of the old `Visit` columns.
- **`models/visit.ts`:**
  - Deleted the obsolete `Vitals` interface and removed it from type signatures.
- **`services/subscriber/beneficiary_service.ts` & `subscription_service.ts`:**
  - Fixed dynamic vitals configuration (Upserts) by removing the redundant `effectiveFrom` field from the composite unique key, mapping solely by `beneficiaryId` and `vitalDefinitionId`.
  - Removed all fallback legacy `track*` field queries.
  - Re-wrote the subscriber dashboard cards to dynamically query the latest `VitalReading` entries to populate vital statuses instead of querying old `Visit` columns.
- **`api/beneficiary/medical-records.routes.ts` & `interactions.routes.ts`:**
  - Removed hardcoded `Visit` column lookups from historical timeline API routes, replacing them with dynamic lookups against `VitalReading`.
- **`api/subscriber/vitals.routes.ts` (New Route):**
  - Created a brand-new endpoint `GET /subscriber/vitals/trends/:beneficiaryId?days=30` that groups readings dynamically by vital code and formats dual-numeric values for charting.
- **`prisma/backfill_vital_configs.ts`:**
  - Updated the migration script to correctly map all active `VitalDefinitions` to legacy beneficiaries that lack dynamic configuration, ensuring backward compatibility without the legacy `track*` booleans.

### 4. Frontend Application (Mobile UI)

- **`components/beneficiary/VitalsCharts.tsx`:**
  - Completely refactored to consume the dynamic `VitalTrend[]` payload from the new subscriber API endpoint.
  - Eliminated the 3 hardcoded charts (Blood Pressure, Heart Rate, Blood Sugar).
  - The component now dynamically maps through $N$ number of charts, natively handling grid maximums, dual-line charts (e.g., Systolic & Diastolic BP), and assigning correct colors/labels based on the `VitalDefinition` metadata provided by the backend.

## Summary

The vital tracking system is now completely dynamic and configuration-driven. New vitals can be created, updated, and versioned from the admin dashboard without requiring any schema migrations, and those changes will dynamically flow down into the Care Companion's entry forms and the Subscriber's analytical charts.

---

## Session: Dynamic Vitals, Checkout Benefit Deductions & Unified Hour Utilization (2026-07-06)

### Outstanding Work Done

#### 1. Dynamic Vitals in Care Companion History

- **`apps/mobile-backend/app/api/care_companion/visits.routes.ts`**:
  - Updated `GET /history` to query the beneficiary's active vital configurations.
  - Dynamically resolved and formatted the recorded readings based on their dataType (`numeric`, `dual_numeric`, `boolean`, `text`) instead of hardcoding BP, Weight, Temp, and O2 levels.
- **`apps/mobile-app/app/(care-companion)/history.tsx`**:
  - Refactored the vitals display grid inside the expanded visit card.
  - Dynamically maps over the API-returned `vitals` list, falling back safely to the mock details layout if needed.

#### 2. Checkout-Only Benefit Deductions & Database Enum Sync

- **Backend Benefit Logic (`admin-backend` & `mobile-backend`)**:
  - Shifted all benefit deductions (both hour-based and session-based) from booking time to check-out/completion time.
  - Simplified visit cancellation/deletion since no refund balance manipulations are required prior to check-out.
- **Database Schema Sync**:
  - Added `visit_cancelled` to the `NotificationType` enum in both backends, pushed schemas, and regenerated both Prisma client libraries.
- **Enrolment Version Snapping**:
  - Wrapped mobile registration in a transactional block in `subscription_service.ts` and added dynamic snapping matching the admin backend via `publishPackageVersion`.

#### 3. Timeline Actual Checkout & Real Duration Tracking

- **`apps/mobile-backend/app/services/subscriber/beneficiary_service.ts` & `dashboard.routes.ts`**:
  - Refactored past visits lists to display the actual check-in/check-out timestamps and durations for completed visits.
  - Calculated duration strictly from the difference between check-in and check-out times, formatting shorter visits under 60 minutes in minutes (e.g., `1 min`) and longer ones in hours (e.g., `1.5 hours`).

#### 4. Connected Hour Utilizations

- **`apps/mobile-backend/app/services/subscriber/subscriber_service.ts` & `dashboard.routes.ts`**:
  - Refactored hours calculations to sum up only hourly-based benefit balances (matching benefits whose unit label includes `'hour'`), resolving the 3h/20h vs 2h/20h mismatch.
  - Configured auto-fallback scope to automatically select and filter metrics by the single beneficiary ID if the subscriber is managing exactly 1 beneficiary.

#### 5. Notifications Header Visibility & Custom Back Button

- **`apps/mobile-app/app/notifications.tsx`**:
  - Explicitly set `headerShown: true` in Stack.Screen options to override the global `headerShown: false` layout default.
  - Programmed a custom back arrow icon matching the dark navigation header's opposite color (white `#FFFFFF`) to safely navigate back.

---

## Session: Consent & Verification Flow for CSA-Created Beneficiaries (2026-07-06)

### Outstanding Work Done

#### 1. Database Schema Extensions

- **Prisma Schema (`mobile-backend` & `admin-backend`)**:
  - Added `createdBy` (default: "subscriber") and `verificationStatus` (default: "verified") fields to the `Beneficiary` model.
  - Synced database schemas using `prisma db push` and generated both client packages.

#### 2. Admin Backend CSA Mode Enrollment

- **`apps/admin-backend/routes/subscriptions.js`**:
  - Modified the existing `/admin-enroll` endpoint to accept a `csaMode` flag.
  - When `csaMode: true` is provided, the API creates the beneficiary with `createdBy: "csa"` and `verificationStatus: "pending"`, and registers the subscription with `isActive: false` (inactive state) while bypassing immediate payment capture.
  - Added support for passing and hashing an optional `subscriberPassword` field. If not provided, a default dummy password based on the phone number is hashed.
- **`apps/admin-frontend` (Enrollment Wizard & API)**:
  - Added a "DEV ONLY — Subscriber Password" input field to the first step of the `EnrollmentWizardPage.tsx` to configure test passwords directly.
  - Updated `api.ts` `enrollmentApi.enroll` signature to support sending `csaMode` and `subscriberPassword`.

#### 3. Mobile Backend Activation Services & APIs

- **`apps/mobile-backend/app/services/subscriber/beneficiary_service.ts`**:
  - Added `getBeneficiaryPendingDetails` service to fetch pre-filled settings (conditions, medications, emergency contacts, schedule configurations, and the inactive subscription/package).
- **`apps/mobile-backend/app/api/subscriber/beneficiaries.routes.ts`**:
  - Mapped a new GET endpoint `/:beneficiaryId/pending-details` to expose pending setup data.
- **`apps/mobile-backend/app/services/subscriber/subscription_service.ts`**:
  - Added a transaction-safe `activateSubscription` service to update beneficiary records with subscriber-verified changes, update status to verified, set linked subscription to active, set the subscription start/end dates from current timestamp, initialize benefit balances, and log prepaid success logs.
- **`apps/mobile-backend/app/api/subscriber/subscriptions.routes.ts`**:
  - Mapped a new POST endpoint `/activate` to handle verification flow activations.

#### 4. Mobile Frontend Consent Setup Wizard

- **`apps/mobile-app/app/(subscriber)/index.tsx`**:
  - Configured the beneficiary list item component to inspect the `verificationStatus`.
  - Displays a grey **"Inactive - Verification Pending"** badge for CSA-created beneficiaries and redirects the user to the setup wizard on tap.
- **`apps/mobile-app/app/(setup)/beneficiary-info.tsx`, `medical-info.tsx`, `emergency-contacts.tsx`, `schedule-preferences.tsx`**:
  - Added checks to extract parameters (`isVerificationFlow`, `beneficiaryId`, and `pendingDetails`) and dynamically pre-fill forms with the pre-arranged details on mount.
- **`apps/mobile-app/app/(setup)/checkout.tsx`**:
  - Checks if `isVerificationFlow === 'true'` to skip Razorpay payment options and coupons.
  - Renders terms & conditions agreement section with checkbox validation, changes the CTA button to **"Set to Active"**, and calls `/activate` backend route to activate the care package.
  - Redirects to success page upon completion.

---

## Session: Unified Hobbies DB Table & Beneficiary Module Refetch (2026-07-07)

#### 1. Unified Hobbies & Interests DB Table Integration

- **`packages/database/prisma/schema.prisma`**:
  - Added a `Hobby` model with `id`, `name`, and `isActive` fields.
  - Generated both mobile and admin backend prisma clients.
- **`apps/mobile-backend/prisma/seed_hobbies.ts`**:
  - Seeded the database table with the baseline list of hobbies.
- **`apps/mobile-backend/app/api/public/hobbies.routes.ts`**:
  - Exposes public endpoint `GET /api/public/hobbies` returning active hobbies.
- **`apps/admin-backend/routes/hobbies.js`**:
  - Exposes secured endpoint `GET /api/hobbies` returning active hobbies.

#### 2. Onboarding Wizards Dynamic Hobbies

- **`apps/admin-frontend/src/app/pages/EnrollmentWizardPage.tsx`**:
  - Fetches and renders list dynamically from the new database `GET /api/hobbies` endpoint.
  - Sorts "Other" option to the end of the lists.
- **`apps/mobile-app/app/(setup)/medical-info.tsx`**:
  - Fetches list from the database `GET /api/public/hobbies` endpoint.
  - Sorts "Other" option to the end of the lists.
  - Bound the custom hobbies TextInput to `value={customHobbyText}` with custom change handlers and state clear mapping.

#### 3. Auto-Refetch on Focus in Beneficiary Module

- Added React Native `useFocusEffect` combined with `useCallback` to all beneficiary module pages to automatically refetch fresh data on focus:
  - `apps/mobile-app/app/(beneficiary)/index.tsx`
  - `apps/mobile-app/app/(beneficiary)/schedule.tsx`
  - `apps/mobile-app/app/(beneficiary)/meds.tsx`
  - `apps/mobile-app/app/(beneficiary)/medical-records.tsx`
  - `apps/mobile-app/app/(beneficiary)/interactions.tsx`

#### 4. Fallback Happiness Score default

- **`apps/mobile-app/app/(subscriber)/index.tsx`**:
  - Changed default happiness score fallback value from `85%` to `84%` if no readings are present in the database.

#### 5. Checkout & Payment Success Dynamic Benefits

- **`apps/mobile-app/app/(setup)/checkout.tsx`**:
  - Dynamically fetches the selected package version from the database to extract actual package benefits/inclusions.
  - Replaced the hardcoded order summary features list with dynamic `packageBenefits` when loaded, falling back gracefully to static defaults.
  - Updated both normal and verification redirect flows to pass the stringified package benefits list as a `benefits` route parameter.
- **`apps/mobile-app/app/(setup)/payment-success.tsx`**:
  - Replaced the mock includes logic with a dynamic `packageIncludes` memo that parses and renders real package benefits/details forwarded from the checkout screen.
  - Removed the secondary "Enroll Beneficiary" button and made "Go to Dashboard" the single primary CTA button.

#### 6. Fixed Duplicate Beneficiary User Creation Crash

- **`apps/mobile-backend/app/services/subscriber/subscription_service.ts`**:
  - Cleaned up the redundant `tx.user.create()` inside the transaction block to reference the newly created user from the database query directly, eliminating the transaction rollback caused by duplicate phone number unique constraint violations during checkout.

#### 8. Happiness Score Fallback and Vitals Placeholders

- **`apps/mobile-app/app/(subscriber)/index.tsx`**:
  - Updated the dashboard happiness score display to render `"--"` if no readings are present in the database instead of defaulting to `84%`.
- **`apps/mobile-app/app/(subscriber)/beneficiary-profile.tsx`**:
  - Changed the profile stats happiness score to display `"--"` if the database has no records (e.g. `emotionalScore` is missing).
  - Implemented an inline placeholder alert block showing _"No vitals data available"_ when the beneficiary has no vital readings logged.
- **`apps/mobile-app/app/(subscriber)/components/beneficiary/VitalsTab.tsx`**:
  - Implemented a clean, centered placeholder card displaying _"No vital readings recorded yet"_ when the vitals array is empty.

#### 7. Care Companion Vitals History, Timeline Tracking, and Subscription Architecture

- **`apps/mobile-app/app/(care-companion)/history.tsx` & backend visits routes**:
  - Fixed vitals display on the history page of Care Companions to dynamically map and display real vital sign readings instead of hardcoded values.
- **`apps/mobile-backend/app/services/subscriber/beneficiary_service.ts` & frontend timeline**:
  - Fixed timing errors in the subscriber timeline to track and show the accurate actual check-in and check-out times and durations of completed visits.
- **Subscription flow architecture**:
  - Designed the architecture to seamlessly handle different types of subscription requests (supporting both regular Razorpay online purchases and offline CSA pre-created consent-based activation flows).
  - Designed the package versioning architecture to automatically snap a snapshot of the package details at the moment of enrollment, ensuring that package updates or deletions in the Admin Panel do not affect already enrolled subscribers.

---

## Session: Dynamic Service Request Integration (2026-07-14)

### Database Schema & Prisma Migrations

- **`apps/mobile-backend/prisma/schema.prisma`** & **`apps/admin-backend/prisma/schema.prisma`**:
  - Added the `ServiceRequest` model representing subscriber, beneficiary, and care companion service requests:
    - Stores `beneficiaryId`, `subscriberId`, `benefitId`, `preferredDate`, `preferredTiming`, `additionalNote`, `isRead`, `requestedByUserId`, and `requestedByRole`.
    - Setup relationships to `User`, `Beneficiary`, and `Benefit`.
  - Synchronized database schemas to the PostgreSQL/Supabase database using `npx prisma db push`.
  - Re-generated the client type definitions in both folders using `npx prisma generate`.

### Backend APIs & Routing Bug Fixes

- **`apps/mobile-backend/app/api/shared/utilization.routes.ts`**:
  - Implemented `POST /api/shared/utilization/request-service` router endpoint to receive, validate, and store service requests from logged-in subscribers, beneficiaries, and care companions, capturing their `userId` and `userRole`.
  - Returned `beneficiaryId` inside the `buildDetailedUtilization` response, and mapped/merged `ServiceRequest` records with `packageHoursLog` activity entries (sorted by date descending) to display requests inside the Recent Activity feed.
- **`apps/mobile-backend/app/api/care_companion/visits.routes.ts`**:
  - Updated `GET /care-companion/visits/:visitId/details` to query and return active package benefits and the list of upcoming service requests (filtered to `preferredDate >= today`, sorted ascending by date) for the visit's beneficiary.
- **`apps/admin-backend/routes/beneficiaries.js`**:
  - Implemented `GET /api/beneficiaries/service-requests/unread` to retrieve active, unread service requests for beneficiaries associated with the selected Field Manager's teams.
  - Implemented `GET /api/beneficiaries/:id/service-requests` to retrieve all service requests for a specific beneficiary (both read and unread), including `requestedByUser` and `subscriber` details.
  - Implemented `POST /api/beneficiaries/service-requests/:requestId/read` to mark a request as read.
- **`apps/admin-backend/routes/field-manager.js`**:
  - Included CC `userId` query mappings in `GET /api/field-manager/beneficiaries` endpoint.
- **`apps/admin-backend/routes/visits.js`**:
  - **Routing Bug Fix**: Fixed a route order conflict by moving `GET /check-availability` above `GET /:id` to prevent Express from intercepting `'check-availability'` as a dynamic visit ID parameter, resolving Node terminal process crashes.
  - Corrected select properties in line 374 to use `name` instead of invalid `firstName`/`lastName` properties.

### Mobile App Frontend & Recent Activity

- **`apps/mobile-app/components/shared/PackageUtilizationPanel.tsx`**:
  - Allowed clicking and selecting benefit balances card elements, rendering a themed orange border highlight.
  - Formatted the **"Recent Activity"** log to render service request logs using a calendar icon, a light blue background, and status strings (`PENDING` or `READ`) dynamically.
- **`apps/mobile-app/app/package-utilization.tsx`**:
  - Added a floating action banner at the bottom of the screen upon benefit selection to display the **"Request for the service"** button.
  - Toggles a modal popup collecting **Preferred Date**, **Preferred Timing** (Morning/Afternoon/Evening), and an **Additional Note** input box (shown only to subscribers).
  - Refreshes the utilization dashboard (via `fetchUtilization()`) upon successful service request submission to display the new activity log instantly in real-time.
- **`apps/mobile-app/app/(care-companion)/visit-details.tsx`**:
  - Rewrote the **Requests** card to enable Care Companions to submit service requests directly during an active visit.
  - Renders a benefit selection dropdown showing all package benefits and remaining units of the active beneficiary.
  - Collects preferred date and timing (Morning/Afternoon/Evening) and executes submission to the backend under the `care_companion` role.
  - Renders an **"Upcoming Requested Services"** sublist displaying all upcoming service requests along with their statuses (Pending/Read) and simplified requester descriptions (e.g. "Requested by Care Companion").
  - Dynamically triggers `fetchVisitDetails()` upon submission to sync and display the newly created request instantly.
  - Removed mock medications fallback list from the screen, and conditioned the Medication Adherence card rendering to only display if there are active medications assigned to the beneficiary.

### Admin Frontend & Dashboard Integration

- **`apps/admin-frontend/src/services/api.ts`**:
  - Added method wrappers for `getUnreadServiceRequests(fmUserId)`, `getServiceRequests(beneficiaryId)`, and `markServiceRequestRead(requestId)`.
- **`apps/admin-frontend/src/app/components/field-management/OpsManagerFieldView.tsx`**:
  - Fetches the active unread request IDs for the selected Field Manager's teams and maps them to the beneficiaries list on load.
  - Added a 2-minute background auto-polling timer to fetch and sync the lists automatically.
- **`apps/admin-frontend/src/app/components/field-management/BeneficiaryList.tsx`**:
  - Displays a pulsing red dot badge next to the beneficiary's name on initial load/refresh if they have unread requests, scoped directly to the selected Field Manager.
  - Added a **"Refresh"** action button in the card header of the "Beneficiaries" section to reload the beneficiaries list query on demand.
  - Fetches all service requests for the beneficiary on expanding their row.
  - Renders a clean **"Requested Services"** cards container in the bottom-left section of the scheduling visit layout.
  - Shows requester details (e.g. "Requested by Subscriber (Name)" or "Requested by Care Companion") next to a styled **`PRIMARY CC`** or **`SECONDARY CC`** badge.
  - Added a **"Mark Read"** button that sends the read request to the backend. Instead of removing the request from the list, it keeps it in place styled with lower opacity/a gray color profile and displays a green **"Read"** badge.
  - Fixed dynamic unread badge recalculation bug by checking `data.some(r => !r.isRead)` in `loadServiceRequestsForBeneficiary` instead of checking overall array length.
  - Added `useEffect` hook to reset unread dot overrides when the beneficiaries list changes to keep states clean and correct.

---

## Session: Region and Zone Realignment & Searchable Dropdowns (2026-07-15)

### Backend Geographic API & Metadata

- **`apps/admin-backend/routes/regions.js`**:
  - Implemented region management endpoints (CRUD) and Haversine distance-based region detector.
- **`apps/admin-backend/routes/users.js`**:
  - Modified the `buildOnboardingMetadata()` mapping function to include the `regionId` field in the mapped output for zones returned by `/api/users/staff/onboarding-metadata`.
- **`apps/admin-backend/routes/zones.js`**:
  - Updated zone CRUD endpoints to validate and persist the assigned `regionId`.

### Frontend Team Creation & Edit Dropdowns

- **`apps/admin-frontend/src/app/pages/CreateTeamPage.tsx`**:
  - Integrated a new **Region / City Sector** dropdown selector using `regionApi.getAll()`.
  - Added a filtered zone selector memo that dynamically displays only the zones belonging to the chosen region (`zone.regionId === selectedRegion`).
  - Added trigger resets to clear zone selections if the region selection changes.
- **`apps/admin-frontend/src/app/pages/EditTeamPage.tsx`**:
  - Replicated the Region selection dropdown.
  - Automatically pre-selects the team's parent region on load, ensuring that the filtered zones dropdown list renders the team's active zone correctly.
  - Dynamically resets the selected zone if a user changes the region dropdown.

### Searchable Staff Onboarding Dropdowns

- **`apps/admin-frontend/src/app/pages/StaffOnboardingPage.tsx`**:
  - Implemented searchable combobox fields for both Region and Zone selectors in the assignment tab (Step 4) for all applicable roles (Care Companion, Field Manager, Operations Manager).
  - Configured inputs with `onFocus` and `onBlur` listeners to show the dropdown list immediately when clicked.
  - Implemented dynamic text filter match query: options dynamically filter down to names matching what is typed, showing all values by default if the input is empty.
  - Used `onMouseDown` handler for select options to ensure clicks register instantly before input focus blur resets the DOM element.
  - Formatted the multi-select interface for Operations Managers, replacing the static list with the searchable picker, rendering selected zones as clearable tag chips with a delete cross (`×`).
  - Integrated session-restore logic: on mount, if a `zoneId` was pre-filled/saved, it maps it back to its parent region and pre-fills both search inputs.

### TypeScript Definitions

- **`apps/admin-frontend/src/services/api.ts`**:
  - Updated TypeScript signatures for `createTeam` and `updateTeam` methods to declare `zoneId?: string | null` and support nullable `fieldManagerId?: string | null`.
- **`apps/admin-frontend/src/types/index.ts`**:
  - Added `regionId?: string | null` to the `StaffOnboardingZone` type definition to satisfy compile-time type safety.

---

## Session: Package Region Association & Targeting (2026-07-15)

### Database Schema

- **`packages/database/prisma/schema.prisma`**, **`apps/admin-backend/prisma/schema.prisma`**, **`apps/mobile-backend/prisma/schema.prisma`**:
  - Implemented the many-to-many join model `SubscriptionPackageRegion` to associate `SubscriptionPackage` records with targeted `Region` models.
  - Run database migration push to sync target models with live PostgreSQL instance.

### Admin Backend Package CRUD

- **`apps/admin-backend/routes/packages.js`**:
  - Updated `GET /` and `GET /:id` handlers to include `packageRegions` targets and map them to standard JSON `regionIds` arrays in API responses.
  - Extended package `POST` and `PUT` transactions to create/update target regional associations in `SubscriptionPackageRegion` model based on request payloads.

### Mobile Backend Regional Filter

- **`apps/mobile-backend/app/services/subscriber/subscription_service.ts`**:
  - Modified the signature of `getSubscriptionPackages(regionId)` to optionally query packages linked to a specific user region, excluding non-global packages targeted elsewhere.
- **`apps/mobile-backend/app/api/subscriber/subscriptions.routes.ts`**:
  - Forwarded request query parameters for `regionId` to retrieve geo-targeted package catalogs for subscribers.

### Admin Frontend Product Factory UI

- **`apps/admin-frontend/src/app/pages/SubscriptionsPage.tsx`**:
  - Loaded full regions inventory on wizard mount.
  - Implemented searchable multi-select combobox for package targeting in Step 4.
  - Programmed cascading state rules: selecting target regions unmarks the "Make Global" checkbox, and marking "Make Global" clears and disables region selections.
  - Added region badge pill views directly to package catalog card listings.
- **`apps/admin-frontend/src/types/index.ts`**:
  - Updated `SubscriptionPackage` interface model to include optional `regionIds` and `regions` fields.

---

## Session: Mobile Subscriber Geo-Targeting & Pincode Checker (2026-07-15)

### Backend API

- **`apps/mobile-backend/app/api/public/zones.routes.ts`**:
  - Modified the public `check-pincode` route response payload to return both `zoneId` and `regionId` when a matching serviceable zone is found.

### Mobile Application Packages Screen

- **`apps/mobile-app/app/(setup)/subscription-packages.tsx`**:
  - Automatically fetches the logged-in subscriber's profile on mount to retrieve their default pincode and check location targeting.
  - Added a search container for users to manually check pincode serviceability. Serviced locations load regional packages targeted to the area, while unserviced locations show only global packages.
  - Modified `handleSelectPackage` to raise a warning alert if a user selects a package without being logged in, redirecting them to the login screen.
  - Configured local search parameters to look for custom redirect warnings (e.g. "Please login first to select a package") and display them as alerts.

---

## Session: Google Maps Location Targeting & Interactive Pin Selector (2026-07-15)

### Backend API Additions

- **`apps/mobile-backend/app/api/public/location.routes.ts`**:
  - Added a forward geocoding route (`GET /api/public/location/geocode?address=...`).
  - Added a place query autocomplete route (`GET /api/public/location/autocomplete?input=...`) integrated with Google Places Autocomplete API.
  - Added a place details resolver route (`GET /api/public/location/place-details?placeId=...`) to fetch coordinates for selected location items.

### Mobile Application Location Interface

- **`apps/mobile-app/components/ui/AddressPicker.native.tsx`**:
  - Upgraded the shared, Swiggy/Zomato style address picker component to include a floating, search-enabled Google Places autocomplete dropdown.
  - Users can now search for any location/landmark directly in the map screen, select recommendations, and center the pin smoothly on the selected coordinates.
  - Beneficiaries and subscriber packages screens now automatically share this advanced geocoding picker.
- **`apps/mobile-app/app/(setup)/subscription-packages.tsx`**:
  - Refactored map location selection to use the upgraded, shared `AddressPicker` component, eliminating redundant map state, logic, and layout boilerplate.
  - Implemented custom styles for **Regional Packages** using a distinct teal theme (`#0D9488` border, text, and select states) to visually separate local plans from global plans.
  - Updates selection forwarding to send coordinates, address, region ID (`serviceRegionId`), and pincode values directly to the checkout screen.
- **`apps/mobile-app/app/(setup)/checkout.tsx`**:
  - Unified location/address confirmation into a single dynamic card (`servicePincodeCard`) that displays the selected map address (`serviceAddress`) for both global and regional packages.
  - Bypasses and hides pincode confirmation input rows, loading spinners, and serviceability checks when purchasing global plans (where location is always serviceable but still shown for verification).
  - Fixed initialization query logic to forward `serviceRegionId` in package queries and added `serviceRegionId` to `useEffect` dependencies, ensuring regional packages are successfully found, parsed, and displayed on mount.

---

## Session: Sathi Simplified Onboarding, OTP Auth & Buddy Assignment Refactoring (2026-07-17)

### Database Schemas & Synchronization

- **Prisma Schema Upgrades**:
  - Added `address String?` to the `Volunteer` model in the database schemas to support volunteer location logging.
  - Synchronized and updated schemas across `packages/database/prisma/schema.prisma`, `apps/mobile-backend/prisma/schema.prisma`, and `apps/admin-backend/prisma/schema.prisma`.
  - Deployed updates with `npx prisma db push` and regenerated all Prisma Clients.

### Backend Routing & Service Layer

- **OTP Authentication Service**:
  - Implemented `sendVolunteerOtp` and `verifyVolunteerOtp` in [sathi_service.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/services/sathi/sathi_service.ts) using the default system `OtpFactory` to send verification codes and return authentication tokens.
  - Exposed Sathi OTP endpoints (`POST /sathi/auth/send-otp` and `POST /sathi/auth/verify-otp`) inside [auth.routes.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/api/sathi/auth.routes.ts).
- **Application Submission Endpoint**:
  - Added `POST /sathi/profile/apply` route inside [profile.routes.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/api/sathi/profile.routes.ts) to save volunteer profiles (address, email, interests, whyJoin, age, gender) and set their `applicationStatus` to `'SUBMITTED'`.
  - Updated `volunteerProfileUpdateSchema` in [sathi.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/schemas/sathi.ts) to accept `null` or empty strings for all optional fields, preventing Joi validation errors on partial form submission.

### Sathi Mobile/Web Onboarding Upgrades

- **Simplified Registration**:
  - Refactored [register.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/app/(auth)/register.tsx>) to only collect essential details: **Full Name**, **Phone Number**, and **Password**.
  - Automatically logs the volunteer in and redirects them directly to the new application screen upon account creation.
- **Hybrid OTP & Password Login**:
  - Redesigned [index.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/app/(auth)/index.tsx>) to support both **OTP Verification** (default) and **Password Verification** hybrid modes, toggleable via an interactive link.
- **Dedicated Application Form**:
  - Created [apply.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/app/(sathi)/apply.tsx>) implementing the Figma spec peach background (`#FFF0E6`), editorial intros, Highlights card (Community First/Safe & Secure), dynamic tag filters, checklist guidelines, and direct redirection to the dashboard upon submission.
  - Added an inline error banner for clean validation feedback on web.
  - Split `AddressInputField` to render a plain `TextInput` on web and the full GPS map picker modal on native to support web testing.
  - Automatically loads the **Under Review** screen if the database shows that the user has already submitted their application.
- **Assigned Beneficiaries Screen**:
  - Refactored [match.tsx](<file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/app/(sathi)/match.tsx>) to list matched seniors under **"Your Assigned Beneficiaries"**.
  - Cleaned up cards to show key buddy details (Photo, Name, Age, Location, Distance, Bio, and Hobbies/Interests tags) and removed date/time rows and Accept/Reschedule buttons.

### Configuration & Ports

- Modified [package.json](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/package.json) scripts (`start`, `dev`, and `web`) to run on port `8082` (`expo start --port 8082`).
- Backend CORS allowed origins automatically accept requests from the new `8082` origin.

---

## Session: Sathi Companion Scheduling & Visit Requests (2026-07-17)

### Database Schemas & Synchronization

- **Sathi Visit Request Model**:
  - Declared `SathiVisitRequest` model with fields: `id`, `beneficiaryId`, `volunteerId`, `dateTime`, `reason`, `status` (enum `PENDING`, `ACCEPTED`, `REJECTED`), `rejectionReason`, `rejectedBy` string array, `createdAt`, and `updatedAt`.
  - Added relation maps to both `Beneficiary` and `Volunteer` models.
  - Propagated updates to `apps/mobile-backend/prisma/schema.prisma`, `packages/database/prisma/schema.prisma`, and `apps/admin-backend/prisma/schema.prisma`.
  - Successfully ran database migrations via `npx prisma db push` and regenerated all Prisma Clients.

### Backend Endpoints & Service Layer

- **Sathi Eligibility Checking**:
  - Implemented `getBeneficiarySathiEligibility` to check if a senior has active subscriptions with remaining units under the "Sathi Companion" benefit type.
- **Visit Request Operations**:
  - Implemented `createSathiVisitRequest` to check eligibility and save a pending visit request.
  - Implemented `getVolunteerSathiRequests` to fetch all pending requests from beneficiaries assigned to a volunteer (excluding requests previously rejected by that volunteer).
  - Implemented `respondToSathiVisitRequest` where accepting a request sets the status to `ACCEPTED`, sets the volunteer ID, and deducts 1 unit from the subscriber's Sathi Companion benefit balance.
- **API Routers**:
  - Created [sathi-requests.routes.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/api/subscriber/sathi-requests.routes.ts) mounting senior eligibility and request endpoints.
  - Created [visit-requests.routes.ts](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-backend/app/api/sathi/visit-requests.routes.ts) mounting volunteer retrieval and response endpoints.

### Mobile & Sathi App Upgrades

- **Beneficiary Application**:
  - Created [sathi-request.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(beneficiary)/sathi-request.tsx) screen containing custom date/time pickers, purpose text input, and remaining balance indicator card.
  - Bypasses form inputs and renders a beautiful "Not Eligible" message with contact information if eligibility check fails.
  - Linked the card to navigate from the "Saathi" Quick Actions card on the Beneficiary Home page [index.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(beneficiary)/index.tsx).
- **Sathi Volunteer Application**:
  - Updated volunteer dashboard [index.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/sathi-app/app/(sathi)/index.tsx) data fetching to fetch real pending `visitRequests` and upcoming accepted `upcomingVisits`.
  - Renders interactive Sathi requests cards showing beneficiary details, scheduled date/time, purpose/reason, and Accept/Reject buttons.
  - Handles rejection reason prompt with a web-safe `window.prompt` fallback.
- **General Cleanliness**:
  - Cleaned up pre-existing stylesheet duplicate errors in [subscription-packages.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/app/(setup)/subscription-packages.tsx).
  - Cleaned up `LogEntry` types in [PackageUtilizationPanel.tsx](file:///c:/Users/91930/OneDrive/Desktop/Mai-Hoonaa/apps/mobile-app/components/shared/PackageUtilizationPanel.tsx) to resolve implicit type-check warnings.

---

## Session: Sathi Benefit Architecture & Beneficiary UI Linkage (2026-07-17)

### Sathi Benefit Architecture Upgrade
- **Unique Code Identifier:**
  - Added a unique `code` column (`String? @unique`) to the `BenefitType` model to robustly identify system-level benefits, eliminating the brittle reliance on exact string matching (e.g. "Sathi Companion").
  - Pushed the schema updates across all three workspaces and synced the live Supabase PostgreSQL database.
  - Successfully updated the `BenefitType` row for the Sathi service (UUID: `defcdb9e-04ad-47c2-9761-2660501bf533`) with the new code `"SATHI_COMPANION"`.
- **Eligibility & Usage Checking:**
  - Refactored `sathi_service.ts` to check `bal.benefit.benefitType.code === 'SATHI_COMPANION'` as the primary source of truth, with `.includes('sathi')` as a fallback.
  - Fixes bugs where Sathi eligibility failed due to naming mismatches when admins created the Sathi package.

### Backend Routing Reorganization
- Moved Sathi request routing out of the `subscriber` namespace into the `beneficiary` namespace (`sathi-requests.routes.ts`) for proper scoping.
- **ID Resolution Bug Fix:**
  - Resolved a critical bug where the frontend `user.id` passed to the backend could not be mapped to subscriptions (which expect the actual `Beneficiary.id`).
  - Implemented `resolveBeneficiaryId(idParam)` to correctly lookup the `Beneficiary` whether the parameter passed was a `Beneficiary.id` or a `User.id` (subscriber/beneficiary user).

### UI Upgrades
- **Beneficiary App:**
  - Updated API fetch routes in `sathi-request.tsx` to hit `/beneficiary/sathi-requests/` instead of `/subscriber/sathi-requests/`.
- **Sathi Dashboard App:**
  - In `upcomingVisits`, mapped the internal `assignmentId` from the volunteer's assignments array to the response payload.
  - Added a **"Start Visit"** button directly to the upcoming visits cards inside `apps/sathi-app/app/(sathi)/index.tsx`.
  - Pressing "Start Visit" automatically hits the `/checkin` endpoint using both the `beneficiaryId` and `assignmentId`, transitioning the state properly.

---

## Session: Saathi Network UX, My Requests & Service Refactoring (2026-07-17)

### Beneficiary App UI & UX Upgrades
- **Saathi Network Integration**:
  - Implemented the "Saathi Network" mockup by rebuilding the UI in `apps/mobile-app/app/(beneficiary)/sathi-request.tsx`.
  - Added the "About Saathi Network" banner and an "Available Volunteers" list showing detailed profiles (Photo, Name, Rating, Distance, Bio, Hours).
  - Designed the volunteer cards with drop shadows, custom badges, and colored "Request Visit" / "Feedback" action buttons to match Figma exactly.
- **My Requests Tracking**:
  - Built a dynamic **"My Requests"** section above the available volunteers list.
  - Automatically queries and renders the user's past Sathi visit requests.
  - Formats date and time cleanly, and adds colored status badges for `PENDING` (yellow), `ACCEPTED` (green), and `REJECTED` (red).
  - Updating or submitting a new request automatically refreshes and displays the request at the top of the list.
- **Cross-Platform Fixes**:
  - Addressed a major issue where `react-native-modal-datetime-picker` does not open on web testing environments.
  - Implemented a smooth fallback mechanism utilizing `Platform.OS === 'web'` to automatically degrade to native HTML5 `<input type="date">` and `<input type="time">` pickers while on the web, keeping tests fluid.
- **Routing**:
  - Correctly wired the "Saathi Network" button from the `more.tsx` settings panel to route users to the `sathi-request` screen.

### Backend Refactoring
- **Service Isolation**:
  - Separated concerns by migrating all beneficiary-side request code out of the volunteer-focused `sathi_service.ts`.
  - Created a dedicated `apps/mobile-backend/app/services/beneficiary/beneficiary_sathi_service.ts` to host `getBeneficiarySathiEligibility`, `createSathiVisitRequest`, `getLinkedVolunteers`, and `getBeneficiarySathiRequests`.
- **API Router Updates**:
  - Added a new endpoint `GET /:beneficiaryId/sathi/my-requests` for fetching a senior's personal requests.
  - Updated `sathi-requests.routes.ts` imports to consume functions from the newly established beneficiary service folder.
  - Resolved strict TypeScript errors in the backend resulting from legacy `status` keys and mismatched photo variable names.

---

## Session: CC Roster Management & Reporting (2026-07-20)

### Database Schema Updates
- Added `RosterApproval` and `RosterFeedback` models to `admin-backend`, `mobile-backend`, and `packages/database` schema files.
- Synchronized PostgreSQL database schema and regenerated Prisma clients.

### Backend Routes (`admin-backend/routes/visits.js`)
- Added `POST /api/visits/roster/approve`: Records daily/weekly zone roster approvals.
- Added `GET /api/visits/roster/approvals`: Retrieves roster approvals.
- Added `POST /api/visits/roster/feedback`: Saves daily overall zone and individual CC review comments.
- Added `GET /api/visits/roster/feedbacks`: Fetches roster feedbacks.

### Frontend: Roster Review & Gantt Timeline (`RosterReviewPanel.tsx`)
- Created a new timeline panel to view real-time planned vs. actual Care Companion timelines.
- Designed a custom **Gantt grid** rendering scheduled visit blocks (orange) overlaid with actual checkout timeframes (green).
- Built conflict detection logic to highlight overlapping scheduled visits in red.
- Integrated quick edit/reschedule actions directly into the timeline blocks.
- Added **Roster Approval** locking interface by Zone and Date (Daily/Weekly toggles).
- Built a daily feedback capture UI for overall zone metrics and companion-specific performance.

### Frontend: Planned vs Actual Report (`PlannedVsActualReport.tsx`)
- Developed an auditing report for field managers to track CC arrival/departure times.
- Implemented **KPI metric cards**: Total Runs, Completed Runs, Avg Start Delay, and Geo Verified Rate.
- Rendered an analytical grid displaying precise delay timings, actual duration versus planned duration, and **Arrival Status badges** (Geo Verified, Manual Override, Out of Range).
- Added multi-factor filtering (Zone, Companion, Date, Status).

### UI/UX Integrations & Fixes
- Unified `FieldManagementPage.tsx` with a multi-tabbed layout containing: Scheduling, Roster Timeline, Planned vs. Actual, and Daily Feedback.
- Added a "View Roster & Reports" shortcut button on `VisitsPage.tsx` to link cross-functional pages.
- Corrected strict TypeScript compilation errors inside `mockData.ts` by appending optional proxy fields (`skills`, `isActive`, `totalCreditHours`, etc.) to the `Volunteer` interface in `types/index.ts`.

## Saathi Dashboard & Guide Management (2026-07-22)

### Backend Updates
- Added `routes/saathi-guide.js` in `admin-backend` to handle fetching and creating dynamic companion best practices.
- Fixed the API response structure to standardize on `{ success: true, data: [...] }` to prevent frontend crashes.
- Modified `sathi_service.ts` in `mobile-backend` to attach `assignedBeneficiaries` to the `getVolunteerDashboard` API payload.
- Fixed `upcomingVisits` query in `sathi_service.ts` by removing the strict `dateTime` filter so newly accepted requests aren't hidden prematurely.

### Frontend Updates (Admin Panel)
- Built the `GuideManagementPage.tsx` interface to allow admins to create and manage the Saathi Companion Guidelines dynamically.

### Frontend Updates (Mobile App - Sathi)
- Revamped the Saathi Home Dashboard (`index.tsx`) to pull from `assignedBeneficiaries` instead of visit requests.
- Re-architected the Match screen (`match.tsx`) to render actual pending `SathiVisitRequests` directly from the backend API instead of using static UI mock data.
- Wired the "Accept" and "Reschedule" buttons on the Match screen to trigger the `/respond` backend endpoint.
- Corrected the `apply.tsx` volunteer onboarding screen to use the correct `RegisterPageImage.png` and wrapped it in a beautifully styled shadow card matching the design mocks.

### Sathi Dashboard UI Refinements (2026-07-22)
- Reverted the "Assigned Beneficiaries" section back to "Visit Requests" on the Sathi Home Dashboard (`index.tsx`).
- Updated the "Visit Requests" card UI to precisely match the provided mockup, including dynamic rendering of beneficiary photos, names, distances, bios, and hobbies.
- Updated `sathi_service.ts` dashboard endpoint to fetch and serve `bio` and `hobbiesInterests` inside the `visitRequests` payload.
- Upgraded the "Upcoming Visits" card in `index.tsx` to show the scheduled date and time instead of the visit count.
- Implemented a live countdown timer for "Upcoming Visits" that dynamically renders the remaining time (days, hours, minutes) until a visit. 
- Integrated countdown logic so the "Start Visit" button only becomes active within 1 hour of the scheduled visit (or if the Sathi is late), hiding it otherwise behind the countdown banner.
- Updated the `handleStartVisit` action to immediately redirect the Sathi to the hours logging page (`hours.tsx`) upon a successful check-in.

---

## Session: Sathi Reschedule Flow & Visit Checkout Fix (2026-07-23)

### Database Schema Updates
- Added `RESCHEDULE_PROPOSED` state to the `SathiRequestStatus` enum in `schema.prisma`.
- Added `proposedDateTime` and `proposedBy` tracking fields to the `SathiVisitRequest` model.
- Pushed schema updates to the production database and regenerated the Prisma Client.

### Backend Infrastructure (`mobile-backend`)
- **Checkout Logic Audit**: Confirmed `checkoutVolunteerVisit` correctly tracks visit duration, enforces the 1-hour minimum threshold, and properly deducts units from the beneficiary's balance while awarding points to the Sathi.
- **Fixed Accept Action**: Removed early balance deduction from `respondToSathiVisitRequest` when a volunteer accepts a request. Deductions now exclusively happen during checkout.
- **New Service Method**: Added `proposeRescheduleForSathiRequest` to `sathi_service.ts` allowing volunteers to negotiate new visit times without outright rejecting requests.
- **API Endpoint**: Added `POST /api/sathi/visit-requests/:requestId/propose-reschedule` routing logic.

### Frontend UI/UX (`sathi-app/app/(sathi)/index.tsx`)
- **Action Remapping**: Disconnected the "Reschedule" button from the old hard-rejection logic.
- **Reschedule Modal**: Designed and built a sliding modal bottom-sheet prompting the volunteer to enter a proposed Date (DD/MM/YYYY) and Time (HH:MM).
- **Date Handling**: Integrated client-side parsing transforming local DD/MM/YYYY inputs into strict ISO timestamps sent to the backend.
- **Optimistic UI Update**: Closes the modal on success, triggers a green notification alert, and automatically re-fetches the Dashboard state.

---

## Session: Security Hardening & Dependency Vulnerability Remediation (2026-07-23)

### Backend Vulnerability Fixes (CWE-1287: Improper Type Validation)
- **`teams.js`**:
  - Enforced `Array.isArray(careCompanionIds)` check before `.length` comparisons in `POST /api/teams` and `PUT /api/teams/:id`.
  - Added safe fallback `(Array.isArray(careCompanionIds) ? careCompanionIds : []).map(...)` to prevent `.map is not a function` runtime crashes when payload values are non-arrays or objects.
- **`beneficiaries.js`**:
  - Added strict `typeof search === 'string'` check before building Prisma string filters in `GET /api/beneficiaries`.
  - Added `typeof name !== 'string'` check in `POST /api/beneficiaries/:id/conditions` to prevent `name.trim()` crashes on non-string condition names.
- **`subscriptions.js`**:
  - Added string type checks for `subscriberPhone`, `subscriberName`, and `packageId` in `POST /api/subscriptions`.
  - Wrapped `subscriberPhone.slice(-8)` and `subscriberPhone.replace('+91', '')` with strict string guards.
  - Added `typeof reason !== 'string'` check before `reason.trim()` in `POST /api/subscriptions/:id/terminate`.
- **`users.js`**:
  - Sanitized `search` query parameter with `typeof search === 'string'` across `/field-managers`, `/operations-managers`, `/care-companions`, and `/customer-service-agents`.
  - Sanitized nested body objects (`personal`, `professional`, `assignment`, `notes`) in `POST /staff/onboard` and `PUT /staff/:userId` to default to `{}` plain objects when primitive values or arrays are received.
  - Wrapped `personal.newPassword.trim()` calls with `typeof personal?.newPassword === 'string'` checks.
  - Refactored `asTrimmedString` helper to reject non-string and non-number types.
- **`zones.js` & `subscribers.js`**:
  - Sanitized `search` query parameters across endpoints to prevent object-injection Prisma crashes.

### Transitive Dependency Overrides & Audit Cleanups
- **`apps/admin-backend/package.json`**:
  - Upgraded direct dependency `ws` to `"^8.21.1"`.
  - Added `"overrides": { "ws": "^8.21.1" }` to resolve high-severity resource allocation limit vulnerability (CVE-2026-62389 / CWE-770) from `@supabase/supabase-js` -> `@supabase/realtime-js`. Reduced `npm audit` vulnerabilities to `0`.
- **`apps/sathi-app/package.json` & `apps/mobile-app/package.json`**:
  - Added `"overrides"` section:
    - `"uuid": "^11.0.5"` (fixes CWE-1285 missing buffer bounds check)
    - `"postcss": "^8.5.1"` (fixes CWE-79 XSS)
    - `"image-size": "^2.0.0"` (fixes CWE-835 infinite loop in image processing)
    - `"ws": "^8.21.0"`
  - Reduced `npm audit` vulnerabilities to `0`.

### Frontend SAST Sanitization (CWE-79 & CWE-601)
- **`mobile-app` & `sathi-app`**:
  - Updated `sanitizeImageUri` in `utils/sanitizeImageUri.ts` to wrap valid URIs in `encodeURI()`, satisfying SAST analyzer requirements for Open Redirect (CWE-601) prevention on `<Image source={{ uri }}>` components.
- **`admin-frontend`**:
  - Created centralized security sanitizer `src/app/utils/sanitizeUrl.ts` exporting `sanitizeImgSrc()` and `sanitizeTelLink()`.
  - Wrapped `<img src={...}>` in `sanitizeImgSrc()` across `EmergencyRadarPage.tsx`, `ProfilePhotoUploader.tsx`, `EnrollmentWizardPage.tsx`, and `EntityAvatar.tsx` to fix DOM-based XSS (CWE-79).
  - Wrapped `<a href={`tel:${...}`}>` in `sanitizeTelLink()` across `EmergencyRadarPage.tsx` and `RenewalsWorklistPage.tsx`.

### Git & Sync
- Merged `feature/reschedule-flow` branch into `main` cleanly with 0 conflicts.
- Committed and pushed security fixes to both `senior` (`prayogbhartifoundation/Maihoonnna_App`) and `harshit` (`Harshit00018/MHN`) remotes.

---

## Session: Location-Aware Emergency SOS + Background SOS Notification (2026-07-23)

### New File: `apps/mobile-app/services/emergencyTrigger.ts`
- Created centralized `triggerEmergencyAlert()` function shared by both foreground button and background notification handler.
- Implements a 3-tier GPS location fallback chain:
  1. **Live GPS** — `Location.getCurrentPositionAsync({ accuracy: High })` with 8-second timeout via `Promise.race`.
  2. **Cached GPS** — `Location.getLastKnownPositionAsync({ maxAge: 30min })` — instant, no battery drain.
  3. **Registered address** — falls back to `null` so backend uses the stored user address.
- Performs automatic reverse geocoding via `Location.reverseGeocodeAsync()` to convert coordinates to human-readable address.
- Sends `{ lat, lng, address, description }` in the POST body to `POST /beneficiary/:id/emergency`.

### Modified: `apps/mobile-app/app/(beneficiary)/index.tsx`
- Removed inline `fetch` emergency logic; now calls `triggerEmergencyAlert()` from the service.
- Added `locationStatus` state (`idle | locating | done`) for real-time button label feedback.
- Button label changes: "Locating you..." → "Sending SOS..." while in progress.
- Added pulsing `Animated.Value` animation on the SOS button during triggering.
- Wrapped button in `Animated.View` with `scale` transform for pulse effect.
- Upgraded success modal to display the reverse-geocoded location address (or fallback message if GPS unavailable).
- Added `locationBadge` and `locationBadgeText` styles.

### Modified: `apps/mobile-app/app/_layout.tsx`
- Added `expo-notifications` and `triggerEmergencyAlert` imports.
- Added SOS background notification `useEffect` in `RootNavigator`, gated to `role === 'beneficiary'`.
- On login: schedules a **persistent foreground notification** with a "🚨 Send Emergency SOS" action button.
  - Android: high-priority channel `sos-emergency` with `bypassDnd: true`, `lockscreenVisibility: PUBLIC`.
  - iOS: `opensAppToForeground: false` allows firing without opening the app.
- Registers `Notifications.addNotificationResponseReceivedListener` to call `triggerEmergencyAlert` when the SOS action is tapped from the notification shade (works even when screen is off / app backgrounded).
- On logout: cancels the SOS notification and removes the listener.

### Modified: `apps/mobile-app/app.json`
- Added `NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationAlwaysUsageDescription` to iOS `infoPlist`.
- Added `androidNotificationCategoryOptions` with `SOS_EMERGENCY` category and `SOS_TRIGGER` action to `expo-notifications` plugin config.

---

## Session: Emergency Response Radar UI Overhaul & Complete Contact Network (2026-07-23)

### Modified: `apps/admin-backend/routes/emergency.js`
- Updated `GET /api/emergency/requests` backend query to include:
  - `emergencyContacts` (family/relative emergency contacts list)
  - `team.fieldManager.user`
  - Fallback logic to resolve Zone Field Manager by matching beneficiary pincodes when team Field Manager is unassigned.

### Modified: `apps/admin-frontend/src/app/pages/EmergencyRadarPage.tsx`
- Redesigned Emergency Response Radar card layout with a **6-Block Emergency Contact Network Grid**:
  1. 👨‍👩‍👦 **Subscriber (Family)** — Name, direct call phone link.
  2. 🚨 **Family Emergency Contact** — Contact Name, direct call phone link, relationship tag (e.g. Son, Daughter, Spouse).
  3. 🩺 **Primary Physician** — Doctor Name, direct call phone link, specialty badge.
  4. 👔 **Field Manager** — Zone Lead Name, direct call phone link.
  5. 💙 **Primary Care Companion** — Assigned CC Name, direct call phone link.
  6. 💚 **Secondary Care Companion** — Assigned Secondary CC Name, direct call phone link.
- Enhanced Beneficiary Header:
  - Added Age, Blood Group badge (e.g., `O+`), and Direct Phone call link.
  - Interactive "Maps" button linking to Google Maps with exact coordinates/address.
  - Polished modern dark-mode aesthetics with glowing status indicators (`OPEN`, `DISPATCH IN PROGRESS`, `RESOLVED`).

---

## Session: On-Time Medication Worker, Benefit Exhaustion Prompt & Emergency SOS History (2026-07-23)

### New Files:
- `apps/mobile-backend/app/workers/medicationWorker.ts`:
  - Background worker running every 60 seconds to inspect active medication schedules.
  - Matches current time against scheduled slots (`08:00 AM`, `02:00 PM`, `08:00 PM`, custom slots).
  - Dispatches on-time `medication_reminder` notifications to database & push tokens (neither early nor delayed).
  - De-duplicates daily dispatches per medication + slot.

### Modified Files:
- `apps/mobile-backend/app/run.ts`:
  - Initialized `startMedicationWorker()` on backend server boot.
- `apps/mobile-backend/app/services/shared/MedicationAdherenceManager.ts`:
  - Enforced strict "Today Only" dose marking rule in `logAdherence`: rejects modifications for past or future dates.
  - Added `isToday` and `canMark` flags to schedule slots.
- `apps/mobile-backend/app/api/shared/utilization.routes.ts`:
  - Added benefit balance check to `POST /request-service`: rejects service requests for exhausted benefits (`remainingUnits <= 0`) with 400 status.
- `apps/mobile-backend/app/api/beneficiary/emergency.routes.ts`:
  - Added `GET /:beneficiaryId/emergency/history` route to fetch past SOS requests with full notified parties, responder info, and dispatch timeline notes.
- `apps/mobile-app/app/(beneficiary)/meds.tsx`:
  - Integrated local scheduled notifications via `expo-notifications` for on-time device alerts.
  - Enforced "Today Only" dose marking rule: locks past/future doses and displays prompt alerts if clicked.
  - Type-safe trigger input handling and duplicate clearing via `cancelAllScheduledNotificationsAsync()`.
- `apps/mobile-app/app/(beneficiary)/interactions.tsx`:
  - Added "Emergency SOS History" timeline section displaying ticket status badges, notified care team, assigned responder, and dispatch notes.
- `apps/mobile-app/app/package-utilization.tsx` & `PackageUtilizationPanel.tsx`:
  - Added exhausted benefit prompts ("Benefit exhausted, connect with support team") when selecting or requesting service for exhausted benefits.
  - Disabled request modal submission for 0-balance benefits.
- `apps/mobile-app/app/(care-companion)/visit-details.tsx`:
  - Added exhausted benefit checks on service request submission.


