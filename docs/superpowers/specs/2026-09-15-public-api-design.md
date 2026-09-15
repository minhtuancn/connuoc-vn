# Phase 2 Public API Design

## Scope
Implement issue #29 public read APIs on top of merged normalized ingestion and deterministic engines:
- `GET /v1/locations/search`
- `GET /v1/stations/:id`
- `GET /v1/stations/:id/tide`
- `GET /v1/stations/:id/water-level`
- `GET /v1/calendar`

## Architecture

### HTTP boundary
Controllers only parse/validate route/query values, set cache headers, and translate known domain/input failures to Nest HTTP exceptions. The global RFC-style problem-details filter remains the single HTTP error envelope.

### Public service
`PublicDataService` composes repository rows into stable response DTOs. It owns no SQL and no astronomical formulas. Tide calculations call `@connuoc/tide-engine`; calendar conversion calls `@connuoc/lunar-calendar`.

### Repository
`PublicDataRepository` is the read boundary over PostgreSQL. `PgPublicDataRepository` resolves station/search/observations/provenance and tide model rows. SQL uses public station IDs at the HTTP boundary while internal UUIDs stay private.

### Tide model persistence
Add `tide_models` and `tide_constituents` as normalized model storage. A tide model records station, optional source/import provenance, model/version, datum, unit, mean level, reference epoch and phase convention. Constituents are ordered deterministic rows with amplitude/phase/speed. `/tide` loads the latest enabled model and delegates prediction to `predictTide()`.

### Database provider lifecycle
Add a Nest database module with a `PG_POOL` provider created from `parseDatabaseEnvironment(process.env)`. The provider closes the pool on module destroy. Tests that do not need public DB routes keep using a lightweight app module override path; DB integration tests provide `DATABASE_URL`.

## Response/provenance rules
- Never expose internal UUIDs as public identifiers except opaque `importRunId` where provenance explicitly requires it.
- Observation provenance includes source key, import run ID, raw SHA-256, parser/normalizer versions, datum/unit, observed timestamp.
- Tide provenance includes model ID/version, source/import when available, datum/unit/timezone, reference epoch and generated timestamp.
- Unknown datum is represented as `null`; no silent datum conversion.
- Timestamps are UTC ISO-8601 strings. Station timezone is separately explicit.

## Query rules
- Pagination: `limit` integer 1..100, default 20; cursor is an opaque base64url token for search/water-level pagination.
- Location search requires `q` trimmed length >= 2 and searches station name/public ID/aliases.
- Tide requires `start`, `end` explicit ISO instants and `intervalSeconds` 60..3600; max horizon 7 days.
- Water-level optionally accepts `start`, `end`, `limit`, `cursor`; max range 31 days.
- Calendar requires `date=YYYY-MM-DD` and uses the Vietnamese lunar calendar rules.

## Cache/freshness semantics
- Station/search/calendar: `Cache-Control: public, max-age=300, stale-while-revalidate=600`.
- Tide: deterministic model output, `public, max-age=300, stale-while-revalidate=900`.
- Water-level: freshness-sensitive, `public, max-age=60, stale-while-revalidate=120`.
- Responses include `meta.generatedAt` and source/model/observation timestamps where applicable.

## Error semantics
- Invalid query/date/station ID shape: 400 problem details.
- Unknown station or missing tide model: 404 problem details.
- Incompatible/unsupported persisted tide model: 422 problem details.
- Database failures remain 500 through the global problem-details filter.

## Test gates
- Unit/contract tests validate query parsing, engine delegation and response provenance.
- Real PostGIS integration seeds normalized fixture data plus a harmonic model and exercises all five endpoints.
- OpenAPI must contain all five public paths.
- Existing CI, PostGIS migration smoke, Redis/BullMQ smoke and ingestion integration remain green.
