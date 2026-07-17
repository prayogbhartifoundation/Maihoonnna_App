# Feature Plan: Package Versioning & Benefit Deduction Architecture

## Objective
Establish a secure, audit-compliant, and contract-based package versioning system where subscriptions act as immutable contracts. When an admin modifies packages/benefits, existing subscribers retain their original agreement structure (snapshotting). Furthermore, streamline and secure the benefit deduction logic:
- **Visit-based benefits**: Pre-deducted at scheduling time to block over-scheduling.
- **Hour-based benefits**: Deducted at checkout (CC completes visit) based on exact duration.
- **Cancellation**: Full refunding of the specific benefit tied to the visit.

## System Design
- **Immutability (Treat Package as Contract)**: Any updates to packages/benefits must not modify current subscribers' balances. We achieve this by versioning `SubscriptionPackage` using `PackageVersion` and `PackageVersionBenefit` snapshot tables.
- **Dual-Mode Deduction (Precise Capacity Locking)**:
  - Visit-based: Units deducted on scheduling (locking the slot and confirming eligibility).
  - Hour-based: Units/hours deducted at checkout based on actual duration.
- **Precise Auditing**: Store the exact `benefitId` in the `Visit` record at scheduling time. This eliminates guessing during checkout and cancellation refunds.

## Database Schema
- **Modified**:
  - `Subscription`: Linked to `PackageVersion` instead of mutable package rows.
  - `SubscriptionBenefitBalance`: Snapshot-aware fields like `snapshotBenefitName` and `snapshotUnitLabel`.
  - `Visit`: Explicitly stores the scheduled `benefitId` (Foreign Key).
  - `PackageHoursLog`: Records transaction balances before and after utilization.
- **New Tables**:
  - `PackageVersion`: Immutable copy of `SubscriptionPackage` at the time of purchase.
  - `PackageVersionBenefit`: Immutable snapshot of package benefits at purchase time.

## APIs
- `POST /api/visits`: Check availability, write `benefitId` to the visit, pre-deduct 1 unit if visit-based.
- `PATCH /api/visits/:id/complete` (Admin) & `visit_service.ts` (Mobile): Complete checkout, deduct actual hours if hour-based.
- `DELETE /api/visits/:id`: Cancel visit, fetch the linked `benefitId` and refund exactly that balance from the subscription.
- `POST /api/packages`, `PUT /api/packages/:id`: Create/update packages, triggering publication of a new `PackageVersion`.
