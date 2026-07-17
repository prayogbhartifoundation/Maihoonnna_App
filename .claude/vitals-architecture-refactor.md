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
