# API Service

NestJS 12 + Fastify REST/BFF service for Con Nước Việt.

## Phase 2 foundation

Implemented by #25:
- typed/fail-fast environment parsing,
- `/v1/health` liveness endpoint,
- `/v1/ready` readiness boundary,
- RFC-style `application/problem+json` errors,
- OpenAPI generation and Swagger UI under `/v1/docs`,
- graceful shutdown hooks,
- Fastify structured logging,
- service lint/typecheck/test/build integrated with repository commands.

The foundation intentionally does not require PostgreSQL or Redis to start. Issues #26 and #27 will add dependency-specific readiness checks when those modules exist.

## Local commands

```bash
pnpm install --frozen-lockfile
pnpm --filter @connuoc/api typecheck
pnpm --filter @connuoc/api test
pnpm --filter @connuoc/api build
pnpm --filter @connuoc/api start
```

Environment:

```text
NODE_ENV=development|test|production
API_HOST=0.0.0.0
API_PORT=3000
LOG_LEVEL=fatal|error|warn|info|debug|trace|silent
```

## Responsibilities
- Public station/location/tide/calendar endpoints.
- Authenticated user preferences/favorites in later phases.
- Drainage-site and decision-support endpoints.
- Admin APIs with RBAC.
- OpenAPI contract.
- Validation, rate limiting, cache semantics and audit hooks.

## Planned modules

```text
src/
├── common/
├── config/
├── modules/
│   ├── health/
│   ├── locations/
│   ├── stations/
│   ├── tide/
│   ├── hydrology/
│   ├── calendar/
│   ├── drainage/
│   ├── offline/
│   ├── exports/
│   ├── auth/
│   └── admin/
├── bootstrap.ts
├── openapi.ts
└── main.ts
```

## Layering rule

The API coordinates domain packages and repositories; it must not duplicate domain formulas. Deterministic tide/calendar/geo calculations stay in `packages/*`. Database, Redis, HTTP and framework dependencies stay in service/worker layers.
