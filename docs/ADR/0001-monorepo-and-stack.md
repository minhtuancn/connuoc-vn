# ADR-0001: Monorepo and Initial Technology Stack

- Status: Accepted for foundation
- Date: 2026-09-14

## Context

The product requires Android/iOS, public web, admin, API, background ingestion/forecast jobs and shared deterministic domain engines. Multiple developers/agents should be able to work on bounded areas without loading the whole system.

## Decision

Use one monorepo with clear bounded directories:

- Flutter for `apps/mobile`.
- Next.js + TypeScript for `apps/web` and `apps/admin`.
- NestJS + TypeScript for `services/api`.
- Background worker services for tide, weather/hydrology and notifications.
- PostgreSQL + PostGIS as primary database.
- Redis for cache/queue coordination.
- Pure domain packages for tide, lunar calendar, drainage and geo logic.

## Why

- One source of truth for product/data contracts.
- Easier coordinated releases and schema changes.
- Domain packages can be tested independently.
- Flutter provides a single mobile codebase while retaining store-native distribution.
- PostGIS fits station/river/basin spatial queries.
- Modular monolith + workers avoids premature microservices.

## Constraints

- Engine packages must not import app/service/database code.
- UI must not import database schema directly.
- Cross-boundary contracts must be explicit and tested.
- JavaScript workspace tooling must not become a hard dependency for building the Flutter app.

## Consequences

Positive:
- consistent documentation/contracts,
- efficient parallel agent work,
- simpler early operations.

Negative:
- repository can become large,
- CI needs path filtering/caching,
- cross-stack tooling requires discipline.

## Revisit when

- repository scale materially hurts CI/developer workflow,
- independent deployment/security boundaries require repository separation,
- a service needs a different language/runtime for proven technical reasons.
