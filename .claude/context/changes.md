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
    - Integrated `TooltipProvider` to explain *why* these actions are disabled ("System types are required for tracking").
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
["expo-notifications", {
  "icon": "./assets/images/group1.png",
  "color": "#FF7A00",
  "androidMode": "default",
  "androidCollapsedTitle": "MaiHoonNa Notifications"
}]
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

