# Feature Plan: Dynamic Subscription Package Integration

## Objective
Enable the creation of custom subscription packages from the Admin Portal that are dynamically loaded in the mobile application, removing hardcoded enum restrictions.

## System Design
- **Single Source of Truth**: Merging `Package` into `SubscriptionPackage` for unified management.
- **Dynamic Typing**: Replacing `SubscriptionType` enum with string-based identifiers.
- **Service Refactoring**: Updating all core backend services to handle the new dynamic schema.
- **Admin Compatibility**: Ensuring the "Product Factory" wizard remains functional with new database columns.

## Database Schema
- **Modified**: `SubscriptionPackage` (consolidated), `Subscription` (enum removed), `Payment` (enum removed).
- **Relations**: Updated `PackageBenefit` and `PackageDiscount` to point to the unified `SubscriptionPackage` model.

## APIs
- `GET /api/packages` - List all dynamic packages.
- `POST /api/packages` - Create new custom packages with benefits.
- `GET /api/benefit-types` - List available benefit categories.
- `GET /api/benefits` - List individual service benefits.

## Edge Cases
- **Legacy Field Matching**: Frontend sends `totalCost` while backend uses `basePrice`.
- **Enum Transitions**: Ensuring existing seeder and services don't break during the switch from `SubscriptionType` to `String`.
