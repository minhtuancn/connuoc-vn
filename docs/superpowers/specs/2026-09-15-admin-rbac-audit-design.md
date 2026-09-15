# Phase 2 Admin Auth/RBAC/Audit Design

## Scope
Implement issue #30 as the minimum secure administrative boundary for source, station and import management.

## Authentication
Admin clients authenticate with `Authorization: Bearer <high-entropy-token>`. The API hashes the presented token with SHA-256 and looks up only the hash in PostgreSQL. Raw bearer tokens are never stored. Tokens are provisioned outside the repository/database migrations; there are no default production credentials.

Persist:
- `admin_principals`: stable actor ID, display name, role, active flag.
- `admin_api_tokens`: principal FK, unique SHA-256 token hash, label, active flag, optional expiry, last-used timestamp.

## Roles and capabilities
Roles are fixed application contracts:
- `viewer`: `admin:read`
- `data-operator`: `admin:read`, `sources:write`, `stations:write`, `imports:annotate`
- `administrator`: all above plus `admin:manage`

Capabilities are resolved in code from the persisted role. Database rows cannot invent arbitrary capabilities.

## Nest guard/decorator pattern
- `AdminAuthGuard` requires a valid active unexpired bearer token and attaches a sanitized `AdminActor` to the request.
- `@RequireAdminCapabilities(...)` stores required capability metadata.
- `AdminCapabilityGuard` is deny-by-default: if a guarded route has no capability metadata, access is denied.
- Admin controller applies both guards at class level.
- Public controllers do not import/use admin guards and remain anonymous.

## Routes
Read routes (`admin:read`):
- `GET /v1/admin/sources`
- `GET /v1/admin/stations/:id`
- `GET /v1/admin/imports/:id`

Mutable routes:
- `PATCH /v1/admin/sources/:sourceKey` (`sources:write`): name, active flag, metadata merge.
- `PATCH /v1/admin/stations/:id` (`stations:write`): name, timezone, datum, metadata merge, optional coordinate pair.
- `PATCH /v1/admin/imports/:id` (`imports:annotate`): metadata merge only. Import status/count/provenance are not manually rewritten.

This intentionally avoids queue retry/reprocessing controls in #30; those belong to later operational workflow design.

## Audit transaction
Each mutable repository method executes:
1. `BEGIN`.
2. Lock and read target `FOR UPDATE` as `before_state`.
3. Apply bounded mutation.
4. Read/return `after_state`.
5. Insert `audit_log` in the same transaction with actor type/id, action, target type/id, request correlation ID, before/after JSON and request metadata.
6. `COMMIT`.

If audit insertion fails, the mutation rolls back. Existing `audit_log` append-only trigger continues to reject update/delete.

## Correlation IDs
Admin controller accepts optional `x-request-id`; when absent it generates a UUID. The same value is returned in `x-request-id` and written to audit rows.

## Security/error behavior
- Missing/malformed bearer token: 401 problem details.
- Unknown, inactive or expired token/principal: 401.
- Authenticated actor missing capability: 403.
- Unknown mutable target: 404.
- Bad patch: 400.
- Secrets/tokens never appear in error bodies, logs, audit metadata or repository fixtures.
- Token comparison is based on database lookup of deterministic SHA-256 digest; only high-entropy tokens are supported.

## Testing
Unit tests prove role-to-capability mapping, token hashing, guard deny-by-default and unauthorized/forbidden behavior.
A PostGIS integration gate provisions a temporary token hash at runtime, calls admin routes through Fastify, verifies viewer/operator differences, verifies public endpoints remain anonymous, and confirms before/after/correlation audit rows for mutations.
