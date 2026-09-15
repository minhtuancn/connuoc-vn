# Phase 2 Admin Auth/RBAC/Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deny-by-default bearer-token admin authentication, explicit RBAC and transactional audit logging for source/station/import mutations.

**Architecture:** PostgreSQL stores principals and only SHA-256 API-token digests. Nest guards authenticate and authorize admin routes; role capabilities remain code-defined. Admin repository mutation methods write the target change and append-only `audit_log` row in one transaction.

**Tech Stack:** Node 24, TypeScript 6, NestJS 12/Fastify 5, PostgreSQL/PostGIS 18, pg 8.23, Zod 4.6.5, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-15-admin-rbac-audit-design.md`

## Global Constraints
- No default or committed credentials.
- Raw bearer tokens are never persisted/logged/audited.
- Guarded admin routes deny by default if capability metadata is absent.
- Audit insert and mutable admin change share one database transaction.
- Public read routes remain anonymous.

---

### Task 1: Admin identity schema and deterministic RBAC contracts
**Files:**
- Create: `infrastructure/database/migrations/0003_admin_auth.sql`
- Modify: `services/api/scripts/db-smoke.mjs`
- Create: `services/api/src/modules/admin/admin.types.ts`
- Create: `services/api/src/modules/admin/admin-auth.ts`
- Create: `services/api/test/admin-auth.test.ts`

- [ ] Write role/capability/token-hash tests first.
- [ ] Add admin principals/token hash schema constraints/indexes.
- [ ] Implement fixed role capability mapping and SHA-256 helper.
- [ ] Verify unit + DB smoke.

### Task 2: Authentication/authorization guards
**Files:**
- Create: `services/api/src/modules/admin/admin.decorators.ts`
- Create: `services/api/src/modules/admin/admin-auth.repository.ts`
- Create: `services/api/src/modules/admin/admin.guards.ts`
- Create: `services/api/test/admin-guards.test.ts`

- [ ] Test missing/malformed/invalid token -> 401.
- [ ] Test deny-by-default route metadata and insufficient capability -> 403.
- [ ] Implement DB token lookup and sanitized actor attachment.

### Task 3: Transactional admin repository and routes
**Files:**
- Create: `services/api/src/modules/admin/admin.repository.ts`
- Create: `services/api/src/modules/admin/admin.controller.ts`
- Create: `services/api/src/modules/admin/admin.module.ts`
- Modify: `services/api/src/app.module.ts`
- Modify: `services/api/test/app.test.ts`

- [ ] Add read source/station/import routes.
- [ ] Add bounded source/station/import patch validation.
- [ ] Mutations lock target, update, audit and commit atomically.
- [ ] Generate/echo request correlation ID.
- [ ] OpenAPI documents admin auth/routes without changing public auth requirements.

### Task 4: PostGIS security/audit integration gate
**Files:**
- Create: `services/api/test/admin.integration.test.ts`
- Create: `.github/workflows/admin-integration.yml`

- [ ] Seed principals with viewer/operator token hashes only at runtime.
- [ ] Assert anonymous admin 401, viewer mutation 403, operator mutation 200.
- [ ] Assert public calendar/search remain anonymous.
- [ ] Assert audit actor/action/target/correlation/before/after for each mutation.
- [ ] Assert token plaintext never appears in persisted audit rows.

### Task 5: PR/merge gate
- [ ] Open draft PR linked to #30.
- [ ] Verify frozen install, lint/typecheck/test/build, PostGIS, queue, ingestion, public API and admin integration gates all green.
- [ ] Mark ready and merge only when all gates pass.
