# Phase 2 Public API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the five Phase 2 public read endpoints with normalized PostgreSQL provenance and deterministic tide/calendar engines.

**Architecture:** A Nest `PublicDataModule` owns HTTP + service + repository boundaries. PostgreSQL supplies normalized station/observation/model data; tide/calendar calculations remain in `@connuoc/tide-engine` and `@connuoc/lunar-calendar`. A dedicated integration workflow seeds PostGIS and verifies HTTP contracts/provenance.

**Tech Stack:** Node 24, TypeScript 6, NestJS 12/Fastify 5, PostgreSQL/PostGIS 18, pg 8.23, Zod 4.6.5, Swagger/OpenAPI, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-15-public-api-design.md`

## Global Constraints
- No tide or lunar formulas in service/controller code.
- Unknown/incompatible datum is explicit; never silently converted.
- Public endpoints expose provenance where source/model data exists.
- Internal station/source UUIDs remain private implementation details.
- Existing health endpoints continue to work without external infrastructure in unit smoke tests.

---

### Task 1: Tide model persistence
**Files:**
- Create: `infrastructure/database/migrations/0002_tide_models.sql`
- Modify: `services/api/scripts/db-smoke.mjs`

- [ ] Add schema assertions first to DB smoke.
- [ ] Add normalized `tide_models` and `tide_constituents` tables, constraints and indexes.
- [ ] Verify empty-database migrations + schema smoke.

### Task 2: Public repository/service contracts
**Files:**
- Create: `services/api/src/modules/public-data/public-data.types.ts`
- Create: `services/api/src/modules/public-data/public-data.repository.ts`
- Create: `services/api/src/modules/public-data/public-data.service.ts`
- Create: `services/api/test/public-data.service.test.ts`

- [ ] Write service tests first for station provenance, water-level pagination metadata, tide delegation/model provenance, and calendar conversion.
- [ ] Implement repository interface and service composition.
- [ ] Implement `PgPublicDataRepository` queries against normalized schema.
- [ ] Confirm service tests green.

### Task 3: HTTP controllers, validation, cache and OpenAPI
**Files:**
- Create: `services/api/src/modules/public-data/public-data.controller.ts`
- Create: `services/api/src/modules/public-data/public-data.module.ts`
- Create: `services/api/src/database/database.module.ts`
- Modify: `services/api/src/app.module.ts`
- Modify: `services/api/src/bootstrap.ts`
- Modify: `services/api/package.json`
- Modify: `services/api/test/app.test.ts`

- [ ] Add contract tests for five routes, structured 400/404 problem details, deterministic cache headers and OpenAPI path coverage.
- [ ] Add database provider lifecycle and public module registration.
- [ ] Implement controller/query validation with Zod and Swagger decorators.
- [ ] Preserve health tests without requiring PostgreSQL.

### Task 4: Real PostGIS API integration gate
**Files:**
- Create: `services/api/test/public-api.integration.test.ts`
- Create: `.github/workflows/public-api-integration.yml`

- [ ] Seed data source/raw/import/station/observations/tide model + constituents.
- [ ] Exercise search, station, tide, water-level and calendar through Fastify inject.
- [ ] Assert provenance, datum/unit/timezone, pagination/cache headers and problem details.
- [ ] Verify OpenAPI includes all public endpoints.

### Task 5: PR/merge gate
- [ ] Open draft PR linked to #29.
- [ ] Verify frozen install, lint/typecheck/test/build, PostGIS migration smoke, Redis/BullMQ, ingestion E2E and public API integration all green.
- [ ] Mark ready and merge only with all gates green.
